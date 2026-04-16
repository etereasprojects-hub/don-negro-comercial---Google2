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

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
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
  };

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
    <div className="bg-white h-screen p-4 max-w-[1400px] mx-auto overflow-hidden flex flex-col font-sans">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4 border-b pb-2 flex-shrink-0">
        <div className="flex items-center gap-4">
          {config?.logo_url ? (
            <img src={config.logo_url} alt="Logo" className="h-10 object-contain" />
          ) : (
            <h1 className="text-xl font-black uppercase tracking-tighter text-[#2E3A52]">
              {config?.store_name || "Don Negro"}
            </h1>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end text-[#D91E7A] font-black uppercase text-[10px] tracking-widest">
            <Globe className="w-3 h-3 text-[#D91E7A]" />
            www.donegro.com
          </div>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[0.45fr_0.55fr] gap-10 min-h-0 pt-4 px-4">
        
        {/* Lado Izquierdo: Imagen y Contacto */}
        <div className="flex flex-col h-full space-y-4 min-h-0 justify-start">
          <div className="flex-[4] relative rounded-[2.5rem] overflow-hidden bg-slate-50/50 border border-slate-100 flex items-center justify-center min-h-0 group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent opacity-50"></div>
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre} 
                className="max-w-full max-h-full object-contain relative z-10 p-4 drop-shadow-2xl"
              />
            ) : (
              <div className="text-slate-200 uppercase font-black tracking-widest text-xs tracking-tighter">Sin Imagen</div>
            )}
          </div>

          <Card className="border-none bg-slate-50/80 backdrop-blur-sm rounded-[2rem] shadow-sm flex-shrink-0">
            <CardContent className="p-5">
              <h3 className="font-black uppercase text-[9px] tracking-[0.2em] text-[#D91E7A] mb-4 flex items-center gap-2 border-b pb-2 border-slate-200/50">
                <Phone className="w-3.5 h-3.5" />
                CENTRAL DE VENTAS
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {config?.whatsapp_number && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Asesoría WhatsApp</span>
                    <span className="text-xl lg:text-2xl font-black text-[#2E3A52] tabular-nums leading-none tracking-tight">{config.whatsapp_number}</span>
                  </div>
                )}
                {config?.whatsapp_24_7 && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Soporte 24/7</span>
                    <span className="text-xl lg:text-2xl font-black text-[#2E3A52] tabular-nums leading-none tracking-tight">{config.whatsapp_24_7}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {locations.slice(0, 2).map(loc => (
                    <div key={loc.id} className="flex flex-col border-t border-slate-200/50 pt-2.5 text-left">
                      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-500 mb-1">
                        <MapPin className="w-2.5 h-2.5 text-[#D91E7A]" />
                        {loc.name}
                      </div>
                      <span className="text-[14px] font-black text-[#2E3A52] truncate leading-none">{loc.phone || 'Consulte en web'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Derecho: Producto y Precios */}
        <div className="h-full flex flex-col justify-between py-2 min-h-0 text-left">
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Header de Producto */}
            <div className="space-y-3 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#D91E7A]/10 text-[#D91E7A] font-black border-none px-3 py-1 uppercase tracking-tighter text-[9px]">
                  {product.categoria}
                </Badge>
                {product.stock > 0 && (
                  <Badge className="bg-emerald-500 text-white font-black border-none px-3 py-1 uppercase tracking-tighter text-[9px] shadow-sm shadow-emerald-100">
                    Sincronizado • En Stock
                  </Badge>
                )}
              </div>
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-black text-[#2E3A52] tracking-tighter uppercase leading-[1.1] text-balance">
                {product.nombre}
              </h1>
            </div>

            {/* Descripción Expandida */}
            <div className="space-y-2 flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-b pb-2 border-slate-100">
                <ListChecks className="w-4 h-4 text-[#6B4199]" /> 
                Garantía y Especificaciones
              </div>
              <div className="flex-1 overflow-y-auto pr-4 py-1">
                <p className="text-[#2E3A52]/80 text-[12px] leading-relaxed whitespace-pre-wrap font-medium">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Precios Optimizada */}
          <div className="space-y-4 pt-4 flex-shrink-0">
            <div className="relative group overflow-hidden bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white py-3 px-6 rounded-[2rem] shadow-xl shadow-purple-200/50 w-fit mx-auto transform scale-90">
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 text-white/70">CONTADO</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg lg:text-xl font-black opacity-40 leading-none">₲</span>
                  <span className="text-3xl lg:text-4xl xl:text-5xl font-black tracking-tighter leading-none">
                    {formatCurrency(prices.precioContado).replace('₲', '').trim()}
                  </span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            </div>

            {/* Cuotas Grid Compacto */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: '6 Meses', val: prices.cuota6Meses, disp: prices.disponible6Meses },
                { label: '12 Meses', val: prices.cuota12Meses, disp: prices.disponible12Meses },
                { label: '15 Meses', val: prices.cuota15Meses, disp: prices.disponible15Meses },
                { label: '18 Meses', val: prices.cuota18Meses, disp: prices.disponible18Meses }
              ].filter(c => c.disp).map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 hover:bg-slate-100 transition-colors py-3 px-4 rounded-2xl border border-slate-100/50 text-center">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-1">{item.label}</span>
                  <p className="text-xl lg:text-2xl font-black text-[#2E3A52] tracking-tighter tabular-nums leading-none">
                    {formatCurrency(item.val)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em]">
                  Don Negro Comercial • Importadora Directa
               </p>
               <p className="text-[8px] font-bold text-[#D91E7A]/50 uppercase tracking-widest italic">
                  *Sujeto a aprobación de crédito
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
