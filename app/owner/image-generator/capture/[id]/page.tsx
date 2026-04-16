"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Star, ListChecks, Phone, MapPin, Globe } from "lucide-react";
import Image from "next/image";

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

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando vista de captura...</div>;
  if (!product) return <div className="flex items-center justify-center min-h-screen">Producto no encontrado</div>;

  const prices = calculatePrices({
    costo: Number(product.costo ?? 0),
    margen_porcentaje: Number(product.margen_porcentaje ?? 18),
    interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
    interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
    interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
    interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
  });

  return (
  return (
    <div className="bg-white h-screen p-4 max-w-[1400px] mx-auto overflow-hidden flex flex-col">
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

      {/* Área de Contenido Principal que se ajusta a la altura disponible */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0 items-center">
        
        {/* Lado Izquierdo: Imagen y Contacto */}
        <div className="flex flex-col h-full space-y-4 min-h-0">
          {/* Contenedor de Imagen que crece/se encoge */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center min-h-0">
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre} 
                className="max-w-full max-h-full object-contain p-2"
              />
            ) : (
              <div className="text-slate-300">Sin Imagen</div>
            )}
          </div>

          {/* Información de Contacto (Altura fija o mínima) */}
          <Card className="border-none bg-slate-50 rounded-2xl shadow-sm flex-shrink-0">
            <CardContent className="p-4">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-[#2E3A52] mb-3 flex items-center gap-2 border-b pb-1 border-slate-200">
                <Phone className="w-3 h-3 text-[#D91E7A]" />
                Datos de Contacto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {config?.whatsapp_number && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Ventas WhatsApp</span>
                    <span className="text-sm lg:text-base font-black text-[#2E3A52] tabular-nums">{config.whatsapp_number}</span>
                  </div>
                )}
                {config?.whatsapp_24_7 && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Servicio 24/7</span>
                    <span className="text-sm lg:text-base font-black text-[#2E3A52] tabular-nums">{config.whatsapp_24_7}</span>
                  </div>
                )}
                {locations.slice(0, 2).map(loc => (
                  <div key={loc.id} className="flex flex-col border-t border-slate-100 pt-2">
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase text-[#D91E7A] mb-0.5">
                      <MapPin className="w-2 h-2" />
                      {loc.name}
                    </div>
                    <span className="text-[11px] font-black text-slate-700 truncate">{loc.phone || 'Ver en web'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Derecho: Producto y Precios */}
        <div className="h-full flex flex-col justify-center space-y-6 py-4 min-h-0">
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-5xl font-black text-[#2E3A52] tracking-tighter uppercase leading-[0.9] lg:leading-[0.85]">
              {product.nombre}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-600 font-bold border-none px-3 py-1 uppercase tracking-tighter text-[10px]">
                {product.categoria}
              </Badge>
              {product.stock > 0 && (
                <Badge className="bg-emerald-500 text-white font-black border-none px-3 py-1 uppercase tracking-tighter text-[10px]">
                  Stock Disponible
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b pb-1 border-slate-100">
              <ListChecks className="w-4 h-4 text-slate-300" /> Especificaciones Principales
            </div>
            <p className="text-slate-600 text-base lg:text-lg leading-snug whitespace-pre-wrap font-medium line-clamp-5 xl:line-clamp-none">
              {product.descripcion?.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim()}
            </p>
          </div>

          {/* Bloque de Precios (Altura ajustable) */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white py-5 px-8 rounded-3xl text-center shadow-2xl shadow-purple-200/50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Precio Especial Contado</p>
              <p className="text-5xl lg:text-7xl font-black tracking-tighter leading-none">
                {formatCurrency(prices.precioContado)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '6 Meses', val: prices.cuota6Meses, show: prices.disponible6Meses },
                { label: '12 Meses', val: prices.cuota12Meses, show: prices.disponible12Meses },
                { label: '15 Meses', val: prices.cuota15Meses, show: prices.disponible15Meses },
                { label: '18 Meses', val: prices.cuota18Meses, show: prices.disponible18Meses },
              ].filter(p => p.show).map((p, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center group hover:bg-white transition-colors">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{p.label}</span>
                  <p className="text-xl lg:text-2xl font-black text-[#2E3A52] tracking-tighter leading-none">
                    {formatCurrency(p.val)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest pt-6 border-t border-slate-50 flex-shrink-0">
             Precios válidos por tiempo limitado • Don Negro Comercial
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
