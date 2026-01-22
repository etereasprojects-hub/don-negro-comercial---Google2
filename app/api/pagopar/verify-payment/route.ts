import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Paso #3 del Validador de Pagopar: Consulta de estado proactiva.
 * Endpoint: https://api.pagopar.com/api/pedidos/1.1/traer
 */
export async function POST(request: Request) {
  try {
    const { hash } = await request.json();
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;

    if (!PUBLIC_TOKEN || !PRIVATE_TOKEN) {
      console.error("Paso 3 Error: Tokens no configurados");
      return NextResponse.json({ error: "Configuración de tokens incompleta" }, { status: 500 });
    }

    // El token para "traer" DEBE ser sha1(clave_privada + "CONSULTA")
    // Es vital que sea en minúsculas el digest hex
    const tokenConsulta = crypto
      .createHash('sha1')
      .update(`${PRIVATE_TOKEN.trim()}CONSULTA`)
      .digest('hex');

    const payload = {
      hash_pedido: hash,
      token: tokenConsulta,
      token_publico: PUBLIC_TOKEN.trim()
    };

    console.log("Consultando Paso 3 a Pagopar con Hash:", hash);

    const response = await fetch("https://api.pagopar.com/api/pedidos/1.1/traer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("Respuesta de Pagopar Paso 3:", JSON.stringify(result));

    // Pagopar marca el Paso 3 como exitoso si recibe esta consulta con el token correcto
    if (result.respuesta === true || result.respuesta === "OK") {
      if (result.resultado && result.resultado.length > 0) {
        const pedido = result.resultado[0];
        const pagado = pedido.pagado === true || pedido.pagado === "true";
        const cancelado = pedido.cancelado === true || pedido.cancelado === "true";
        const orderId = pedido.comercio_pedido_id || pedido.numero_pedido;

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let statusLabel = pagado ? "completado" : (cancelado ? "rechazado" : "pendiente");
        
        // Sincronizar con nuestra base de datos
        await supabaseAdmin
          .from('orders')
          .update({ status: statusLabel, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (pagado) {
          // Lógica de registro de venta (idempotente)
          const { data: saleExists } = await supabaseAdmin
            .from('sales')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();

          if (!saleExists) {
            const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
            if (orderData) {
              await supabaseAdmin.from('sales').insert({
                order_id: orderData.id,
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                customer_address: orderData.customer_address,
                items: orderData.items,
                total: orderData.total,
                sale_type: 'contado',
                payment_method: 'pagopar',
                status: 'completada'
              });
            }
          }
        }

        return NextResponse.json({ 
          status: pagado ? "paid" : (cancelado ? "failed" : "pending"),
          message: pedido.resultado_texto || "Consulta exitosa",
          paymentInfo: pedido.mensaje_resultado_pago || null 
        });
      }
    }

    // Si llegamos aquí, Pagopar recibió la petición pero algo no cuadró (ej: hash no existe en staging)
    return NextResponse.json({ 
      status: "failed", 
      message: result.resultado || "No se pudo validar el pedido con Pagopar" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error crítico verify-payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}