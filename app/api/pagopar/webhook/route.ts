import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Configuración de Supabase con Service Role Key para poder actualizar sin restricciones de RLS
    // Nota: Asegúrate de tener estas variables en tu entorno
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (payload.resultado && payload.resultado.length > 0) {
      const pago = payload.resultado[0];
      const orderId = pago.comercio_pedido_id;
      const pagado = pago.pagado === true || pago.pagado === "true";

      if (pagado) {
        // 1. Actualizar el pedido original
        await supabaseAdmin
          .from('orders')
          .update({ status: 'completado', updated_at: new Date().toISOString() })
          .eq('id', orderId);

        // 2. Obtener datos para registrar la venta
        const { data: orderData } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderData) {
          // 3. Registrar en la tabla de ventas
          await supabaseAdmin
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
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
