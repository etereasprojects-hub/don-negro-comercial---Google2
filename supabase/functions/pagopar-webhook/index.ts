
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Fix: Add Deno global declaration for Edge Functions environment
declare const Deno: any;

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Pagopar envía un POST con el resultado del pago
    // Estructura esperada en el body: { resultado: [...], hash: "...", etc }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (payload.resultado && payload.resultado.length > 0) {
      const pago = payload.resultado[0]
      const orderId = pago.comercio_pedido_id
      const pagado = pago.pagado === true || pago.pagado === "true"

      if (pagado) {
        // Actualizar pedido a completado
        const { error: updateOrderError } = await supabaseClient
          .from('orders')
          .update({ status: 'completado', updated_at: new Date().toISOString() })
          .eq('id', orderId)

        if (updateOrderError) throw updateOrderError

        // También registrar como Venta si tienes esa tabla
        const { data: orderData } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderData) {
          await supabaseClient
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
            })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
