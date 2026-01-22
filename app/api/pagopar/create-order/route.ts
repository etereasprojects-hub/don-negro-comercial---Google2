import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint para el Paso #1 y preparación del Paso #2 de Pagopar API 2.0
 */
export async function POST(request: Request) {
  try {
    const PUBLIC_KEY = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!PUBLIC_KEY || !PRIVATE_TOKEN) {
      return NextResponse.json(
        { error: "Tokens de Pagopar no configurados en el servidor" },
        { status: 500 }
      );
    }

    const { orderId, customer, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    // 1. Preparar items y calcular total
    let calculatedTotal = 0;
    const processedItems = items.map((item: any, index: number) => {
      const unitPrice = Math.round(Number(item.precio));
      const quantity = Math.round(Number(item.cantidad));
      const itemTotal = unitPrice * quantity;
      calculatedTotal += itemTotal;

      return {
        ciudad: "1", 
        nombre: item.nombre.substring(0, 100).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        cantidad: quantity,
        categoria: "909",
        // Re-agregado: Pagopar exige public_key dentro de cada item para validar el JSON
        public_key: PUBLIC_KEY, 
        url_imagen: item.imagen_url || "",
        descripcion: item.nombre.substring(0, 100),
        id_producto: index + 1,
        precio_total: itemTotal,
        vendedor_telefono: "",
        vendedor_direccion: "",
        vendedor_direccion_referencia: "",
        vendedor_direccion_coordenadas: ""
      };
    });

    // 2. Generar Token SHA1 v2.0
    // Fórmula: sha1(token_privado + id_pedido_comercio + monto_total)
    const hashData = `${PRIVATE_TOKEN}${orderId}${calculatedTotal}`;
    const token = crypto.createHash('sha1').update(hashData).digest('hex');

    // 3. Payload para Pagopar
    const cleanPhone = (customer.phone || "").replace(/\D/g, "");
    const cleanDoc = (customer.documento || "").replace(/\D/g, "");

    const pagoparPayload = {
      token: token,
      comprador: {
        ruc: "",
        email: customer.email || "ventas@donegro.com",
        ciudad: "1",
        nombre: (customer.name || "Cliente").substring(0, 45),
        telefono: cleanPhone || "0981000000",
        direccion: (customer.address || "Asunción").substring(0, 90),
        documento: cleanDoc || "4444444", 
        coordenadas: "",
        razon_social: (customer.name || "Cliente").substring(0, 45),
        tipo_documento: "CI",
        direccion_referencia: ""
      },
      public_key: PUBLIC_KEY,
      monto_total: calculatedTotal,
      tipo_pedido: "VENTA-COMERCIO",
      compras_items: processedItems,
      fecha_maxima_pago: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 19).replace('T', ' '),
      id_pedido_comercio: orderId.toString(),
      descripcion_resumen: `Pedido #${orderId} en Don Negro`.substring(0, 80)
    };

    // 4. Iniciar Transacción en Pagopar (Paso #1)
    const response = await fetch("https://api.pagopar.com/api/comercios/2.0/iniciar-transaccion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparPayload)
    });

    const result = await response.json();

    if (result.respuesta === true && result.resultado && result.resultado.length > 0) {
      const paymentHash = result.resultado[0].data;

      // 5. ASOCIACIÓN (Paso #2): Guardar el hash en el pedido de Supabase
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
        await supabaseAdmin
          .from('orders')
          .update({ 
            payment_hash: paymentHash,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      // 6. Retornar URL de pago oficial
      return NextResponse.json({ 
        url: `https://www.pagopar.com/pagos/${paymentHash}`, 
        hash: paymentHash 
      });
    } else {
      return NextResponse.json({ 
        error: "No se pudo iniciar la transacción", 
        details: result.resultado || result.resultado_texto || "Error de validación comercial"
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error crítico en integración:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}