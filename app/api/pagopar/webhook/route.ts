import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("WEBHOOK PAGOPAR RECIBIDO:", JSON.stringify(payload));
    
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
        return NextResponse.json({ status: "ignored", message: "Pedido no encontrado en DB" }, { status: 200 });
      }

      if (isPaid) {
        // 1. Actualizar el Pedido
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'completado', 
            payment_hash: pago.pedido_id, // ID interno de Pagopar
            updated_at: new Date().toISOString() 
          })
          .eq('id', orderId);

        // 2. Registrar Venta (Evitar duplicados)
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
          
          // Nota: Aquí podrías agregar lógica para descontar stock si fuera necesario
        }
      } else if (isCancelled) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'rechazado', updated_at: new Date().toISOString() })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("WEBHOOK ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}