"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Search, 
  Filter, 
  Clock,
  Tag,
  DollarSign,
  LogOut,
  User,
  AlertCircle,
  ShoppingCart,
  Minus,
  Plus,
  X,
  ShieldCheck,
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
  imagen_url: string;
  descripcion: string;
  categoria: string;
  stock: number;
  ubicacion: string;
  source?: string;
  estado: string;
  active: boolean;
  precio_mayorista: number | null;
  factor_mayorista: number | null;
  min_cantidad_mayorista: number;
}

interface WholesaleCartItem {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  cantidad: number;
  stock: number;
  min_cantidad_mayorista: number;
}

interface MayoristaClientProps {
  initialProducts: Product[];
  userEmail: string;
}

export default function MayoristaClient({ initialProducts, userEmail }: MayoristaClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  
  const [categories, setCategories] = useState<string[]>([]);

  // Wholesale Cart State
  const [wholesaleCart, setWholesaleCart] = useState<WholesaleCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    documento: "",
  });

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("wholesale_cart");
    if (savedCart) {
      setWholesaleCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("wholesale_cart", JSON.stringify(wholesaleCart));
  }, [wholesaleCart]);

  const addToWholesaleCart = (product: Product, quantity: number) => {
    const price = getWholesalePrice(product) || 0;
    setWholesaleCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: Math.min(item.cantidad + quantity, product.stock) }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          nombre: product.nombre,
          precio: price,
          imagen_url: product.imagen_url,
          cantidad: quantity,
          stock: product.stock,
          min_cantidad_mayorista: product.min_cantidad_mayorista || 1,
        },
      ];
    });
    setCartOpen(true);
  };

  const removeFromWholesaleCart = (productId: string) => {
    setWholesaleCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateWholesaleQuantity = (productId: string, cantidad: number) => {
    setWholesaleCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, cantidad: Math.max(1, Math.min(cantidad, item.stock)) } : item
      )
    );
  };

  const handleWholesaleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wholesaleCart.length === 0) return;

    setLoading(true);
    try {
      // 1. Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerData.name,
            customer_email: customerData.email,
            customer_phone: customerData.phone,
            customer_address: customerData.address,
            items: wholesaleCart.map(item => ({
              id: item.id,
              nombre: item.nombre,
              precio: item.precio,
              imagen_url: item.imagen_url,
              cantidad: item.cantidad
            })),
            total: wholesaleCart.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
            status: "pendiente",
            order_type: 'mayorista'
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Call Pagopar API
      const response = await fetch('/api/pagopar/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          customer: customerData,
          items: wholesaleCart.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio,
            imagen_url: item.imagen_url,
            cantidad: item.cantidad
          }))
        })
      });

      const payData = await response.json();

      if (!response.ok || !payData?.url) {
        throw new Error(payData.details || payData.error || "Error al conectar con la pasarela");
      }

      // 3. Clear cart and redirect
      setWholesaleCart([]);
      window.location.href = payData.url;
      
    } catch (error: any) {
      console.error("Wholesale Checkout Error:", error);
      alert("Hubo un problema al procesar tu pedido mayorista: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const itemsInvalidos = wholesaleCart.filter(item => 
    item.cantidad < item.min_cantidad_mayorista && item.cantidad < item.stock
  );
  const canCheckout = itemsInvalidos.length === 0;
  const cartTotal = wholesaleCart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const getWholesalePrice = useCallback((product: Product) => {
    const basePrices = calculatePrices({
      costo: Number(product.costo ?? 0),
      margen_porcentaje: Number(product.margen_porcentaje ?? 18),
      interes_6_meses_porcentaje: 0,
      interes_12_meses_porcentaje: 0,
      interes_15_meses_porcentaje: 0,
      interes_18_meses_porcentaje: 0,
    });

    if (product.factor_mayorista && product.factor_mayorista > 0) {
      return basePrices.precioContado * product.factor_mayorista;
    }

    if (product.precio_mayorista && product.precio_mayorista > 0) {
      return product.precio_mayorista;
    }

    return null;
  }, []);

  const filterProducts = useCallback(() => {
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
        const price = getWholesalePrice(p);
        if (price === null) return false;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    setFilteredProducts(filtered);
    setVisibleCount(24);
  }, [products, searchTerm, selectedCategories, selectedDeliveries, priceRange, getWholesalePrice]);

  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) setSearchTerm(searchQuery);
    
    const cats = Array.from(new Set(initialProducts.map((p) => p.categoria).filter(Boolean)));
    setCategories(cats as string[]);
  }, [searchParams, initialProducts]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleLogout = async () => {
    await fetch("/login/logout", { method: "POST" });
    router.push("/productos");
    router.refresh();
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

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  };

  const FiltersContent = () => (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full">
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Mayorista */}
      <div className="bg-white border-2 border-emerald-100 rounded-[32px] p-6 mb-12 shadow-xl shadow-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-[#2E3A52] tracking-tight uppercase italic">Bienvenido, {userEmail}</h2>
              <Badge className="bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5">MAYORISTA</Badge>
            </div>
            <p className="text-slate-400 text-sm font-medium">Estás viendo precios exclusivos para distribuidores</p>
          </div>
        </div>
        
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="rounded-xl border-2 border-slate-200 hover:border-red-500 hover:text-red-500 font-black uppercase text-xs tracking-widest h-12 px-6 gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[#2E3A52] tracking-tighter uppercase italic">Catálogo Mayorista</h1>
          <p className="text-gray-500 font-medium italic">Mostrando {filteredProducts.length} productos con precios especiales</p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#D91E7A] transition-colors" />
          <Input
            placeholder="Buscar productos mayoristas..."
            className="pl-12 h-14 bg-white border-2 border-gray-100 rounded-2xl shadow-sm focus:border-[#D91E7A] focus:ring-0 transition-all text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-28 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <FiltersContent />
          </div>
        </aside>

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
              filteredProducts.slice(0, visibleCount).map((product) => {
                const wholesalePrice = getWholesalePrice(product);

                  return (
                    <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-emerald-50 hover:border-emerald-500 relative overflow-hidden flex flex-col h-full rounded-3xl bg-white">
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
                          <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative p-4">
                            {product.imagen_url ? (
                              <Image 
                                src={product.imagen_url} 
                                alt={product.nombre} 
                                fill 
                                className="object-contain group-hover/img:scale-110 transition-transform duration-500" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-200" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-xs sm:text-base text-[#2E3A52] mb-1 line-clamp-2 min-h-[3rem] uppercase leading-tight group-hover/img:text-emerald-600 transition-colors">{product.nombre}</h3>
                          <p className="text-[10px] sm:text-xs text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem] leading-tight">{stripHtml(product.descripcion)}</p>
                        </Link>
                        
                        <div className="mt-auto pt-4 border-t border-slate-50">
                          <div className="flex flex-col mb-4">
                            {wholesalePrice !== null ? (
                              <>
                                <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(wholesalePrice)}</span>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Precio Mayorista Contado
                                  </span>
                                  {product.min_cantidad_mayorista > 0 && (
                                    <span className="text-[10px] text-amber-600 uppercase font-black tracking-widest flex items-center gap-1">
                                      <Package className="w-3 h-3" /> Mínimo: {product.min_cantidad_mayorista} unid.
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-bold uppercase tracking-tighter">Precio a consultar</span>
                              </div>
                            )}
                          </div>

                          {product.stock > 0 ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min={1} 
                                  max={product.stock} 
                                  defaultValue={1}
                                  id={`qty-${product.id}`}
                                  className="w-20 h-10 rounded-xl border-2 border-slate-100 text-center font-bold"
                                />
                                <Button 
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95" 
                                  onClick={() => {
                                    const input = document.getElementById(`qty-${product.id}`) as HTMLInputElement;
                                    const qty = parseInt(input.value) || 1;
                                    addToWholesaleCart(product, qty);
                                  }}
                                >
                                  Agregar al Carrito
                                </Button>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center font-medium italic">Stock disponible: {product.stock}</p>
                            </div>
                          ) : (
                            <Button 
                              className="w-full bg-slate-200 text-slate-500 h-12 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed" 
                              disabled
                            >
                              Sin Stock
                            </Button>
                          )}
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
                <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedCategories([]); setSelectedDeliveries([]); setPriceRange(null); }} className="mt-4 text-emerald-600 font-bold uppercase text-xs tracking-widest">
                  Ver todo el catálogo mayorista
                </Button>
              </div>
            )}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <Button
                onClick={() => setVisibleCount(prev => prev + 24)}
                variant="outline"
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
              >
                Ver más productos
              </Button>
              <p className="text-xs text-gray-400">
                Mostrando {Math.min(visibleCount, filteredProducts.length)} de {filteredProducts.length}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      <Button 
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg bg-emerald-600 hover:bg-emerald-700 z-50"
      >
        <ShoppingCart className="w-6 h-6" />
        {wholesaleCart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
            {wholesaleCart.length}
          </span>
        )}
      </Button>

      {/* Wholesale Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left font-black uppercase italic tracking-tighter">Carrito Mayorista</SheetTitle>
          </SheetHeader>

          {!showCheckout ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {wholesaleCart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-tighter">Tu carrito mayorista está vacío</p>
                  </div>
                ) : (
                  wholesaleCart.map((item) => (
                    <div key={item.id} className="flex gap-4 border-b pb-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl relative flex-shrink-0 overflow-hidden">
                        {item.imagen_url ? (
                          <Image
                            src={item.imagen_url}
                            alt={item.nombre}
                            fill
                            sizes="80px"
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-[#2E3A52] uppercase leading-tight line-clamp-1">{item.nombre}</h3>
                        <p className="text-emerald-600 font-black tracking-tighter">
                          {formatCurrency(item.precio)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-lg border-2 border-slate-100"
                            onClick={() => updateWholesaleQuantity(item.id, item.cantidad - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input 
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => updateWholesaleQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center font-bold border-2 border-slate-100 rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 rounded-lg border-2 border-slate-100"
                            onClick={() => updateWholesaleQuantity(item.id, item.cantidad + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromWholesaleCart(item.id)}
                            className="ml-auto text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {item.cantidad < item.min_cantidad_mayorista && item.cantidad < item.stock && (
                          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                            ⚠️ Mínimo mayorista: {item.min_cantidad_mayorista} unidades
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {wholesaleCart.length > 0 && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex justify-between text-xl font-black uppercase tracking-tighter italic">
                    <span>Total:</span>
                    <span className="text-emerald-600">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="space-y-2">
                    <Button
                      className={`w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all ${canCheckout ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                      onClick={() => canCheckout && setShowCheckout(true)}
                      disabled={!canCheckout}
                    >
                      Proceder al Pago
                    </Button>
                    {!canCheckout && (
                      <p className="text-[10px] text-red-500 text-center font-black uppercase tracking-widest">
                        Algunos productos no alcanzan la cantidad mínima mayorista
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleWholesaleCheckout} className="py-4 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-4 flex items-center gap-3">
                <ShieldCheck className="text-emerald-600" size={24} />
                <p className="text-xs text-emerald-800 font-medium">Pago seguro mayorista procesado por Pagopar.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Completo *</label>
                  <Input
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="Nombre y Apellido"
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cédula de Identidad *</label>
                  <Input
                    value={customerData.documento}
                    onChange={(e) => setCustomerData({ ...customerData, documento: e.target.value.replace(/\D/g, '') })}
                    required
                    disabled={loading}
                    placeholder="Nro de Documento"
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono *</label>
                  <Input
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="09xx xxx xxx"
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo Electrónico *</label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="tu@email.com"
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección de Entrega *</label>
                  <Input
                    value={customerData.address}
                    onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="Ciudad, Calle y Nro de Casa"
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex justify-between text-xl font-black uppercase tracking-tighter italic">
                  <span>Total a Pagar:</span>
                  <span className="text-emerald-600">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-slate-100"
                    disabled={loading}
                  >
                    Volver
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Pagar Ahora"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
