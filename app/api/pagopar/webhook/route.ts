import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("WEBHOOK PAGOPAR RECIBIDO:", JSON.stringify(payload, null, 2));
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (payload.resultado && payload.resultado.length > 0) {
      const pago = payload.resultado[0];
      const orderId = pago.comercio_pedido_id;
      const pagado = pago.pagado === true || pago.pagado === "true";
      const cancelado = pago.cancelado === true || pago.cancelado === "true";

      const { data: orderData, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !orderData) {
        console.error("Error buscando pedido en webhook:", fetchError);
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 200 }); // Retornar 200 para no reintentar algo inexistente
      }

      if (pagado) {
        // 1. Actualizar el pedido
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'completado', 
            payment_hash: pago.pedido_id,
            updated_at: new Date().toISOString() 
          })
          .eq('id', orderId);

        // 2. Registrar Venta Completada
        const { error: saleError } = await supabaseAdmin
          .from('sales')
          .insert({
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
        
        if (saleError) console.error("Error registrando venta en webhook:", saleError);

      } else if (cancelado) {
        // 1. Actualizar el pedido a rechazado
        await supabaseAdmin
          .from('orders')
          .update({ status: 'rechazado', updated_at: new Date().toISOString() })
          .eq('id', orderId);
          
        // 2. Registrar Venta Rechazada
        const { error: saleError } = await supabaseAdmin
          .from('sales')
          .insert({
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
          
        if (saleError) console.error("Error registrando venta rechazada en webhook:", saleError);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("WEBHOOK ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}