"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FloatingButtons from "@/components/FloatingButtons";
import BannerSlider from "@/components/BannerSlider";
import ProductGallery from "@/components/ProductGallery";
import RelatedProducts from "@/components/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Comment: Added Loader2 to imports to fix "Cannot find name 'Loader2'" error on line 106
import { ShoppingCart, Package, Star, ArrowLeft, Check, ListChecks, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

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
  imagenes_extra: string[];
  video_url: string;
  categoria: string;
  stock: number;
  codigo_ext: string;
  codigo_wos: string;
  codigo_pro: string;
  destacado: boolean;
  source: string;
  ubicacion: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("url_slug", slug)
        .eq("estado", "Activo")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push("/productos");
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
      router.push("/productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Loader2 className="w-16 h-16 text-[#D91E7A] animate-spin" />
            <Package className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const prices = calculatePrices({
    costo: Number(product.costo ?? 0),
    margen_porcentaje: Number(product.margen_porcentaje ?? 18),
    interes_6_meses_porcentaje: Number(product.interes_6_meses_porcentaje ?? 45),
    interes_12_meses_porcentaje: Number(product.interes_12_meses_porcentaje ?? 65),
    interes_15_meses_porcentaje: Number(product.interes_15_meses_porcentaje ?? 75),
    interes_18_meses_porcentaje: Number(product.interes_18_meses_porcentaje ?? 85),
  });

  const isHtmlDescription = product.descripcion?.includes('<table') || product.descripcion?.includes('<div');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 mt-24">
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#D91E7A] mb-6 transition-colors font-bold uppercase text-xs tracking-tighter"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Productos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Galería de Imágenes del Producto */}
          <div className="relative">
            {product.destacado && (
              <Badge className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 text-sm font-semibold shadow-lg z-10 flex items-center gap-1">
                <Star className="w-4 h-4 fill-white" />
                Destacado
              </Badge>
            )}
            <ProductGallery
              mainImage={product.imagen_url}
              productName={product.nombre}
              extraImages={product.imagenes_extra || []}
              videoUrl={product.video_url}
            />
          </div>

          {/* Información del Producto */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-[#2E3A52] tracking-tighter uppercase leading-none">{product.nombre}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {product.categoria && (
                  <Badge variant="secondary" className="text-xs font-bold bg-slate-100 text-slate-600 border-none px-3 py-1">
                    {product.categoria}
                  </Badge>
                )}
                {product.source === 'Fastrax' && (
                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 bg-blue-50 font-black uppercase tracking-widest px-3 py-1">
                    <Check className="w-3 h-3 mr-1" /> Stock en Almacén
                  </Badge>
                )}
                {product.ubicacion && (
                   <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 bg-slate-50 font-black uppercase tracking-widest px-3 py-1">
                    <MapPin className="w-3 h-3 mr-1" /> {product.ubicacion.includes('Asunción') ? 'Asunción' : 'Ciudad del Este'}
                   </Badge>
                )}
              </div>
            </div>

            {product.descripcion && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                   <ListChecks className="w-4 h-4" /> Especificaciones técnicas
                </div>
                {isHtmlDescription ? (
                  <div 
                    className="product-description-html"
                    dangerouslySetInnerHTML={{ __html: product.descripcion }}
                  />
                ) : (
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{product.descripcion}</p>
                )}
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span className="font-black uppercase text-xs tracking-tighter">
                    Producto Disponible ({product.stock} UNI)
                  </span>
                </div>
              ) : (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-2">
                   <span className="font-black uppercase text-xs tracking-tighter">Temporalmente sin Stock</span>
                </div>
              )}
            </div>

            {/* Precios */}
            <Card className="border-2 border-[#D91E7A] shadow-lg overflow-hidden rounded-[2rem]">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white p-6 text-center">
                  <p className="text-xs font-black mb-1 uppercase tracking-widest opacity-80">Precio Especial Contado</p>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
                    {formatCurrency(prices.precioContado)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Opciones a Crédito</h3>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-[#D91E7A] to-transparent ml-4 rounded-full opacity-20"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prices.disponible6Meses && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#D91E7A] transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400">En 6 meses</span>
                          <Badge className="bg-[#D91E7A] text-[9px] font-black uppercase h-5">Plan A</Badge>
                        </div>
                        <p className="text-2xl font-black text-[#D91E7A] tracking-tighter">
                          {formatCurrency(prices.cuota6Meses)}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">Cuota Mensual</p>
                      </div>
                    )}

                    {prices.disponible12Meses && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#6B4199] transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400">En 12 meses</span>
                          <Badge className="bg-[#6B4199] text-[9px] font-black uppercase h-5">Plan B</Badge>
                        </div>
                        <p className="text-2xl font-black text-[#6B4199] tracking-tighter">
                          {formatCurrency(prices.cuota12Meses)}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">Cuota Mensual</p>
                      </div>
                    )}

                    {prices.disponible15Meses && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#D91E7A] transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400">En 15 meses</span>
                          <Badge className="bg-[#D91E7A] text-[9px] font-black uppercase h-5">Plan C</Badge>
                        </div>
                        <p className="text-2xl font-black text-[#D91E7A] tracking-tighter">
                          {formatCurrency(prices.cuota15Meses)}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">Cuota Mensual</p>
                      </div>
                    )}

                    {prices.disponible18Meses && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#6B4199] transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400">En 18 meses</span>
                          <Badge className="bg-[#6B4199] text-[9px] font-black uppercase h-5">Plan D</Badge>
                        </div>
                        <p className="text-2xl font-black text-[#6B4199] tracking-tighter">
                          {formatCurrency(prices.cuota18Meses)}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">Cuota Mensual</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botón Agregar al Carrito */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-[#D91E7A] hover:bg-[#6B4199] text-white py-8 rounded-[1.5rem] text-xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
              size="lg"
            >
              <ShoppingCart className="w-6 h-6 mr-3" />
              {product.stock > 0 ? "¡Lo quiero comprar!" : "Temporalmente sin stock"}
            </Button>
            
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               Seguridad 100% Garantizada • Envíos a todo el país
            </p>
          </div>
        </div>
      </main>

      <BannerSlider section="product_bottom" />
      <RelatedProducts currentProductId={product.id} category={product.categoria} />
      <Footer />
      <WhatsAppButton />
      <FloatingButtons />
    </div>
  );
}
