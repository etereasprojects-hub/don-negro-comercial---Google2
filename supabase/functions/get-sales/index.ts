import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Fix: Add Deno global declaration for Edge Functions environment
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
};

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
      const logData = {
        operation_type: "get_sales",
        direction: "outgoing",
        status: "error",
        error_message: "API Key no proporcionada",
        ip_address: clientIP,
        processing_time_ms: Date.now() - startTime,
      };
      await supabase.from("api_sync_logs").insert(logData);

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
      const logData = {
        operation_type: "get_sales",
        direction: "outgoing",
        status: "error",
        error_message: "API Key inválida o inactiva",
        ip_address: clientIP,
        api_key_used: apiKey,
        processing_time_ms: Date.now() - startTime,
      };
      await supabase.from("api_sync_logs").insert(logData);

      return new Response(
        JSON.stringify({ error: "API Key inválida o inactiva" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyData.id);

    const url = new URL(req.url);
    const params = url.searchParams;
    
    const startDate = params.get("start_date");
    const endDate = params.get("end_date");
    const limit = parseInt(params.get("limit") || "100");
    const offset = parseInt(params.get("offset") || "0");
    const syncedOnly = params.get("synced") === "false";

    let query = supabase
      .from("sales")
      .select(`
        *,
        products (
          id,
          nombre,
          codigo_wos,
          codigo_pro,
          codigo_ext,
          costo,
          stock
        )
      `, { count: 'exact' })
      .order("fecha_venta", { ascending: false });

    if (startDate) {
      query = query.gte("fecha_venta", startDate);
    }
    
    if (endDate) {
      query = query.lte("fecha_venta", endDate);
    }

    if (syncedOnly) {
      query = query.is("synced_to_external", false);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: sales, error: salesError, count } = await query;

    if (salesError) throw salesError;

    const processingTime = Date.now() - startTime;

    const logData = {
      operation_type: "get_sales",
      direction: "outgoing",
      status: "success",
      request_data: { start_date: startDate, end_date: endDate, limit, offset, synced_only: syncedOnly },
      response_data: { sales_count: sales?.length || 0, total_count: count },
      ip_address: clientIP,
      api_key_used: apiKey,
      processing_time_ms: processingTime,
    };

    await supabase.from("api_sync_logs").insert(logData);

    return new Response(
      JSON.stringify({
        success: true,
        data: sales,
        pagination: {
          limit,
          offset,
          total: count,
          has_more: (offset + limit) < (count || 0),
        },
        processing_time_ms: processingTime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        message: error.message,
        processing_time_ms: processingTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});