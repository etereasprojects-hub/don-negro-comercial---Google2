import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { orderId, customer, items } = await request.json();

    // Validación de items vacíos
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito no tiene productos" }, { status: 400 });
    }

    // TOKENS DESDE VARIABLES DE ENTORNO O FALLBACK
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN || "77b2b4f7997450ba3c28b85be8d9b066";
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN || "8f4d9f126e97a13f1eed82b9048f4e02";

    // 1. Calcular total directamente desde los items procesados
    let calculatedTotal = 0;
    const processedItems = items.map((item: any) => {
      const unitPrice = Math.round(Number(item.precio));
      const quantity = Math.round(Number(item.cantidad));
      const itemTotal = unitPrice * quantity;
      calculatedTotal += itemTotal;

      return {
        ciudad: "1",
        // Regex mejorada para tildes y eñes
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
        categoria: "9"
      };
    });

    // 2. Generar Token SHA1: private_token + pedido_id + monto_total
    const tokenString = `${PRIVATE_TOKEN}${orderId}${calculatedTotal}`;
    const token = crypto.createHash('sha1').update(tokenString).digest('hex');

    // 3. Preparar datos del usuario
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
      fecha_maxima_pago: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 19).replace('T', ' '),
      usuario: {
        nombre: (customer.name || "Cliente").substring(0, 45).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        apellido: "",
        tel: cleanPhone || "0981000000",
        email: customer.email || "ventas@donegro.com",
        direccion: (customer.address || "Asunción").substring(0, 90).replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/gi, ''),
        ruc: "",
        documento: cleanDoc,
        tipo_documento: "1",
        ciudad: "1"
      }
    };

    // 4. Llamar a Pagopar v1.0
    const response = await fetch("https://api.pagopar.com/comercio/1.0/generar-pedido", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagoparOrder)
    });

    const result = await response.json();

    // 5. Verificar respuesta
    if (result.respuesta === "OK" && result.resultado && result.resultado.length > 0) {
      const paymentData = result.resultado[0];
      if (paymentData.data) {
        const paymentHash = paymentData.data;
        return NextResponse.json({ 
          url: `https://www.pagopar.com/pagar/${paymentHash}`,
          hash: paymentHash
        });
      }
    }

    console.error("Error Pagopar:", result);
    return NextResponse.json({ 
      error: "Error en la pasarela",
      details: result.resultado || result.respuesta
    }, { status: 400 });

  } catch (error: any) {
    console.error("Error crítico en create-order:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      message: error.message 
    }, { status: 500 });
  }
}