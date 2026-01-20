import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Satisfy TypeScript compiler for Deno globals
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
};

interface ProductSyncData {
  codigo_wos?: string;
  codigo_pro?: string;
  codigo_ext?: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  costo: number;
  stock: number;
  ubicacion?: string;
  imagen_url?: string;
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
      const logData = {
        operation_type: "product_sync",
        direction: "incoming",
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
        operation_type: "product_sync",
        direction: "incoming",
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

    const requestData: ProductSyncData | ProductSyncData[] = await req.json();
    const products = Array.isArray(requestData) ? requestData : [requestData];

    const results = [];
    const errors = [];

    for (const product of products) {
      try {
        if (!product.nombre || product.costo === undefined) {
          errors.push({
            product,
            error: "Campos requeridos: nombre, costo",
          });
          continue;
        }

        let existingProduct = null;
        
        if (product.codigo_wos) {
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("codigo_wos", product.codigo_wos)
            .maybeSingle();
          existingProduct = data;
        } else if (product.codigo_pro) {
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("codigo_pro", product.codigo_pro)
            .maybeSingle();
          existingProduct = data;
        } else if (product.codigo_ext) {
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("codigo_ext", product.codigo_ext)
            .maybeSingle();
          existingProduct = data;
        }

        const generateSlug = (text: string): string => {
          return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "_");
        };

        if (existingProduct) {
          const updateData: any = {
            nombre: product.nombre,
            costo: product.costo,
            stock: product.stock !== undefined ? product.stock : existingProduct.stock,
          };

          if (product.descripcion !== undefined) updateData.descripcion = product.descripcion;
          if (product.categoria !== undefined) updateData.categoria = product.categoria;
          if (product.ubicacion !== undefined) updateData.ubicacion = product.ubicacion;
          if (product.imagen_url !== undefined) updateData.imagen_url = product.imagen_url;
          if (product.codigo_wos !== undefined) updateData.codigo_wos = product.codigo_wos;
          if (product.codigo_pro !== undefined) updateData.codigo_pro = product.codigo_pro;
          if (product.codigo_ext !== undefined) updateData.codigo_ext = product.codigo_ext;

          const { data, error } = await supabase
            .from("products")
            .update(updateData)
            .eq("id", existingProduct.id)
            .select()
            .single();

          if (error) throw error;

          results.push({
            action: "updated",
            product: data,
          });
        } else {
          const newProduct: any = {
            nombre: product.nombre,
            descripcion: product.descripcion || "",
            codigo_wos: product.codigo_wos || "",
            codigo_pro: product.codigo_pro || "",
            codigo_ext: product.codigo_ext || "",
            categoria: product.categoria || "",
            url_slug: generateSlug(product.nombre),
            costo: product.costo,
            margen_porcentaje: 18,
            interes_6_meses_porcentaje: 45,
            interes_12_meses_porcentaje: 65,
            interes_15_meses_porcentaje: 75,
            interes_18_meses_porcentaje: 85,
            stock: product.stock || 0,
            ubicacion: product.ubicacion || "En Local",
            estado: "Activo",
            imagen_url: product.imagen_url || "",
            destacado: false,
            show_in_hero: false,
          };

          const { data, error } = await supabase
            .from("products")
            .insert(newProduct)
            .select()
            .single();

          if (error) throw error;

          results.push({
            action: "created",
            product: data,
          });
        }
      } catch (error: any) {
        errors.push({
          product,
          error: error.message,
        });
      }
    }

    const processingTime = Date.now() - startTime;
    const status = errors.length === 0 ? "success" : (results.length > 0 ? "success" : "error");

    const logData = {
      operation_type: "product_sync",
      direction: "incoming",
      status,
      request_data: { products_count: products.length, products },
      response_data: { results, errors, summary: { success: results.length, failed: errors.length } },
      error_message: errors.length > 0 ? `${errors.length} productos con errores` : null,
      ip_address: clientIP,
      api_key_used: apiKey,
      processing_time_ms: processingTime,
    };

    await supabase.from("api_sync_logs").insert(logData);

    return new Response(
      JSON.stringify({
        success: true,
        processed: products.length,
        results,
        errors,
        summary: {
          created: results.filter((r) => r.action === "created").length,
          updated: results.filter((r) => r.action === "updated").length,
          failed: errors.length,
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
