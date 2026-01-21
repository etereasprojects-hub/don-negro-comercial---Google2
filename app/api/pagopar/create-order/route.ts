import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { orderId, customer, items, total } = await request.json();

    // TOKENS DE DON NEGRO COMERCIAL
    const PUBLIC_TOKEN = "77b2b4f7997450ba3c28b85be8d9b066";
    const PRIVATE_TOKEN = "8f4d9f126e97a13f1eed82b9048f4e02";

    // Los montos en PYG DEBEN ser enteros sin decimales
    const finalTotal = Math.round(total);

    // Generar Token SHA1 de seguridad según documentación Pagopar v1.1
    // Regla: sha1(token_privado + id_pedido_comercio + monto_total)
    const hashData = `${PRIVATE_TOKEN}${orderId}${finalTotal}`;
    const token = crypto.createHash('sha1').update(hashData).digest('hex');

    const pagoparOrder = {
      token: token,
      token_publico: PUBLIC_TOKEN,
      comercio_pedido_id: orderId.toString(),
      monto_total: finalTotal,
      tipo_pedido: "VENTA-COMERCIO",
      descripcion_resumen: `Compra Don Negro #${orderId}`.substring(0, 150),
      compras_items: items.map((item: any) => ({
        ciudad: "1", // Asunción
        nombre: item.nombre.substring(0, 90), // Pagopar tiene límite de 100 char
        cantidad: Math.round(item.cantidad),
        precio_unitario: Math.round(item.precio),
        total_monto: Math.round(item.precio * item.cantidad),
        vendedor_telefono: "0981000000",
        vendedor_direccion: "Asunción Supercentro",
        vendedor_direccion_referencia: "",
        vendedor_comercio: "Don Negro Comercial",
        vendedor_id: "1",
        vendedor_email: "ventas@donegro.com",
        categoria: "9" // Electrónica / Hogar
      })),
      fecha_maxima_pago: new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
      usuario: {
        nombre: (customer.name || "Cliente Web").substring(0, 45),
        tel: (customer.phone || "0981000000").substring(0, 15),
        email: customer.email || "ventas@donegro.com",
        direccion: (customer.address || "Asunción").substring(0, 90),
        ruc: "",
        documento: customer.documento || "1234567", // Pagopar exige documento real o placeholder
        tipo_documento: "1", // 1 para Cédula de Identidad
        ciudad: "1"
      }
    };

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
      console.error("Detalle Error Pagopar:", JSON.stringify(result, null, 2));
      return NextResponse.json({ 
        error: "Error en la pasarela", 
        details: result.resultado || result.respuesta || "Faltan datos obligatorios"
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Excepción API Pagopar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}