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

    const PUBLIC_TOKEN = "77b2b4f7997450ba3c28b85be8d9b066"
    const PRIVATE_TOKEN = "8f4d9f126e97a13f1eed82b9048f4e02"

    // Generar Token SHA1 de seguridad
    // Regla Pagopar: sha1(token_privado + id_pedido_comercio + monto_total)
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
        categoria: "9" // Electrónica/Hogar
      })),
      fecha_maxima_pago: new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '), // 24h
      usuario: {
        nombre: customer.name,
        tel: customer.phone,
        email: customer.email,
        direccion: customer.address,
        ruc: "",
        documento: "",
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
