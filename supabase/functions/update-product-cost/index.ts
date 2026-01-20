import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// Fix: Add Deno global declaration for Edge Functions environment
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UpdateProductRequest {
  codigo_ext?: string;
  costo?: number;
  productos?: Array<{ codigo_ext: string; costo: number }>;
}

interface UpdateResult {
  codigo_ext: string;
  success: boolean;
  message: string;
  product_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: UpdateProductRequest = await req.json();

    const results: UpdateResult[] = [];

    if (body.productos && Array.isArray(body.productos)) {
      for (const item of body.productos) {
        if (!item.codigo_ext || item.costo === undefined || item.costo === null) {
          results.push({
            codigo_ext: item.codigo_ext || "unknown",
            success: false,
            message: "codigo_ext y costo son requeridos",
          });
          continue;
        }

        const { data: product, error: selectError } = await supabase
          .from("products")
          .select("id, nombre")
          .eq("codigo_ext", item.codigo_ext)
          .maybeSingle();

        if (selectError) {
          results.push({
            codigo_ext: item.codigo_ext,
            success: false,
            message: `Error al buscar producto: ${selectError.message}`,
          });
          continue;
        }

        if (!product) {
          results.push({
            codigo_ext: item.codigo_ext,
            success: false,
            message: "Producto no encontrado",
          });
          continue;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({ costo: item.costo, updated_at: new Date().toISOString() })
          .eq("id", product.id);

        if (updateError) {
          results.push({
            codigo_ext: item.codigo_ext,
            success: false,
            message: `Error al actualizar: ${updateError.message}`,
            product_name: product.nombre,
          });
        } else {
          results.push({
            codigo_ext: item.codigo_ext,
            success: true,
            message: "Costo actualizado exitosamente",
            product_name: product.nombre,
          });
        }
      }
    } else if (body.codigo_ext && body.costo !== undefined && body.costo !== null) {
      const { data: product, error: selectError } = await supabase
        .from("products")
        .select("id, nombre")
        .eq("codigo_ext", body.codigo_ext)
        .maybeSingle();

      if (selectError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Error al buscar producto: ${selectError.message}`,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (!product) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Producto no encontrado con ese código externo",
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ costo: body.costo, updated_at: new Date().toISOString() })
        .eq("id", product.id);

      if (updateError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Error al actualizar: ${updateError.message}`,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Costo actualizado exitosamente",
          product_name: product.nombre,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Debes enviar 'codigo_ext' y 'costo', o 'productos' (array)",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: results.length,
        updated: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});