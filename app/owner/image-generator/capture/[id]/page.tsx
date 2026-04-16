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
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0 pt-6 px-2">
        
        {/* Lado Izquierdo: Imagen y Contacto */}
        <div className="flex flex-col h-full space-y-4 min-h-0 justify-start">
          <div className="flex-[3] relative rounded-2xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center min-h-0">
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre} 
                className="max-w-full max-h-full object-contain p-4"
              />
            ) : (
              <div className="text-slate-200 uppercase font-black tracking-widest text-xs tracking-tighter">Sin Imagen</div>
            )}
          </div>

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
                    <span className="text-sm font-black text-[#2E3A52] tabular-nums leading-none">{config.whatsapp_number}</span>
                  </div>
                )}
                {config?.whatsapp_24_7 && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Servicio 24/7</span>
                    <span className="text-sm font-black text-[#2E3A52] tabular-nums leading-none">{config.whatsapp_24_7}</span>
                  </div>
                )}
                {locations.slice(0, 2).map(loc => (
                  <div key={loc.id} className="flex flex-col border-t border-slate-100 pt-2 text-left">
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase text-[#D91E7A] mb-0.5">
                      <MapPin className="w-2 h-2" />
                      {loc.name}
                    </div>
                    <span className="text-[10px] font-black text-slate-700 truncate leading-none">{loc.phone || 'Ver en web'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Derecho: Producto y Precios */}
        <div className="h-full flex flex-col justify-start space-y-4 min-h-0 text-left">
          <div className="space-y-1 flex-shrink-0">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black text-[#2E3A52] tracking-tighter uppercase leading-[1] lg:leading-[0.95]">
              {product.nombre}
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <Badge className="bg-slate-100 text-slate-600 font-bold border-none px-3 py-0.5 uppercase tracking-tighter text-[9px]">
                {product.categoria}
              </Badge>
              {product.stock > 0 && (
                <Badge className="bg-emerald-500 text-white font-black border-none px-3 py-0.5 uppercase tracking-tighter text-[10px]">
                  Stock Disponible
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b pb-1 border-slate-100">
              <ListChecks className="w-3.5 h-3.5 text-slate-300" /> Especificaciones Principales
            </div>
            <p className="text-slate-600 text-xs xl:text-sm leading-snug whitespace-pre-wrap font-medium line-clamp-6">
              {description}
            </p>
          </div>

          {/* Bloque de Precios (Siempre abajo o al final del espacio disponible) */}
          <div className="space-y-3 pt-2 flex-shrink-0">
            <div className="bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white py-4 px-6 rounded-3xl text-center shadow-2xl shadow-purple-200/50">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Precio Especial Contado</p>
              <p className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
                {formatCurrency(prices.precioContado)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {prices.disponible6Meses && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">6 Meses</span>
                  <p className="text-xl lg:text-2xl font-black text-[#2E3A52] tracking-tighter leading-none">{formatCurrency(prices.cuota6Meses)}</p>
                </div>
              )}
              {prices.disponible12Meses && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">12 Meses</span>
                  <p className="text-xl lg:text-2xl font-black text-[#2E3A52] tracking-tighter leading-none">{formatCurrency(prices.cuota12Meses)}</p>
                </div>
              )}
              {prices.disponible15Meses && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">15 Meses</span>
                  <p className="text-xl lg:text-2xl font-black text-[#2E3A52] tracking-tighter leading-none">{formatCurrency(prices.cuota15Meses)}</p>
                </div>
              )}
              {prices.disponible18Meses && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">18 Meses</span>
                  <p className="text-xl lg:text-2xl font-black text-[#2E3A52] tracking-tighter leading-none">{formatCurrency(prices.cuota18Meses)}</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest pt-6 border-t border-slate-50 flex-shrink-0">
             Precios válidos por tiempo limitado • Don Negro Comercial
          </p>
        </div>
      </div>
    </div>
  );
}
