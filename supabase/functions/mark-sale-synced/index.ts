import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Fix: Add Deno global declaration for Edge Functions environment
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
};

interface MarkSyncedRequest {
  sale_id: string;
  external_sale_id?: string;
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey = req.headers.get("X-API-Key");
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API Key requerida en header X-API-Key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .maybeSingle();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: "API Key inválida o inactiva" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData: MarkSyncedRequest = await req.json();

    if (!requestData.sale_id) {
      return new Response(
        JSON.stringify({ error: "sale_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {
      synced_to_external: true,
      synced_at: new Date().toISOString(),
    };

    if (requestData.external_sale_id) {
      updateData.external_sale_id = requestData.external_sale_id;
    }

    const { data, error } = await supabase
      .from("sales")
      .update(updateData)
      .eq("id", requestData.sale_id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Venta no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;

    const logData = {
      operation_type: "mark_sale_synced",
      direction: "incoming",
      status: "success",
      request_data: requestData,
      response_data: { sale: data },
      ip_address: clientIP,
      api_key_used: apiKey,
      processing_time_ms: processingTime,
    };

    await supabase.from("api_sync_logs").insert(logData);

    return new Response(
      JSON.stringify({
        success: true,
        sale: data,
        processing_time_ms: processingTime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});