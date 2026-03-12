'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Laptop, Refrigerator, Sofa, Shirt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HeroProps {
  heroImage: string | null;
}

export default function Hero({ heroImage }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const scrollToSection = () => {
    router.push('/productos');
  };

  return (
    <section
      id="inicio"
      className="relative pt-24 md:pt-28 pb-16 overflow-hidden bg-[#F7F7F9]"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          
          {/* Columna izquierda — texto */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight text-[#1A1A2E]">
              Todo para<br />
              Tu{' '}
              <span
                className="relative inline-block px-3 py-1 text-white rounded-md"
                style={{ background: 'linear-gradient(135deg, #D91E7A, #6B4199)' }}
              >
                Hogar
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed">
              Electrónica, Electrodomésticos, Muebles,<br className="hidden sm:block" />
              Indumentaria Deportiva y Más
            </p>

            <div className="flex gap-3 flex-wrap">
              {[
                { icon: <Laptop size={15} />, label: 'Electrónica' },
                { icon: <Refrigerator size={15} />, label: 'Electrodomésticos' },
                { icon: <Sofa size={15} />, label: 'Muebles' },
                { icon: <Shirt size={15} />, label: 'Indumentaria' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="px-4 py-1.5 border border-[#D91E7A]/30 text-[#D91E7A] rounded-full text-sm font-medium flex items-center gap-2 bg-white shadow-sm"
                >
                  {icon}
                  {label}
                </span>
              ))}
            </div>

            <Button
              size="lg"
              onClick={scrollToSection}
              className="relative overflow-hidden bg-[#D91E7A] hover:bg-[#6B4199] text-white px-8 py-6 text-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
            >
              <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ver Productos
            </Button>

            {/* Buscador móvil */}
            <div className="lg:hidden mt-4">
              <form onSubmit={handleSearch} className="relative" role="search" aria-label="Búsqueda de productos">
                <div className="bg-white rounded-full overflow-hidden flex items-center shadow-md border border-gray-100">
                  <Search className="ml-4 sm:ml-6 h-5 w-5 text-[#D91E7A]" aria-hidden="true" />
                  <Input
                    type="search"
                    placeholder="¿Qué producto buscás?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-3 py-4"
                    aria-label="Buscar productos"
                    id="search-mobile"
                    name="search"
                  />
                  <Button
                    type="submit"
                    className="bg-[#D91E7A] hover:bg-[#6B4199] text-white rounded-full px-4 sm:px-6 py-4 m-2 font-bold text-sm transition-colors duration-300"
                    aria-label="Buscar"
                  >
                    Buscar
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Columna derecha — imagen */}
          <div className="relative flex items-center justify-center">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Productos Don Negro Comercial"
                width={600}
                height={500}
                className="object-contain drop-shadow-2xl"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center">
                <ShoppingCart className="w-32 h-32 text-gray-200" />
              </div>
            )}
          </div>
        </div>

        {/* Buscador desktop */}
        <div className="max-w-2xl mx-auto hidden lg:block">
          <form onSubmit={handleSearch} className="relative" role="search" aria-label="Búsqueda de productos">
            <div className="bg-white rounded-full overflow-hidden flex items-center shadow-md border border-gray-100">
              <Search className="ml-6 h-6 w-6 text-[#D91E7A]" aria-hidden="true" />
              <Input
                type="search"
                placeholder="¿Qué producto buscás?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg px-4 py-6"
                aria-label="Buscar productos"
                id="search-desktop"
                name="search"
              />
              <Button
                type="submit"
                className="bg-[#D91E7A] hover:bg-[#6B4199] text-white rounded-full px-8 py-6 m-2 font-bold shadow-lg transition-colors duration-300"
                aria-label="Buscar productos"
              >
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
