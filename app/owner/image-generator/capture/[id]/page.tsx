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
    <div className="bg-white min-h-screen p-8 max-w-[1200px] mx-auto print:p-0">
      {/* Header específico para captura */}
      <div className="flex items-center justify-between mb-12 border-b pb-6">
        <div className="flex items-center gap-4">
          {config?.logo_url ? (
            <img src={config.logo_url} alt="Logo" className="h-16 object-contain" />
          ) : (
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#2E3A52]">
              {config?.store_name || "Don Negro"}
            </h1>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end text-[#D91E7A] font-black uppercase text-sm tracking-widest">
            <Globe className="w-4 h-4" />
            www.donegro.com
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1">Tu aliado en tecnología y hogar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Lado Izquierdo: Imagen */}
        <div className="space-y-6">
          <div className="aspect-square relative rounded-[2rem] overflow-hidden bg-slate-50 border-4 border-slate-100 p-8 flex items-center justify-center">
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre} 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-slate-300">Sin Imagen</div>
            )}
          </div>

          {/* Información de Contacto - IMPORTANTE PARA CAPTURAS */}
          <Card className="border-none bg-slate-50 rounded-[2rem]">
            <CardContent className="p-6">
              <h3 className="font-black uppercase text-sm tracking-widest text-[#2E3A52] mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D91E7A]" />
                Contactános ahora
              </h3>
              <div className="space-y-4">
                {config?.whatsapp_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Ventas:</span>
                    <span className="text-base font-black text-[#2E3A52]">{config.whatsapp_number}</span>
                  </div>
                )}
                {config?.whatsapp_24_7 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Atención 24/7:</span>
                    <span className="text-base font-black text-[#2E3A52]">{config.whatsapp_24_7}</span>
                  </div>
                )}
                {locations.map(loc => (
                  <div key={loc.id} className="pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#D91E7A] mb-1">
                      <MapPin className="w-3 h-3" />
                      {loc.name}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-tight">{loc.address}</p>
                    {loc.phone && <p className="text-xs font-black text-slate-800 mt-1">{loc.phone}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Derecho: Info y Precios */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-[#2E3A52] tracking-tighter uppercase leading-none">
              {product.nombre}
            </h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-100 text-slate-600 font-bold border-none px-4 py-1.5 uppercase tracking-tighter text-xs">
                {product.categoria}
              </Badge>
              {product.stock > 0 && (
                <Badge className="bg-emerald-500 text-white font-black border-none px-4 py-1.5 uppercase tracking-tighter text-xs">
                  Stock Disponible
                </Badge>
              )}
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-widest mb-2">
              <ListChecks className="w-4 h-4" /> Especificaciones
            </div>
            <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">
              {product.descripcion?.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim()}
            </p>
          </div>

          {/* Precios Destacados */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white p-8 rounded-[2.5rem] text-center shadow-xl shadow-[#D91E7A]/20">
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Precio Especial Contado</p>
              <p className="text-6xl font-black tracking-tighter">
                {formatCurrency(prices.precioContado)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {prices.disponible6Meses && (
                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">6 meses</span>
                  <p className="text-2xl font-black text-[#2E3A52] tracking-tighter">
                    {formatCurrency(prices.cuota6Meses)}
                  </p>
                </div>
              )}
              {prices.disponible12Meses && (
                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">12 meses</span>
                  <p className="text-2xl font-black text-[#2E3A52] tracking-tighter">
                    {formatCurrency(prices.cuota12Meses)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {prices.disponible15Meses && (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">15 meses</span>
                  <p className="text-2xl font-black text-[#2E3A52] tracking-tighter">
                    {formatCurrency(prices.cuota15Meses)}
                  </p>
                </div>
              )}
              {prices.disponible18Meses && (
                <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">18 meses</span>
                  <p className="text-2xl font-black text-[#2E3A52] tracking-tighter">
                    {formatCurrency(prices.cuota18Meses)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-8 border-t border-slate-100">
            Precios sujetos a variaciones sin previo aviso • Don Negro Comercial
          </p>
        </div>
      </div>
    </div>
  );
}
