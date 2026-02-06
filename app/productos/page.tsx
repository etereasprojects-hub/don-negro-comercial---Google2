"use client";

import { useState, useEffect, Suspense } from "react";
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
import FloatingButtons from "@/components/FloatingButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  MapPin,
  Tag,
  DollarSign,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

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
  estado: string;
  active: boolean;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // States para Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    loadProducts();
    const searchQuery = searchParams.get('search');
    if (searchQuery) setSearchTerm(searchQuery);
  }, [searchParams]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategories, selectedDeliveries, priceRange]);

  const loadProducts = async () => {
    setLoading(true);
    setLoadProgress(20);
    
    // Simulación de progreso de carga
    const interval = setInterval(() => {
      setLoadProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or('estado.eq.Activo,active.eq.true')
        .order("nombre");

      if (error) throw error;

      if (data) {
        setProducts(data || []);
        const cats = Array.from(new Set(data.map((p) => p.categoria).filter(Boolean)));
        setCategories(cats as string[]);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      clearInterval(interval);
      setLoadProgress(100);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.categoria));
    }

    if (selectedDeliveries.length > 0) {
      filtered = filtered.filter(p => {
        const is24 = p.ubicacion?.includes('Asunción');
        const is48 = p.ubicacion?.includes('CDE') || p.ubicacion?.includes('Almacén');
        if (selectedDeliveries.includes('24') && is24) return true;
        if (selectedDeliveries.includes('48') && is48) return true;
        return false;
      });
    }
    
    if (priceRange) {
      filtered = filtered.filter(p => {
        const prices = calculatePrices({
          costo: Number(p.costo ?? 0),
          margen_porcentaje: Number(p.margen_porcentaje ?? 18),
          interes_6_meses_porcentaje: Number(p.interes_6_meses_porcentaje ?? 45),
          interes_12_meses_porcentaje: Number(p.interes_12_meses_porcentaje ?? 65),
          interes_15_meses_porcentaje: Number(p.interes_15_meses_porcentaje ?? 75),
          interes_18_meses_porcentaje: Number(p.interes_18_meses_porcentaje ?? 85),
        });
        const price = prices.precioContado;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    setFilteredProducts(filtered);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleDelivery = (time: string) => {
    setSelectedDeliveries(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
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
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full">
        {/* Filtro Categorías */}
        <AccordionItem value="categories" className="border-none">
          <AccordionTrigger className="hover:no-underline py-3 px-1">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#2E3A52]">
              <Tag className="w-4 h-4 text-[#D91E7A]" /> Categorías
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center space-x-3 p-1">
                  <Checkbox 
                    id={`cat-${cat}`} 
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                    {cat}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro Tiempo de Entrega */}
        <AccordionItem value="delivery" className="border-none">
          <AccordionTrigger className="hover:no-underline py-3 px-1">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#2E3A52]">
              <Clock className="w-4 h-4 text-[#6B4199]" /> Tiempo de Entrega
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-3 p-1">
                <Checkbox 
                  id="del-24" 
                  checked={selectedDeliveries.includes('24')}
                  onCheckedChange={() => toggleDelivery('24')}
                />
                <label htmlFor="del-24" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                  Entrega en 24 hs
                </label>
              </div>
              <div className="flex items-center space-x-3 p-1">
                <Checkbox 
                  id="del-48" 
                  checked={selectedDeliveries.includes('48')}
                  onCheckedChange={() => toggleDelivery('48')}
                />
                <label htmlFor="del-48" className="text-sm font-medium leading-none cursor-pointer text-slate-600">
                  Entrega en 48 hs
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro Rango de Precio */}
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="hover:no-underline py-3 px-1">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#2E3A52]">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Rango de Precio
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {[
                { label: 'Hasta 1.000.000 ₲', val: [0, 1000000] },
                { label: '1.000.000 ₲ a 5.000.000 ₲', val: [1000000, 5000000] },
                { label: 'Más de 5.000.000 ₲', val: [5000000, 999999999] },
              ].map((range, i) => (
                <div key={i} className="flex items-center space-x-3 p-1">
                   <button 
                    onClick={() => setPriceRange(range.val as [number, number])}
                    className={`text-xs p-2 rounded-lg border w-full text-left transition-all ${priceRange?.[0] === range.val[0] ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-50'}`}
                   >
                     {range.label}
                   </button>
                </div>
              ))}
              {priceRange && (
                <Button variant="ghost" size="sm" onClick={() => setPriceRange(null)} className="w-full text-[10px] uppercase font-bold text-red-500">
                  Limpiar precio
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full text-[10px] font-black uppercase tracking-widest h-10 border-slate-200"
          onClick={() => {
            setSelectedCategories([]);
            setSelectedDeliveries([]);
            setPriceRange(null);
            setSearchTerm("");
          }}
        >
          Limpiar Todos los Filtros
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-[#D91E7A] animate-spin" />
              <Package className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Consultando nuestro inventario...</h3>
            <p className="text-sm text-slate-500 font-medium">Estamos buscando las mejores opciones para ti.</p>
          </div>
          <div className="space-y-2">
            <Progress value={loadProgress} className="h-2 bg-slate-100" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{loadProgress}% completado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Título de la página y buscador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[#2E3A52] tracking-tighter uppercase italic">Nuestro Catálogo</h1>
          <p className="text-gray-500 font-medium italic">Explora {filteredProducts.length} productos disponibles ahora mismo</p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#D91E7A] transition-colors" />
          <Input
            placeholder="¿Qué estás buscando hoy?"
            className="pl-12 h-14 bg-white border-2 border-gray-100 rounded-2xl shadow-sm focus:border-[#D91E7A] focus:ring-0 transition-all text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Escritorio */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-28 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <FiltersContent />
          </div>
        </aside>

        {/* Botón Filtros Móvil */}
        <div className="lg:hidden mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2 font-black border-2 border-slate-200 uppercase tracking-widest text-xs">
                <Filter size={18} className="text-[#D91E7A]" /> Filtrar Catálogo
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left font-black uppercase italic tracking-tighter">Personalizar Búsqueda</SheetTitle>
              </SheetHeader>
              <FiltersContent />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
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
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-[#D91E7A] relative overflow-hidden flex flex-col h-full rounded-3xl">
                    {(product.ubicacion?.includes('Asunción') || product.ubicacion?.includes('CDE') || product.ubicacion?.includes('Almacén')) && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className={`${product.ubicacion?.includes('Asunción') ? 'bg-blue-600' : 'bg-orange-600'} text-[8px] sm:text-[9px] px-2 py-1 font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg border-none`}>
                          <Clock className="w-3 h-3" />
                          {product.ubicacion?.includes('Asunción') ? "Entrega 24 hs" : "Entrega 48 hs"}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-3 sm:p-5 flex flex-col h-full">
                      <Link href={`/${product.url_slug}`} className="block group/img">
                        <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden relative p-4">
                          {product.imagen_url ? (
                            <Image 
                              src={product.imagen_url} 
                              alt={product.nombre} 
                              fill 
                              className="object-contain group-hover/img:scale-110 transition-transform duration-500" 
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-200" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-xs sm:text-base text-[#2E3A52] mb-1 line-clamp-2 min-h-[3rem] uppercase leading-tight group-hover/img:text-[#D91E7A] transition-colors">{product.nombre}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem] leading-tight">{stripHtml(product.descripcion)}</p>
                      </Link>
                      
                      <div className="mt-auto space-y-4">
                        <div className="flex flex-col">
                          <span className="text-xl sm:text-2xl font-black text-[#D91E7A] tracking-tighter">{formatCurrency(prices.precioContado)}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Precio Contado</span>
                        </div>

                        <div className="space-y-2">
                          <button 
                            onClick={(e) => { e.preventDefault(); setExpandedProduct(isExpanded ? null : product.id); }} 
                            className={`w-full flex items-center justify-between px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-tighter border rounded-xl transition-all ${isExpanded ? 'bg-[#6B4199] text-white border-[#6B4199]' : 'text-[#6B4199] border-[#6B4199]/20 hover:bg-purple-50'}`}
                          >
                            <span>Financiación</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {isExpanded && (
                            <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-[10px] sm:text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                              {prices.disponible6Meses && (
                                <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                                  <span className="text-gray-500">6 cuotas:</span>
                                  <span className="text-[#6B4199]">{formatCurrency(prices.cuota6Meses)}</span>
                                </div>
                              )}
                              {prices.disponible12Meses && (
                                <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                                  <span className="text-gray-500">12 cuotas:</span>
                                  <span className="text-[#6B4199]">{formatCurrency(prices.cuota12Meses)}</span>
                                </div>
                              )}
                              {prices.disponible18Meses && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">18 cuotas:</span>
                                  <span className="text-[#6B4199]">{formatCurrency(prices.cuota18Meses)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <Button 
                          onClick={(e) => { e.preventDefault(); handleAddToCart(product); }} 
                          className="w-full bg-[#D91E7A] hover:bg-[#6B4199] h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#D91E7A]/20 transition-all active:scale-95" 
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {product.stock === 0 ? "Sin Stock" : "Lo quiero"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter">No encontramos resultados</h3>
                <p className="text-slate-500 italic">Intenta con otros filtros o términos de búsqueda.</p>
                <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedCategories([]); setSelectedDeliveries([]); setPriceRange(null); }} className="mt-4 text-[#D91E7A] font-bold uppercase text-xs tracking-widest">
                  Ver todo el catálogo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFDFD] pt-24 pb-20">
        <BannerSlider section="catalog_top" />
        <Suspense fallback={
          <div className="container mx-auto px-4 py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D91E7A] mx-auto mb-4"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Cargando Catálogo...</p>
          </div>
        }>
          <ProductsContent />
        </Suspense>
        <BannerSlider section="catalog_bottom" />
      </main>
      <Footer />
      <WhatsAppButton />
      <FloatingButtons />
    </>
  );
}