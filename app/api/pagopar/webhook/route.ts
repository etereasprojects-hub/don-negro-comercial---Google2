
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("WEBHOOK PAGOPAR RECIBIDO:", JSON.stringify(payload));
    
    // CRÍTICO: Usamos la SERVICE_ROLE_KEY para permitir actualizaciones administrativas sin restricciones de RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (payload.resultado && payload.resultado.length > 0) {
      const pago = payload.resultado[0];
      const orderId = pago.comercio_pedido_id;
      const isPaid = pago.pagado === true || pago.pagado === "true";
      const isCancelled = pago.cancelado === true || pago.cancelado === "true";

      const { data: orderData, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !orderData) {
        return NextResponse.json({ status: "ignored", message: "Pedido no encontrado" }, { status: 200 });
      }

      if (isPaid) {
        // 1. Actualizar el estado del Pedido
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'completado', 
            payment_hash: pago.pedido_id, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', orderId);

        // 2. Lógica de IDEMPOTENCIA: Verificar si ya existe la venta antes de insertar
        const { data: saleExists } = await supabaseAdmin
          .from('sales')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!saleExists) {
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
      } else if (isCancelled) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'rechazado', updated_at: new Date().toISOString() })
          .eq('id', orderId);

        // Registrar intento fallido opcionalmente como venta rechazada (Idempotencia incluida)
        const { data: saleExists } = await supabaseAdmin
          .from('sales')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!saleExists) {
          await supabaseAdmin.from('sales').insert({
            order_id: orderData.id,
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            customer_address: orderData.customer_address,
            items: orderData.items,
            total: orderData.total,
            sale_type: 'contado',
            payment_method: 'pagopar',
            status: 'rechazada'
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("WEBHOOK ERROR:", error.message);
    // Respondemos con 200 para evitar que Pagopar siga reintentando infinitamente si el error es de lógica interna
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
