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
    <div className="bg-white min-h-screen p-4 max-w-[1200px] mx-auto print:p-0 flex flex-col">
      {/* Header específico para captura */}
      <div className="flex items-center justify-between mb-4 border-b pb-2">
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
            <Globe className="w-3 h-3" />
            www.donegro.com
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-start">
        {/* Lado Izquierdo: Imagen */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center">
            {product.imagen_url ? (
              <img 
                src={product.imagen_url} 
                alt={product.nombre} 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-300">Sin Imagen</div>
            )}
          </div>

          {/* Información de Contacto */}
          <Card className="border-none bg-slate-50 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-[#2E3A52] mb-2 flex items-center gap-2 border-b pb-1 border-slate-200">
                <Phone className="w-3 h-3 text-[#D91E7A]" />
                Contacto
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {config?.whatsapp_number && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold uppercase text-slate-400">Ventas:</span>
                    <span className="text-sm font-black text-[#2E3A52]">{config.whatsapp_number}</span>
                  </div>
                )}
                {config?.whatsapp_24_7 && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold uppercase text-slate-400">24/7:</span>
                    <span className="text-sm font-black text-[#2E3A52]">{config.whatsapp_24_7}</span>
                  </div>
                )}
                {locations.slice(0, 2).map(loc => (
                  <div key={loc.id} className="flex flex-col">
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase text-[#D91E7A]">
                      <MapPin className="w-2 h-2" />
                      {loc.name}
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold truncate">{loc.phone}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Derecho: Info y Precios */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black text-[#2E3A52] tracking-tighter uppercase leading-tight">
              {product.nombre}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-600 font-bold border-none px-2 py-0.5 uppercase tracking-tighter text-[9px]">
                {product.categoria}
              </Badge>
              {product.stock > 0 && (
                <Badge className="bg-emerald-500 text-white font-black border-none px-2 py-0.5 uppercase tracking-tighter text-[9px]">
                  Disponible
                </Badge>
              )}
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-1 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b pb-1">
              <ListChecks className="w-3 h-3" /> Especificaciones
            </div>
            <p className="text-slate-600 text-sm leading-snug whitespace-pre-wrap font-medium line-clamp-4">
              {product.descripcion?.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim()}
            </p>
          </div>

          {/* Precios Destacados */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white py-3 px-6 rounded-2xl text-center shadow-lg">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">Precio Especial Contado</p>
              <p className="text-4xl font-black tracking-tighter leading-none">
                {formatCurrency(prices.precioContado)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {prices.disponible6Meses && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">6 meses</span>
                  <p className="text-lg font-black text-[#2E3A52] tracking-tighter leading-none">
                    {formatCurrency(prices.cuota6Meses)}
                  </p>
                </div>
              )}
              {prices.disponible12Meses && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">12 meses</span>
                  <p className="text-lg font-black text-[#2E3A52] tracking-tighter leading-none">
                    {formatCurrency(prices.cuota12Meses)}
                  </p>
                </div>
              )}
              {prices.disponible15Meses && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">15 meses</span>
                  <p className="text-lg font-black text-[#2E3A52] tracking-tighter leading-none">
                    {formatCurrency(prices.cuota15Meses)}
                  </p>
                </div>
              )}
              {prices.disponible18Meses && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">18 meses</span>
                  <p className="text-lg font-black text-[#2E3A52] tracking-tighter leading-none">
                    {formatCurrency(prices.cuota18Meses)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest pt-4 border-t border-slate-50">
            Precios sujetos a variaciones sin previo aviso
          </p>
        </div>
      </div>
    </div>
  );
}
