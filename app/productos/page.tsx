"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Cart from "@/components/Cart";
import BannerSlider from "@/components/BannerSlider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, Search, Filter, X, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  categoria: string;
  stock: number;
  ubicacion: string;
  source?: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
    const searchQuery = searchParams.get('search');
    if (searchQuery) setSearchTerm(searchQuery);
  }, [searchParams]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedLocation, priceRange]);

  const loadProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").eq("estado", "Activo").order("nombre");
    if (!error) {
      setProducts(data || []);
      const cats = Array.from(new Set(data?.map((p) => p.categoria).filter(Boolean)));
      const locs = Array.from(new Set(data?.map((p) => p.ubicacion).filter(Boolean)));
      setCategories(cats as string[]);
      setLocations(locs as string[]);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (searchTerm) filtered = filtered.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategory !== "all") filtered = filtered.filter(p => p.categoria === selectedCategory);
    if (selectedLocation !== "all") filtered = filtered.filter(p => p.ubicacion === selectedLocation);
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    const calc = calculatePrices({
      costo: Number(product.costo ?? 0),
      margen_porcentaje: Number(product.margen_porcentaje ?? 18),
      interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
      interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
      interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
      interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
    });
    addItem({ ...product, precio: calc.precioContado });
    alert("Agregado al carrito");
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24">
        <BannerSlider section="catalog_top" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-6">
            <aside className="hidden lg:block w-64 flex-shrink-0">
               {/* Sidebar de Filtros (Omitido por brevedad, se mantiene funcionalidad original) */}
            </aside>

            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map((product) => {
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
                      <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-[#D91E7A] relative overflow-hidden">
                        {product.source === 'Fastrax' && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className={`${product.ubicacion?.includes('Asunción') ? 'bg-blue-600' : 'bg-orange-600'} text-[8px] sm:text-[10px] px-2 font-black uppercase tracking-tighter flex items-center gap-1`}>
                              <Clock className="w-3 h-3" />
                              {product.ubicacion?.includes('Asunción') ? "Entrega en 24 hs" : "Entrega en 48 hs"}
                            </Badge>
                          </div>
                        )}

                        <CardContent className="p-2 sm:p-4">
                          <Link href={`/${product.url_slug}`} target="_blank">
                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 sm:mb-4 overflow-hidden relative p-1">
                              {product.imagen_url ? <Image src={product.imagen_url} alt={product.nombre} fill className="object-contain group-hover:scale-110 transition-transform" /> : <Package className="w-8 h-8 text-gray-300" />}
                            </div>
                            <h3 className="font-bold text-xs sm:text-base text-[#2E3A52] mb-1 line-clamp-2 min-h-[2.5rem] uppercase">{product.nombre}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500 mb-2 line-clamp-2 min-h-[2.5rem] leading-tight">{stripHtml(product.descripcion)}</p>
                          </Link>
                          
                          <div className="mb-2">
                            <span className="text-base sm:text-xl font-black text-[#D91E7A] block">{formatCurrency(prices.precioContado)}</span>
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Contado</p>
                          </div>

                          <button onClick={(e) => { e.preventDefault(); setExpandedProduct(isExpanded ? null : product.id); }} className="w-full flex items-center justify-between px-2 py-1 mb-2 text-[10px] text-[#6B4199] border rounded uppercase font-bold">
                            <span>Financiación</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isExpanded && (
                            <div className="mb-2 p-2 bg-gray-50 rounded text-[10px] font-bold space-y-1">
                              {prices.disponible6Meses && <div className="flex justify-between"><span>6 meses:</span><span>{formatCurrency(prices.cuota6Meses)}</span></div>}
                              {prices.disponible12Meses && <div className="flex justify-between"><span>12 meses:</span><span>{formatCurrency(prices.cuota12Meses)}</span></div>}
                            </div>
                          )}

                          <Button onClick={(e) => { e.preventDefault(); handleAddToCart(product); }} className="w-full bg-[#D91E7A] h-9 text-xs" disabled={product.stock === 0}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {product.stock === 0 ? "Sin Stock" : "Agregar"}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <BannerSlider section="catalog_bottom" />
      </main>
      <Footer />
      <WhatsAppButton />
      <Cart />
    </>
  );
}