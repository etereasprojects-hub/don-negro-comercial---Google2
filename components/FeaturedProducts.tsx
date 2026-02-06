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

  // Función para limpiar HTML de la descripción en el preview de la tarjeta
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Los mejores productos seleccionados para ti
          </p>
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
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 sm:border-4 border-green-500 hover:border-green-600 relative overflow-visible">
                  <Badge className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-green-500 hover:bg-green-600 text-white px-1.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold shadow-lg z-10 flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                    <span className="hidden sm:inline">Destacado</span>
                  </Badge>

                  {/* Badge de entrega para Fastrax */}
                  {product.source === 'Fastrax' && (
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      <Badge className={`${product.ubicacion?.includes('Asunción') ? 'bg-blue-600' : 'bg-orange-600'} text-[8px] sm:text-[10px] px-2 font-black uppercase tracking-tighter flex items-center gap-1`}>
                        <Clock className="w-3 h-3" />
                        {product.ubicacion?.includes('Asunción') ? "Entrega en 24 hs" : "Entrega en 48 hs"}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-2 sm:p-4">
                    <Link
                      href={`/${product.url_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-2 sm:mb-4 overflow-hidden relative p-1 sm:p-2">
                        {product.imagen_url ? (
                          <Image
                            src={product.imagen_url}
                            alt={product.nombre}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-contain group-hover:scale-110 transition-transform duration-300 p-1 sm:p-2"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-8 h-8 sm:w-16 sm:h-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-xs sm:text-lg text-[#2E3A52] mb-1 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[3.5rem]">
                        {product.nombre}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                        {stripHtml(product.descripcion)}
                      </p>
                    </Link>
                    <div className="mb-2 sm:mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base sm:text-2xl font-bold text-[#D91E7A]">
                          {formatCurrency(prices.precioContado)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Precio contado</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedProduct(isExpanded ? null : product.id);
                      }}
                      className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 mb-2 text-xs sm:text-sm text-[#6B4199] hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                    >
                      <span className="font-medium">Financiación</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mb-2 sm:mb-3 p-2 bg-gray-50 rounded-lg space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        {prices.disponible6Meses && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">6 cuotas:</span>
                            <span className="font-semibold text-[#6B4199]">{formatCurrency(prices.cuota6Meses)}</span>
                          </div>
                        )}
                        {prices.disponible12Meses && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">12 cuotas:</span>
                            <span className="font-semibold text-[#6B4199]">{formatCurrency(prices.cuota12Meses)}</span>
                          </div>
                        )}
                        {prices.disponible15Meses && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">15 cuotas:</span>
                            <span className="font-semibold text-[#6B4199]">{formatCurrency(prices.cuota15Meses)}</span>
                          </div>
                        )}
                        {prices.disponible18Meses && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">18 cuotas:</span>
                            <span className="font-semibold text-[#6B4199]">{formatCurrency(prices.cuota18Meses)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      className="w-full bg-[#D91E7A] hover:bg-[#6B4199] transition-colors text-xs sm:text-base py-1.5 sm:py-2"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Agregar al Carrito</span>
                      <span className="sm:hidden">Agregar</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay productos destacados disponibles
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/productos">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] hover:from-[#6B4199] hover:to-[#D91E7A] text-white px-8 py-6 text-lg"
            >
              Ver Todos los Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}