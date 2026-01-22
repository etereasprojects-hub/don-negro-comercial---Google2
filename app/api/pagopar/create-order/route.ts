
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;

    if (!PUBLIC_TOKEN || !PRIVATE_TOKEN) {
      return NextResponse.json(
        { error: "Tokens de Pagopar no configurados" },
        { status: 500 }
      );
    }

    const { orderId, customer, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    // 1. Calcular total y procesar items para v1.0
    // IMPORTANTE: Pagopar v1.0 espera precios y totales como strings
    let calculatedTotal = 0;
    const processedItems = items.map((item: any) => {
      const unitPrice = Math.round(Number(item.precio));
      const quantity = Math.round(Number(item.cantidad));
      const itemTotal = unitPrice * quantity;
      calculatedTotal += itemTotal;

      return {
        ciudad: "1", // Asunción por defecto
        nombre: item.nombre.substring(0, 80).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        cantidad: quantity.toString(),
        precio_unitario: unitPrice.toString(),
        total_monto: itemTotal.toString(),
        vendedor_telefono: "0981000000",
        vendedor_direccion: "Asunción",
        vendedor_direccion_referencia: "",
        vendedor_comercio: "Don Negro Comercial",
        vendedor_id: "1",
        vendedor_email: "ventas@donegro.com",
        categoria: "9" // Electrónica / Hogar
      };
    });

    // 2. Generar Token SHA1 v1.0: sha1(private_token + id_pedido + total_sin_decimales)
    const hashData = `${PRIVATE_TOKEN}${orderId}${calculatedTotal}`;
    const token = crypto.createHash('sha1').update(hashData).digest('hex');

    // 3. Limpiar datos del comprador
    const cleanPhone = (customer.phone || "").replace(/\D/g, "").substring(0, 20);
    const cleanDoc = (customer.documento || "").replace(/\D/g, "");

    const pagoparOrder = {
      token_publico: PUBLIC_TOKEN,
      token: token,
      comercio_pedido_id: orderId.toString(),
      monto_total: calculatedTotal.toString(),
      tipo_pedido: "VENTA-COMERCIO",
      descripcion_resumen: `Pedido_${orderId}`.substring(0, 80),
      compras_items: processedItems,
      fecha_maxima_pago: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 19).replace('T', ' '), // 3 días
      usuario: {
        nombre: (customer.name || "Cliente").substring(0, 45).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        apellido: "", // Campo obligatorio en v1.0 aunque sea vacío
        tel: cleanPhone || "0981000000",
        email: customer.email || "ventas@donegro.com",
        direccion: (customer.address || "Asunción").substring(0, 90).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        ruc: "", // Campo obligatorio en v1.0 aunque sea vacío
        documento: cleanDoc,
        tipo_documento: "1", // CI
        ciudad: "1"
      }
    };

    const response = await fetch("https://api.pagopar.com/api/comercio/1.0/generar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparOrder)
    });

    const result = await response.json();

    if (result.respuesta === "OK" && result.resultado && result.resultado.length > 0) {
      const paymentHash = result.resultado[0].data; 
      return NextResponse.json({ 
        url: `https://www.pagopar.com/pagar/${paymentHash}`, 
        hash: paymentHash 
      });
    } else {
      console.error("Error Pagopar API 1.0:", result);
      return NextResponse.json({ 
        error: "Error en la pasarela de pago", 
        details: result.resultado || result.respuesta 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Internal Error create-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
