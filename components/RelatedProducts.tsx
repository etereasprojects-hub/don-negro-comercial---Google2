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
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 border-t border-slate-100 pt-16 mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#2E3A52]">
          Productos Relacionados
        </h2>
      </div>

      <div className="relative">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 hide-scrollbar">
          {products.map((product) => {
            const prices = calculatePrices({
              costo: Number(product.costo),
              margen_porcentaje: Number(product.margen_porcentaje),
              interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje),
              interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje),
              interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje),
              interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje),
            });

            return (
              <Link 
                key={product.id} 
                href={`/${product.url_slug.replace(/_/g, '-')}`}
                className="snap-start shrink-0 w-[280px]"
              >
                <Card className="h-full border-2 border-transparent hover:border-[#D91E7A] transition-all duration-300 hover:shadow-xl rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-4 flex flex-col h-full relative">
                    <div className="relative aspect-square mb-4 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
                      {product.imagen_url ? (
                        <Image
                          src={product.imagen_url}
                          alt={product.nombre}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                        {product.categoria}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#2E3A52] line-clamp-2 mb-4 group-hover:text-[#D91E7A] transition-colors uppercase">
                      {product.nombre}
                    </h3>

                    <div className="space-y-1 mt-auto">
                      <p className="text-lg font-black tracking-tighter text-[#D91E7A]">
                        {formatCurrency(prices.precioContado)}
                      </p>
                      {prices.disponible6Meses ? (
                        <p className="text-[10px] font-bold uppercase text-gray-500">
                          o {formatCurrency(prices.cuota6Meses)}/mes
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold uppercase text-gray-500">
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
