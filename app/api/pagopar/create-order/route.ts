import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;

    if (!PUBLIC_TOKEN || !PRIVATE_TOKEN) {
      return NextResponse.json(
        { error: "Error de configuración: PAGOPAR_PUBLIC_TOKEN o PAGOPAR_PRIVATE_TOKEN no definidos en el servidor." },
        { status: 500 }
      );
    }

    const { orderId, customer, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    // 1. Calcular total y formatear items para v2.0
    let calculatedTotal = 0;
    const processedItems = items.map((item: any) => {
      const unitPrice = Math.round(Number(item.precio));
      const quantity = Math.round(Number(item.cantidad));
      const itemTotal = unitPrice * quantity;
      calculatedTotal += itemTotal;

      return {
        public_key: PUBLIC_TOKEN,
        id_producto: 1, // ID genérico requerido por la API
        nombre: item.nombre.substring(0, 80).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        descripcion: item.nombre.substring(0, 100),
        precio_total: unitPrice,
        cantidad: quantity,
        url_imagen: item.imagen_url || "",
        categoria: 9, // Electrónica/Hogar
        ciudad: 1     // Asunción
      };
    });

    // 2. Generar Token SHA1 v2.0: private_token + id_pedido + total.toFixed(2)
    // Importante: El total debe tener 2 decimales para el hash según documentación
    const totalFixed = calculatedTotal.toFixed(2);
    const hashData = `${PRIVATE_TOKEN}${orderId}${totalFixed}`;
    const token = crypto.createHash('sha1').update(hashData).digest('hex');

    // 3. Limpiar datos del comprador
    const cleanPhone = (customer.phone || "").replace(/\D/g, "").substring(0, 20);
    const cleanDoc = (customer.documento || "").replace(/\D/g, "");

    const pagoparPayload = {
      public_key: PUBLIC_TOKEN,
      token: token,
      id_pedido_comercio: orderId.toString(),
      monto_total: calculatedTotal, // Como número
      descripcion_resumen: `Pedido ${orderId} - Don Negro`.substring(0, 80),
      fecha_maxima_pago: new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
      comprador: {
        nombre: (customer.name || "Cliente").substring(0, 45).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        email: customer.email || "ventas@donegro.com",
        tel: cleanPhone || "0981000000",
        direccion: (customer.address || "Asunción").substring(0, 90).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        documento: cleanDoc,
        tipo_documento: 1, // 1 para CI
        ciudad: 1          // 1 para Asunción
      },
      compras_items: processedItems
    };

    const response = await fetch("https://api.pagopar.com/api/comercios/2.0/iniciar-transaccion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparPayload)
    });

    const result = await response.json();

    if (result.respuesta === "OK" && result.resultado) {
      const paymentHash = result.resultado; 
      // En v2.0 el resultado es el hash directamente
      return NextResponse.json({ 
        url: `https://www.pagopar.com/pagos/${paymentHash}`, 
        hash: paymentHash 
      });
    } else {
      console.error("Error Pagopar v2.0:", result);
      return NextResponse.json({ 
        error: "Error en la pasarela", 
        details: result.resultado || result.respuesta 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Internal Error create-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}