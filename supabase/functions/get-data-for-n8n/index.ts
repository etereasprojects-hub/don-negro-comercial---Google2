import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Fix: Add Deno global declaration for Edge Functions environment
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function roundToNearest5000(value: number): number {
  return Math.ceil(value / 5000) * 5000;
}

function calculatePrices(product: any) {
  const {
    costo,
    margen_porcentaje,
    interes_6_meses_porcentaje,
    interes_12_meses_porcentaje,
    interes_15_meses_porcentaje,
    interes_18_meses_porcentaje,
  } = product;

  const margenMonto = costo * (margen_porcentaje / 100);
  const precioContado = roundToNearest5000(costo + margenMonto);

  const disponible6Meses = interes_6_meses_porcentaje > 0;
  const interes6 = costo * (interes_6_meses_porcentaje / 100);
  const total6Meses = disponible6Meses ? roundToNearest5000(costo + interes6) : 0;
  const cuota6Meses = disponible6Meses ? roundToNearest5000(total6Meses / 6) : 0;

  const disponible12Meses = interes_12_meses_porcentaje > 0;
  const interes12 = costo * (interes_12_meses_porcentaje / 100);
  const total12Meses = disponible12Meses ? roundToNearest5000(costo + interes12) : 0;
  const cuota12Meses = disponible12Meses ? roundToNearest5000(total12Meses / 12) : 0;

  const disponible15Meses = interes_15_meses_porcentaje > 0;
  const interes15 = costo * (interes_15_meses_porcentaje / 100);
  const total15Meses = disponible15Meses ? roundToNearest5000(costo + interes15) : 0;
  const cuota15Meses = disponible15Meses ? roundToNearest5000(total15Meses / 15) : 0;

  const disponible18Meses = interes_18_meses_porcentaje > 0;
  const interes18 = costo * (interes_18_meses_porcentaje / 100);
  const total18Meses = disponible18Meses ? roundToNearest5000(costo + interes18) : 0;
  const cuota18Meses = disponible18Meses ? roundToNearest5000(total18Meses / 18) : 0;

  return {
    precioContado,
    cuota6Meses,
    total6Meses,
    disponible6Meses,
    cuota12Meses,
    total12Meses,
    disponible12Meses,
    cuota15Meses,
    total15Meses,
    disponible15Meses,
    cuota18Meses,
    total18Meses,
    disponible18Meses,
  };
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

    // Obtener productos
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("nombre", { ascending: true });

    if (productsError) throw productsError;

    // Calcular precios para cada producto
    const productsWithPrices = products?.map((product) => {
      const prices = calculatePrices(product);

      return {
        nombre: product.nombre,
        url: product.url_slug || "",
        slug: product.url_slug || "",
        cantidad: product.stock || 0,
        descripcion: product.descripcion || "",
        codigo_producto: product.codigo_pro || product.product_code || "",
        precio_contado: prices.precioContado,
        financiacion_6_meses: {
          disponible: prices.disponible6Meses,
          cuota: prices.cuota6Meses,
          total: prices.total6Meses,
        },
        financiacion_12_meses: {
          disponible: prices.disponible12Meses,
          cuota: prices.cuota12Meses,
          total: prices.total12Meses,
        },
        financiacion_15_meses: {
          disponible: prices.disponible15Meses,
          cuota: prices.cuota15Meses,
          total: prices.total15Meses,
        },
        financiacion_18_meses: {
          disponible: prices.disponible18Meses,
          cuota: prices.cuota18Meses,
          total: prices.total18Meses,
        },
      };
    }) || [];

    // Obtener instrucciones para la IA (tomar la primera fila si hay múltiples)
    const { data: instructionsData, error: instructionsError } = await supabase
      .from("instructions")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    const instructions = instructionsData?.[0] || null;

    // Obtener información de contacto (tomar la primera fila si hay múltiples)
    const { data: storeConfigData, error: storeConfigError } = await supabase
      .from("store_configuration")
      .select("*")
      .limit(1);

    const storeConfig = storeConfigData?.[0] || null;

    const contactInfo = {
      nombre_tienda: storeConfig?.store_name || "",
      telefono: storeConfig?.whatsapp_number || "",
      whatsapp: storeConfig?.whatsapp_24_7 || storeConfig?.whatsapp_number || "",
      email: storeConfig?.email || "",
      direccion: "",
      facebook: "",
      instagram: "",
    };

    const data = {
      productos: productsWithPrices,
      instrucciones_ia: instructions?.instruction_text || "",
      informacion_contacto: contactInfo,
    };

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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