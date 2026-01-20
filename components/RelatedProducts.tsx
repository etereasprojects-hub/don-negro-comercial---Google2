'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calculatePrices, formatCurrency } from '@/lib/pricing';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

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
  categoria: string;
  url_slug: string;
}

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedProducts();
  }, [currentProductId, category]);

  const loadRelatedProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('estado', 'Activo')
        .neq('id', currentProductId)
        .eq('categoria', category)
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#2E3A52] mb-8 text-center">Productos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-xl mb-3"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-6 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#2E3A52] mb-8 text-center">Productos Relacionados</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const prices = calculatePrices({
              costo: Number(product.costo ?? 0),
              margen_porcentaje: Number(product.margen_porcentaje ?? 18),
              interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
              interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
              interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
              interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
            });

            return (
              <Link key={product.id} href={`/${product.url_slug}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                      {product.imagen_url ? (
                        <Image
                          src={product.imagen_url}
                          alt={product.nombre}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
                      {product.nombre}
                    </h3>

                    <div className="space-y-1">
                      <p className="text-lg font-bold text-[#D91E7A]">
                        {formatCurrency(prices.precioContado)}
                      </p>
                      {prices.disponible6Meses ? (
                        <p className="text-xs text-gray-600">
                          o {formatCurrency(prices.cuota6Meses)}/mes
                        </p>
                      ) : prices.disponible12Meses ? (
                        <p className="text-xs text-gray-600">
                          o {formatCurrency(prices.cuota12Meses)}/mes
                        </p>
                      ) : prices.disponible15Meses ? (
                        <p className="text-xs text-gray-600">
                          o {formatCurrency(prices.cuota15Meses)}/mes
                        </p>
                      ) : prices.disponible18Meses ? (
                        <p className="text-xs text-gray-600">
                          o {formatCurrency(prices.cuota18Meses)}/mes
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600">
                          Solo contado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
