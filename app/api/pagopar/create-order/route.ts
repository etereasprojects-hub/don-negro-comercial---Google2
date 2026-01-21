import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { orderId, customer, items } = await request.json();

    // TOKENS DE DON NEGRO COMERCIAL
    const PUBLIC_TOKEN = "77b2b4f7997450ba3c28b85be8d9b066";
    const PRIVATE_TOKEN = "8f4d9f126e97a13f1eed82b9048f4e02";

    // 1. Procesar items y calcular total exacto para evitar error 400 por discrepancia
    let calculatedTotal = 0;
    const processedItems = items.map((item: any) => {
      const unitPrice = Math.round(Number(item.precio));
      const quantity = Math.round(Number(item.cantidad));
      const itemTotal = unitPrice * quantity;
      calculatedTotal += itemTotal;

      return {
        ciudad: "1", // Asunción
        nombre: item.nombre.substring(0, 80).replace(/[^\w\s]/gi, ''), // Limpiar caracteres especiales
        cantidad: quantity,
        precio_unitario: unitPrice,
        total_monto: itemTotal,
        vendedor_telefono: "0981000000",
        vendedor_direccion: "Asunción Supercentro",
        vendedor_direccion_referencia: "",
        vendedor_comercio: "Don Negro Comercial",
        vendedor_id: "1",
        vendedor_email: "ventas@donegro.com",
        categoria: "9" 
      };
    });

    // 2. Limpiar datos del usuario de forma agresiva (solo dígitos para doc y tel)
    const cleanPhone = (customer.phone || "").replace(/\D/g, "");
    const cleanDoc = (customer.documento || "").replace(/\D/g, "");

    // 3. Generar Token SHA1 con el total recalculado
    const hashData = `${PRIVATE_TOKEN}${orderId}${calculatedTotal}`;
    const token = crypto.createHash('sha1').update(hashData).digest('hex');

    const pagoparOrder = {
      token: token,
      token_publico: PUBLIC_TOKEN,
      comercio_pedido_id: orderId.toString(),
      monto_total: calculatedTotal,
      tipo_pedido: "VENTA-COMERCIO",
      descripcion_resumen: `Compra_${orderId}`.substring(0, 80),
      compras_items: processedItems,
      fecha_maxima_pago: new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
      usuario: {
        nombre: (customer.name || "Cliente Web").substring(0, 45).replace(/[^\w\s]/gi, ''),
        tel: cleanPhone.substring(0, 20),
        email: customer.email || "ventas@donegro.com",
        direccion: (customer.address || "Asunción").substring(0, 90).replace(/[^\w\s]/gi, ''),
        ruc: "",
        documento: cleanDoc,
        tipo_documento: "1", // 1 para CI
        ciudad: "1"
      }
    };

    console.log("Enviando a Pagopar:", JSON.stringify(pagoparOrder));

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
      console.error("Respuesta Fallida Pagopar:", JSON.stringify(result, null, 2));
      return NextResponse.json({ 
        error: "Error en la pasarela", 
        details: result.resultado || result.respuesta || "Error de validación"
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error crítico API create-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}