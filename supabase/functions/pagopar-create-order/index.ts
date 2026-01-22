import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, customer, items, total } = await req.json()

    // Tokens de Producción Actualizados
    const PUBLIC_TOKEN = "46d1542f3f3402cb13971dc6b829cfb9"
    const PRIVATE_TOKEN = "5ac150711ecd4be8338574fc3d9cd93e"

    // Generar Token SHA1 de seguridad
    // Regla Pagopar v1.1: sha1(token_privado + id_pedido_comercio + monto_total)
    const hashData = `${PRIVATE_TOKEN}${orderId}${total}`
    const token = createHash("sha1").update(hashData).toString()

    const pagoparOrder = {
      token: token,
      token_publico: PUBLIC_TOKEN,
      comercio_pedido_id: orderId.toString(),
      monto_total: total,
      tipo_pedido: "VENTA-COMERCIO",
      descripcion_resumen: `Pedido #${orderId} en Don Negro Comercial`,
      compras_items: items.map((item: any) => ({
        ciudad: "1", // Asunción por defecto o mapear según corresponda
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        total_monto: item.precio * item.cantidad,
        vendedor_telefono: "",
        vendedor_direccion: "",
        vendedor_direccion_referencia: "",
        vendedor_comercio: "Don Negro Comercial",
        vendedor_id: "1",
        vendedor_email: "ventas@donegro.com",
        categoria: "909" // Hogar/Electrónica
      })),
      fecha_maxima_pago: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 19).replace('T', ' '), // 48h para pagar
      usuario: {
        nombre: customer.name,
        tel: customer.phone,
        email: customer.email,
        direccion: customer.address,
        ruc: "",
        documento: customer.documento || "",
        tipo_documento: "1", // CI
        ciudad: "1"
      }
    }

    const response = await fetch("https://api.pagopar.com/api/comercio/1.1/generar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparOrder)
    })

    const result = await response.json()

    if (result.respuesta === "OK" && result.resultado && result.resultado.length > 0) {
      // La API devuelve un hash en el primer elemento del array resultado
      const paymentHash = result.resultado[0].data
      return new Response(
        JSON.stringify({ url: `https://www.pagopar.com/pagar/${paymentHash}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: "API Error", details: result }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})