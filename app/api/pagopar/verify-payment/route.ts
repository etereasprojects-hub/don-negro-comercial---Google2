
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { hash } = await request.json();
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;

    if (!PUBLIC_TOKEN || !PRIVATE_TOKEN) {
      return NextResponse.json({ error: "Tokens no configurados" }, { status: 500 });
    }

    // Token para consulta v1.0: sha1(token_privado + "CONSULTA")
    const hashConsulta = crypto.createHash('sha1').update(`${PRIVATE_TOKEN}CONSULTA`).digest('hex');

    const payload = {
      token: hashConsulta,
      token_publico: PUBLIC_TOKEN,
      hash_pedido: hash
    };

    const response = await fetch("https://api.pagopar.com/api/pedidos/1.1/traer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.respuesta === "OK" && result.resultado && result.resultado.length > 0) {
      const pedido = result.resultado[0];
      const pagado = pedido.pagado === true || pedido.pagado === "true";
      const cancelado = pedido.cancelado === true || pedido.cancelado === "true";
      const orderId = pedido.comercio_pedido_id;

      // Usar Service Role Key si está disponible, sino Anon Key
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Actualizar estado del pedido
      let statusLabel = pagado ? "completado" : (cancelado ? "rechazado" : "pendiente");
      
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: statusLabel,
          payment_hash: hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Lógica de IDEMPOTENCIA para Ventas
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
        message: pedido.resultado_texto || ""
      });
    }

    return NextResponse.json({ status: "failed", message: "No se encontró información del pedido" }, { status: 404 });

  } catch (error: any) {
    console.error("Error verify-payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
