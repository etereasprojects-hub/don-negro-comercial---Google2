"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Star, ChevronDown, ChevronUp, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  nombre: string;
  url_slug: string;
  costo: number;
  margen_porcentaje: number;
  interes_6_meses_porcentaje: number;
  interes_12_meses_porcentaje: number;
  interes_15_meses_porcentaje: number;
  interes_18_meses_porcentaje: number;
  imagen_url: string;
  descripcion: string;
  source?: string;
  ubicacion?: string;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, nombre, url_slug, costo, margen_porcentaje, interes_6_meses_porcentaje, interes_12_meses_porcentaje, interes_15_meses_porcentaje, interes_18_meses_porcentaje, imagen_url, descripcion, source, ubicacion")
      .eq("destacado", true)
      .eq("estado", "Activo")
      .limit(12);

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }
  };

  const handleAddToCart = (product: Product) => {
    const precio = calculatePrices({
      costo: Number(product.costo ?? 0),
      margen_porcentaje: Number(product.margen_porcentaje ?? 18),
      interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
      interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
      interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
      interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
    }).precioContado;

    addItem({ ...product, precio });
    alert("Producto agregado al carrito");
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
              Productos Destacados
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Seleccionamos lo mejor de nuestro inventario para ti</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto">
          {products.map((product) => {
            const prices = calculatePrices({
              costo: Number(product.costo ?? 0),
              margen_porcentaje: Number(product.margen_porcentaje ?? 18),
              interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
              interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
              interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
              interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
            });
            const isExpanded = expandedProduct === product.id;

            return (
              <div key={product.id}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 sm:border-4 border-emerald-500 hover:border-emerald-600 relative overflow-visible rounded-3xl">
                  <Badge className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-emerald-500 hover:bg-emerald-600 text-white px-1.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-black shadow-lg z-10 flex items-center gap-1 uppercase border-none">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                    <span className="hidden sm:inline">Top Choice</span>
                  </Badge>

                  {(product.ubicacion?.includes('Asunción') || product.ubicacion?.includes('CDE') || product.ubicacion?.includes('Almacén')) && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className={`${product.ubicacion?.includes('Asunción') ? 'bg-blue-600' : 'bg-orange-600'} text-[8px] sm:text-[10px] px-2 font-black uppercase tracking-tighter flex items-center gap-1 border-none shadow-md`}>
                        <Clock className="w-3 h-3" />
                        {product.ubicacion?.includes('Asunción') ? "24 hs" : "48 hs"}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-2 sm:p-4">
                    <Link href={`/${product.url_slug}`}>
                      <div className="aspect-square bg-gray-100 rounded-2xl mb-2 sm:mb-4 overflow-hidden relative p-1 sm:p-2">
                        {product.imagen_url ? (
                          <Image src={product.imagen_url} alt={product.nombre} fill sizes="25vw" className="object-contain group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><Package className="w-8 h-8 sm:w-16 sm:h-16 text-gray-400" /></div>
                        )}
                      </div>
                      <h3 className="font-black text-xs sm:text-base text-[#2E3A52] mb-1 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[3rem] uppercase tracking-tighter leading-tight group-hover:text-[#D91E7A] transition-colors">{product.nombre}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-400 mb-2 line-clamp-2 min-h-[2.5rem] leading-tight font-medium">{stripHtml(product.descripcion)}</p>
                    </Link>
                    <div className="mb-2 sm:mb-3">
                      <span className="text-base sm:text-2xl font-black text-[#D91E7A] tracking-tighter">{formatCurrency(prices.precioContado)}</span>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest italic">Precio contado</p>
                    </div>

                    <button onClick={(e) => { e.preventDefault(); setExpandedProduct(isExpanded ? null : product.id); }} className="w-full flex items-center justify-between px-2 py-1.5 mb-2 text-[10px] sm:text-xs text-[#6B4199] hover:bg-purple-50 rounded-xl border border-[#6B4199]/20 transition-all uppercase font-black tracking-tighter">
                      <span>Planes a Crédito</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="mb-2 p-2 bg-slate-50 rounded-xl space-y-1 text-[10px] sm:text-xs font-black animate-in slide-in-from-top-2">
                        {prices.disponible6Meses && <div className="flex justify-between border-b border-slate-100 pb-1"><span>6 cuotas:</span><span className="text-[#6B4199]">{formatCurrency(prices.cuota6Meses)}</span></div>}
                        {prices.disponible12Meses && <div className="flex justify-between border-b border-slate-100 pb-1"><span>12 cuotas:</span><span className="text-[#6B4199]">{formatCurrency(prices.cuota12Meses)}</span></div>}
                        {prices.disponible18Meses && <div className="flex justify-between"><span>18 cuotas:</span><span className="text-[#6B4199]">{formatCurrency(prices.cuota18Meses)}</span></div>}
                      </div>
                    )}

                    <Button onClick={(e) => { e.preventDefault(); handleAddToCart(product); }} className="w-full bg-[#D91E7A] hover:bg-[#6B4199] transition-all text-[10px] font-black uppercase tracking-widest py-1.5 h-10 rounded-xl active:scale-95 shadow-md shadow-[#D91E7A]/20">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Lo Quiero
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}