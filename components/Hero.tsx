'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, ChevronLeft, ChevronRight, Laptop, Refrigerator, Sofa, Shirt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { calculatePrices, formatCurrency } from '@/lib/pricing';
import Image from 'next/image';

interface Product {
  id: string;
  nombre: string;
  costo: number;
  margen_porcentaje: number;
  interes_6_meses_porcentaje: number;
  interes_12_meses_porcentaje: number;
  interes_15_meses_porcentaje: number;
  interes_18_meses_porcentaje: number;
  imagen_url: string;
}

export default function Hero() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadFeaturedProducts();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(products.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [products.length]);

  const loadFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, nombre, costo, margen_porcentaje, interes_6_meses_porcentaje, interes_12_meses_porcentaje, interes_15_meses_porcentaje, interes_18_meses_porcentaje, imagen_url')
      .eq('show_in_hero', true)
      .eq('estado', 'Activo')
      .limit(5);

    if (!error && data) {
      setProducts(data);
    }
  };

  // Fixed React namespace error by importing React
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const scrollToSection = () => {
    router.push('/productos');
  };

  return (
    <section
      id="inicio"
      className="relative pt-24 md:pt-36 pb-32 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #E91E63 0%, #D91E7A 25%, #9C27B0 50%, #6B4199 75%, #EC407A 100%)'
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="text-white space-y-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 rounded-lg blur-2xl opacity-50 animate-pulse"></div>
              <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                <span className="inline-block bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent drop-shadow-2xl animate-shimmer">
                  Todo para Tu Hogar
                </span>
              </h1>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-medium opacity-95 leading-relaxed">
              Electrónica, Electrodomésticos, Muebles, Indumentaria Deportiva y Más
            </p>
            <div className="flex gap-3 flex-wrap">
              <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium flex items-center gap-2">
                <Laptop size={16} />
                Electrónica
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium flex items-center gap-2">
                <Refrigerator size={16} />
                Electrodomésticos
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium flex items-center gap-2">
                <Sofa size={16} />
                Muebles
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium flex items-center gap-2">
                <Shirt size={16} />
                Indumentaria
              </span>
            </div>
            <Button
              size="lg"
              onClick={scrollToSection}
              className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ver Productos
            </Button>

            <div className="lg:hidden mt-8">
              <form onSubmit={handleSearch} className="relative" role="search" aria-label="Búsqueda de productos">
                <div className="bg-white rounded-full overflow-hidden flex items-center animate-glow-search">
                  <Search className="ml-4 sm:ml-6 h-5 w-5 sm:h-6 sm:w-6 text-pink-500" aria-hidden="true" />
                  <Input
                    type="search"
                    placeholder="¿Qué producto buscas?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-lg px-3 sm:px-4 py-4 sm:py-6"
                    aria-label="Buscar productos"
                    id="search-mobile"
                    name="search"
                  />
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full px-4 sm:px-6 py-4 sm:py-6 m-2 font-bold text-sm sm:text-base"
                    aria-label="Buscar productos"
                  >
                    Buscar
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[400px] bg-white/10 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">
              {products.length > 0 ? (
                <>
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-8 bg-white rounded-3xl">
                        <div className="w-full max-w-sm aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                          {product.imagen_url ? (
                            <Image
                              src={product.imagen_url}
                              alt={`${product.nombre} - Producto destacado en Don Negro Comercial`}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                              priority={index === 0}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ShoppingCart className="w-24 h-24 text-gray-400" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                          {product.nombre}
                        </h3>
                        <p className="text-2xl font-bold text-pink-600">
                          {formatCurrency(calculatePrices({
                            costo: Number(product.costo ?? 0),
                            margen_porcentaje: Number(product.margen_porcentaje ?? 18),
                            interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
                            interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
                            interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
                            interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
                          }).precioContado)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                    aria-label="Producto anterior"
                    title="Ver producto anterior"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" aria-hidden="true" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                    aria-label="Producto siguiente"
                    title="Ver producto siguiente"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" aria-hidden="true" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" role="tablist" aria-label="Productos destacados">
                    {products.map((product, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlide
                            ? 'bg-white w-8'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        role="tab"
                        aria-label={`Ver ${product.nombre}`}
                        aria-selected={index === currentSlide}
                        title={product.nombre}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-white rounded-3xl">
                  <ShoppingCart className="w-32 h-32 text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto hidden lg:block">
          <form onSubmit={handleSearch} className="relative group" role="search" aria-label="Búsqueda de productos">
            <div className="bg-white rounded-full overflow-hidden flex items-center animate-glow-search hover:animate-none transition-all duration-300">
              <Search className="ml-6 h-6 w-6 text-pink-500" aria-hidden="true" />
              <Input
                type="search"
                placeholder="¿Qué producto buscas?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg px-4 py-6"
                aria-label="Buscar productos"
                id="search-desktop"
                name="search"
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full px-8 py-6 m-2 font-bold shadow-lg hover:shadow-xl transition-all"
                aria-label="Buscar productos"
              >
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
    </section>
  );
}
