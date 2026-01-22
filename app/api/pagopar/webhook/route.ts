import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Webhook de Pagopar (Paso #3)
 * Este endpoint recibe la notificación oficial de pago desde los servidores de Pagopar.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const PRIVATE_TOKEN = process.env.PAGOPAR_PRIVATE_TOKEN;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("WEBHOOK PAGOPAR RECIBIDO:", JSON.stringify(payload));

    if (!PRIVATE_TOKEN) {
      console.error("Falta PAGOPAR_PRIVATE_TOKEN en las variables de entorno");
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    // 1. Validar que el payload tenga la estructura esperada
    if (!payload.resultado || payload.resultado.length === 0) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const pago = payload.resultado[0];
    const hashRecibido = pago.hash_pedido;
    const tokenRecibido = pago.token;
    const orderIdComercio = pago.numero_pedido; // id_pedido_comercio enviado en Paso 1

    // 2. VALIDACIÓN ESTRICTA DEL TOKEN (Seguridad Crítica)
    // Fórmula: sha1(clave_privada + hash_pedido)
    const generatedToken = crypto
      .createHash('sha1')
      .update(`${PRIVATE_TOKEN}${hashRecibido}`)
      .digest('hex');

    if (generatedToken !== tokenRecibido) {
      console.error("TOKEN INVÁLIDO detectado en Webhook de Pagopar");
      return NextResponse.json({ error: "Token no coincide" }, { status: 403 });
    }

    // 3. Conectar a Supabase como Admin para actualizar estados
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ error: "Error de conexión a base de datos" }, { status: 500 });
    }
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // 4. Procesar el resultado del pago
    const isPaid = pago.pagado === true;

    // Buscamos el pedido por el hash que asociamos en el Paso 2
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_hash', hashRecibido)
      .maybeSingle();

    if (fetchError || !orderData) {
      console.warn(`Pedido no encontrado para el hash: ${hashRecibido}. Intentando por ID: ${orderIdComercio}`);
      // Fallback por ID si el hash fallara por alguna razón extraña
    }

    const targetOrder = orderData || { id: orderIdComercio };

    if (isPaid) {
      // A. Actualizar estado del pedido a completado
      await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'completado', 
          updated_at: new Date().toISOString() 
        })
        .eq('payment_hash', hashRecibido);

      // B. Lógica de Idempotencia: Verificar si ya existe la venta para no duplicar
      const { data: saleExists } = await supabaseAdmin
        .from('sales')
        .select('id')
        .eq('order_id', targetOrder.id)
        .maybeSingle();

      if (!saleExists && orderData) {
        // Registrar la venta oficial
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
      
      console.log(`Venta confirmada exitosamente para pedido: ${targetOrder.id}`);
    } else {
      console.log(`Notificación de pago pendiente o reversado para hash: ${hashRecibido}`);
      // Si Pagopar notifica una reversión o cancelación
      if (pago.cancelado === true) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'rechazado', updated_at: new Date().toISOString() })
          .eq('payment_hash', hashRecibido);
      }
    }

    // 5. RESPUESTA ESPEJO (Requerido por Pagopar)
    // El comercio debe retornar directamente el contenido del resultado del JSON enviado por Pagopar
    return new NextResponse(JSON.stringify(payload.resultado), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("ERROR CRÍTICO WEBHOOK:", error.message);
    // Retornamos 200 aunque haya error interno para que Pagopar no se quede en bucle de reintentos
    // si el error es de nuestra lógica de base de datos.
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}