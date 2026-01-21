import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { hash } = await request.json();

    const PUBLIC_TOKEN = "77b2b4f7997450ba3c28b85be8d9b066";
    const PRIVATE_TOKEN = "8f4d9f126e97a13f1eed82b9048f4e02";

    // Token para consulta: sha1(token_privado + "CONSULTA")
    const hashConsulta = crypto.createHash('sha1').update(`${PRIVATE_TOKEN}CONSULTA`).digest('hex');

    const payload = {
      token: hashConsulta,
      token_publico: PUBLIC_TOKEN,
      hash_pedido: hash
    };

    const response = await fetch("https://api.pagopar.com/comercio/1.0/consultar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("Respuesta Consulta Pagopar:", result);

    if (result.respuesta === "OK" && result.resultado && result.resultado.length > 0) {
      const pedido = result.resultado[0];
      const statusPagopar = pedido.pagado; // boolean o string
      const comercioId = pedido.comercio_pedido_id;

      let finalStatus = "pendiente";
      if (statusPagopar === true || statusPagopar === "true") finalStatus = "pagado";
      if (pedido.cancelado === true || pedido.cancelado === "true") finalStatus = "rechazado";

      // Actualizar en Supabase
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabaseAdmin
        .from('orders')
        .update({ 
          status: finalStatus === "pagado" ? "completado" : finalStatus,
          payment_hash: hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', comercioId);

      return NextResponse.json({ 
        status: finalStatus === "pagado" ? "paid" : (finalStatus === "rechazado" ? "failed" : "pending"),
        message: result.resultado[0].resultado_texto || ""
      });
    }

    return NextResponse.json({ status: "failed", message: "No se encontró el pedido" }, { status: 404 });

  } catch (error: any) {
    console.error("Error verificando pago:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}