import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { orderId, customer, items, total } = await request.json();

    const PUBLIC_TOKEN = "77b2b4f7997450ba3c28b85be8d9b066";
    const PRIVATE_TOKEN = "8f4d9f126e97a13f1eed82b9048f4e02";

    // En Paraguay (Guaraníes) no existen los decimales. 
    // Forzamos a entero para evitar discrepancias en la generación del Hash.
    const finalTotal = Math.round(total);

    // Generar Token SHA1 de seguridad según documentación Pagopar v1.1
    // sha1(token_privado + id_pedido_comercio + monto_total)
    const hashData = `${PRIVATE_TOKEN}${orderId}${finalTotal}`;
    const token = crypto.createHash('sha1').update(hashData).digest('hex');

    const pagoparOrder = {
      token: token,
      token_publico: PUBLIC_TOKEN,
      comercio_pedido_id: orderId.toString(),
      monto_total: finalTotal,
      tipo_pedido: "VENTA-COMERCIO",
      descripcion_resumen: `Pedido #${orderId} en Don Negro Comercial`,
      compras_items: items.map((item: any) => ({
        ciudad: "1", // Asunción
        nombre: item.nombre.substring(0, 99), // Limitar longitud por seguridad
        cantidad: Math.round(item.cantidad),
        precio_unitario: Math.round(item.precio),
        total_monto: Math.round(item.precio * item.cantidad),
        vendedor_telefono: "",
        vendedor_direccion: "",
        vendedor_direccion_referencia: "",
        vendedor_comercio: "Don Negro Comercial",
        vendedor_id: "1",
        vendedor_email: "ventas@donegro.com",
        categoria: "9" // Electrónica / Hogar
      })),
      fecha_maxima_pago: new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '), // 24 horas
      usuario: {
        nombre: customer.name,
        tel: customer.phone,
        email: customer.email,
        direccion: customer.address,
        ruc: "",
        documento: "",
        tipo_documento: "1",
        ciudad: "1"
      }
    };

    console.log("Enviando pedido a Pagopar:", orderId);

    const response = await fetch("https://api.pagopar.com/api/comercio/1.1/generar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparOrder)
    });

    const result = await response.json();

    if (result.respuesta === "OK" && result.resultado && result.resultado.length > 0) {
      const paymentHash = result.resultado[0].data;
      return NextResponse.json({ url: `https://www.pagopar.com/pagar/${paymentHash}` });
    } else {
      console.error("Error respuesta Pagopar:", result);
      return NextResponse.json({ 
        error: "Error en la pasarela", 
        details: result.resultado || result.respuesta 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Excepción al crear orden:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
