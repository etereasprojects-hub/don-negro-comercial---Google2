"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin, Globe, ListChecks } from "lucide-react";

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  margen_porcentaje: number;
  interes_6_meses_porcentaje: number;
  interes_12_meses_porcentaje: number;
  interes_15_meses_porcentaje: number;
  interes_18_meses_porcentaje: number;
  imagen_url: string;
  imagenes_extra: string[];
  categoria: string;
  stock: number;
  ubicacion: string;
}

interface StoreConfig {
  store_name: string;
  logo_url: string | null;
  whatsapp_number: string | null;
  whatsapp_24_7: string | null;
  email: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

export default function CapturePage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const [productRes, configRes, locationsRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("store_configuration").select("*").maybeSingle(),
        supabase.from("store_locations").select("*").order("name")
      ]);

      if (productRes.data) setProduct(productRes.data);
      if (configRes.data) setConfig(configRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400 font-bold uppercase tracking-widest">Cargando vista de captura...</div>;
  if (!product) return <div className="flex items-center justify-center min-h-screen text-slate-400 font-bold uppercase tracking-widest">Producto no encontrado</div>;

  const prices = calculatePrices({
    costo: Number(product.costo ?? 0),
    margen_porcentaje: Number(product.margen_porcentaje ?? 18),
    interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
    interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
    interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
    interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
  });

  const description = product.descripcion?.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

  return (
    <div className="bg-white h-screen p-6 max-w-[1280px] mx-auto overflow-hidden flex flex-col font-sans">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-6 border-b pb-4 flex-shrink-0">
        <div className="flex items-center">
          {config?.logo_url ? (
            <img src={config.logo_url} alt="Logo" className="h-10 object-contain" />
          ) : (
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[#2E3A52]">
              {config?.store_name || "Don Negro"}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#D91E7A] font-black uppercase text-xs tracking-[0.2em]">
          <Globe className="w-4 h-4" />
          WWW.DONEGRO.COM
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[0.4fr_0.6fr] gap-12 min-h-0 pt-2 px-2">
        
        {/* Lado Izquierdo: Visuales y Soporte */}
        <div className="flex flex-col h-full space-y-8 min-h-0">
          {/* Imagen del Producto */}
          <div className="flex-1 min-h-0 relative rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shadow-sm">
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre} 
                className="max-w-full max-h-full object-contain drop-shadow-xl"
              />
            ) : (
              <div className="text-slate-200 uppercase font-black tracking-widest text-xs">Sin Imagen</div>
            )}
          </div>

          {/* Central de Ventas (Compacto) */}
          <div className="flex-shrink-0 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
            <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-[#D91E7A] mb-4 flex items-center gap-2 border-b pb-2 border-slate-200/50">
              <Phone className="w-4 h-4" />
              CENTRAL DE VENTAS
            </h3>
            <div className="space-y-4">
              {config?.whatsapp_number && (
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-1.5 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Asesoría WhatsApp</span>
                    <span className="text-sm font-black text-[#2E3A52] tracking-tight">{config.whatsapp_number}</span>
                  </div>
                </div>
              )}
              {config?.whatsapp_24_7 && (
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Soporte 24/7</span>
                    <span className="text-sm font-black text-[#2E3A52] tracking-tight">{config.whatsapp_24_7}</span>
                  </div>
                </div>
              )}
              {locations.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="bg-rose-100 p-1.5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">{locations[0].name}</span>
                    <span className="text-sm font-black text-[#2E3A52] tracking-tight">{locations[0].phone || 'Consulte en web'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Información y Conversión */}
        <div className="h-full flex flex-col min-h-0 text-left">
          {/* Etiquetas y Título */}
          <div className="space-y-4 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-[#D91E7A]/10 text-[#D91E7A] font-black border-none px-4 py-1.5 uppercase tracking-tighter text-[10px]">
                {product.categoria}
              </Badge>
              {product.stock > 0 && (
                <Badge className="bg-emerald-500 text-white font-black border-none px-4 py-1.5 uppercase tracking-tighter text-[10px] shadow-sm">
                  SINCRONIZADO • EN STOCK
                </Badge>
              )}
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#2E3A52] tracking-tighter uppercase leading-[0.9] text-balance">
              {product.nombre}
            </h1>
          </div>

          {/* Bloque de Precios (Agrupado) */}
          <div className="space-y-6 py-8 flex-shrink-0">
            {/* Precio Contado */}
            <div className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] text-white py-4 px-8 rounded-2xl shadow-xl shadow-purple-200/50 inline-flex flex-col items-center min-w-[300px]">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-80">CONTADO</span>
              <p className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
                {formatCurrency(prices.precioContado)}
              </p>
            </div>

            {/* Cuotas en fila */}
            <div className="flex gap-4 w-full">
              {[
                { label: '6 Meses', val: prices.cuota6Meses, disp: prices.disponible6Meses },
                { label: '12 Meses', val: prices.cuota12Meses, disp: prices.disponible12Meses },
                { label: '15 Meses', val: prices.cuota15Meses, disp: prices.disponible15Meses },
                { label: '18 Meses', val: prices.cuota18Meses, disp: prices.disponible18Meses }
              ].filter(c => c.disp).map((item, idx) => (
                <div key={idx} className="flex-1 bg-slate-50 py-4 px-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">{item.label}</span>
                  <p className="text-xl font-black text-[#2E3A52] tracking-tighter tabular-nums leading-none">
                    {formatCurrency(item.val)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Garantía y Especificaciones (Expandido) */}
          <div className="space-y-4 flex-1 overflow-visible">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em] border-b pb-2 border-slate-100">
              <ListChecks className="w-5 h-5 text-[#6B4199]" /> 
              GARANTÍA Y ESPECIFICACIONES
            </div>
            <div className="pt-2">
              <p className="text-[#2E3A52]/80 text-base leading-relaxed whitespace-pre-wrap font-medium">
                {description}
              </p>
            </div>
          </div>

          {/* Footer Separador */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              DON NEGRO COMERCIAL • IMPORTADORA DIRECTA
            </p>
            <p className="text-[10px] font-bold text-[#D91E7A] uppercase tracking-widest italic opacity-60">
              *SUJETO A APROBACIÓN DE CRÉDITO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
