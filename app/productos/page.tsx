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
import { ShoppingCart, Package, Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
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
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedLocation, priceRange]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("estado", "Activo")
      .order("nombre");

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
      const cats = Array.from(new Set(data?.map((p) => p.categoria).filter(Boolean)));
      const locs = Array.from(new Set(data?.map((p) => p.ubicacion).filter(Boolean)));
      setCategories(cats as string[]);
      setLocations(locs as string[]);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.categoria === selectedCategory);
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((p) => p.ubicacion === selectedLocation);
    }

    if (priceRange !== "all") {
      filtered = filtered.filter((p) => {
        const price = calculatePrices({
          costo: Number(p.costo ?? 0),
          margen_porcentaje: Number(p.margen_porcentaje ?? 18),
          interes_6_meses_porcentaje: Number(p.interes_6_meses_porcentaje ?? 45),
          interes_12_meses_porcentaje: Number(p.interes_12_meses_porcentaje ?? 65),
          interes_15_meses_porcentaje: Number(p.interes_15_meses_porcentaje ?? 75),
          interes_18_meses_porcentaje: Number(p.interes_18_meses_porcentaje ?? 85),
        }).precioContado;
        switch (priceRange) {
          case "0-500000":
            return price <= 500000;
          case "500000-1000000":
            return price > 500000 && price <= 1000000;
          case "1000000-2000000":
            return price > 1000000 && price <= 2000000;
          case "2000000+":
            return price > 2000000;
          default:
            return true;
        }
      });
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setPriceRange("all");
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    alert("Producto agregado al carrito");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24">
        <BannerSlider section="catalog_top" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
                Catálogo Completo
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Explora todos nuestros productos disponibles
            </p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-6 text-lg"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6 max-h-[calc(100vh-80px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtros
                  </h3>
                  {(selectedCategory !== "all" ||
                    selectedLocation !== "all" ||
                    priceRange !== "all" ||
                    searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <Accordion type="multiple" defaultValue={["categorias", "ubicacion", "precio"]} className="w-full">
                  <AccordionItem value="categorias">
                    <AccordionTrigger className="text-sm font-semibold">
                      Categorías
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            selectedCategory === "all"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Todas
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                              selectedCategory === cat
                                ? "bg-[#D91E7A] text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ubicacion">
                    <AccordionTrigger className="text-sm font-semibold">
                      Ubicación
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedLocation("all")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            selectedLocation === "all"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Todas
                        </button>
                        {locations.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => setSelectedLocation(loc)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                              selectedLocation === loc
                                ? "bg-[#D91E7A] text-white"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="precio">
                    <AccordionTrigger className="text-sm font-semibold">
                      Rango de Precio
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <button
                          onClick={() => setPriceRange("all")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            priceRange === "all"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setPriceRange("0-500000")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            priceRange === "0-500000"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Hasta ₲ 500.000
                        </button>
                        <button
                          onClick={() => setPriceRange("500000-1000000")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            priceRange === "500000-1000000"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          ₲ 500.000 - ₲ 1.000.000
                        </button>
                        <button
                          onClick={() => setPriceRange("1000000-2000000")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            priceRange === "1000000-2000000"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          ₲ 1.000.000 - ₲ 2.000.000
                        </button>
                        <button
                          onClick={() => setPriceRange("2000000+")}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            priceRange === "2000000+"
                              ? "bg-[#D91E7A] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          Más de ₲ 2.000.000
                        </button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}{" "}
                  encontrado{filteredProducts.length !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {showMobileFilters && (
                <div className="lg:hidden mb-6 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="font-semibold text-sm mb-2 block">Categoría</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="all">Todas</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-sm mb-2 block">Ubicación</label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="all">Todas</option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-sm mb-2 block">Precio</label>
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="all">Todos</option>
                        <option value="0-500000">Hasta ₲ 500.000</option>
                        <option value="500000-1000000">₲ 500.000 - ₲ 1.000.000</option>
                        <option value="1000000-2000000">₲ 1.000.000 - ₲ 2.000.000</option>
                        <option value="2000000+">Más de ₲ 2.000.000</option>
                      </select>
                    </div>
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              )}

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
                      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-[#D91E7A] sm:border-gray-200 hover:border-[#D91E7A] sm:hover:border-[#D91E7A]">
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
                              {product.stock <= 5 && product.stock > 0 && (
                                <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-orange-500 text-xs px-1.5 sm:px-2 py-0.5 z-10">
                                  <span className="hidden sm:inline">Últimas unidades</span>
                                  <span className="sm:hidden">Pocas</span>
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-xs sm:text-lg text-[#2E3A52] mb-1 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[3.5rem]">
                              {product.nombre}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
                              {product.descripcion}
                            </p>
                          </Link>
                          <div className="mb-2 sm:mb-3">
                            <span className="text-base sm:text-2xl font-bold text-[#D91E7A] block mb-0.5 sm:mb-1">
                              {formatCurrency(prices.precioContado)}
                            </span>
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
                            disabled={product.stock === 0}
                          >
                            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{product.stock === 0 ? "Sin Stock" : "Agregar al Carrito"}</span>
                            <span className="sm:hidden">{product.stock === 0 ? "Sin Stock" : "Agregar"}</span>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No se encontraron productos</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Limpiar Filtros
                  </Button>
                </div>
              )}
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
