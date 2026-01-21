import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { hash } = await request.json();
    const PUBLIC_TOKEN = process.env.PAGOPAR_PUBLIC_TOKEN;
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;

    if (!PUBLIC_TOKEN || !PRIVATE_TOKEN) {
      throw new Error("Tokens de Pagopar no configurados");
    }

    // Token para consulta v1.1: sha1(token_privado + hash_pedido)
    const tokenConsulta = crypto.createHash('sha1').update(`${PRIVATE_TOKEN}${hash}`).digest('hex');

    const payload = {
      hash_pedido: hash,
      token: tokenConsulta,
      public_key: PUBLIC_TOKEN
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

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Actualizar estado del pedido en base al resultado real de Pagopar
      let statusLabel = pagado ? "completado" : (cancelado ? "rechazado" : "pendiente");
      
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: statusLabel,
          payment_hash: hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Si está pagado, asegurar que exista el registro en la tabla 'sales'
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
        message: result.resultado[0].resultado_texto || ""
      });
    }

    return NextResponse.json({ status: "failed", message: "No se encontró información del pedido" }, { status: 404 });

  } catch (error: any) {
    console.error("Error verify-payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}