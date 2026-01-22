import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Paso #4: Consulta de estado del pedido en tiempo real cuando el cliente retorna al sitio.
 * Endpoint: https://api.pagopar.com/api/pedidos/1.1/traer
 */
export async function POST(request: Request) {
  try {
    const { hash } = await request.json();
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;

    if (!PUBLIC_TOKEN || !PRIVATE_TOKEN) {
      return NextResponse.json({ error: "Configuración de tokens incompleta en el servidor" }, { status: 500 });
    }

    // Token para consulta v1.1: Sha1(Private_key + "CONSULTA")
    const tokenConsulta = crypto.createHash('sha1').update(`${PRIVATE_TOKEN}CONSULTA`).digest('hex');

    const payload = {
      hash_pedido: hash,
      token: tokenConsulta,
      token_publico: PUBLIC_TOKEN
    };

    console.log("Paso 4: Consultando estado real del hash:", hash);

    const response = await fetch("https://api.pagopar.com/api/pedidos/1.1/traer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.respuesta === true || result.respuesta === "OK") {
      if (result.resultado && result.resultado.length > 0) {
        const pedido = result.resultado[0];
        const pagado = pedido.pagado === true || pedido.pagado === "true";
        const cancelado = pedido.cancelado === true || pedido.cancelado === "true";
        const orderId = pedido.comercio_pedido_id || pedido.numero_pedido;

        // Actualización administrativa de la base de datos (con Service Role para saltar RLS)
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Sincronizar estado en nuestra DB
        let statusLabel = pagado ? "completado" : (cancelado ? "rechazado" : "pendiente");
        
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: statusLabel,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        // Registrar venta si está pagado e implementando IDEMPOTENCIA
        if (pagado) {
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
          message: pedido.resultado_texto || "",
          paymentInfo: pedido.mensaje_resultado_pago || null 
        });
      }
    }

    return NextResponse.json({ status: "failed", message: "No se pudo recuperar la información del pago" }, { status: 404 });

  } catch (error: any) {
    console.error("Error en verify-payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}