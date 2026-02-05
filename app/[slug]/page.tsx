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
import { ShoppingCart, Package, Star, ArrowLeft, Check, ListChecks } from "lucide-react";
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
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando producto...</p>
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

  // Comprobar si la descripción es HTML (común en productos Fastrax)
  const isHtmlDescription = product.descripcion?.includes('<table') || product.descripcion?.includes('<div');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 mt-24">
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#D91E7A] mb-6 transition-colors"
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
            <div>
              <h1 className="text-4xl font-bold text-[#2E3A52] mb-2">{product.nombre}</h1>
              <div className="flex gap-2 items-center">
                {product.categoria && (
                  <Badge variant="secondary" className="text-sm">
                    {product.categoria}
                  </Badge>
                )}
                {product.source === 'Fastrax' && (
                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 bg-blue-50 font-bold uppercase">
                    Importado Fastrax
                  </Badge>
                )}
              </div>
            </div>

            {product.descripcion && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                   <ListChecks className="w-4 h-4" /> Especificaciones del producto
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
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    En stock ({product.stock} disponibles)
                  </span>
                </>
              ) : (
                <span className="text-red-600 font-medium">Sin stock</span>
              )}
            </div>

            {/* Precios */}
            <Card className="border-2 border-[#D91E7A] shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-[#D91E7A] to-[#6B4199] text-white p-6 text-center">
                  <p className="text-sm sm:text-base font-medium mb-2 opacity-90">Precio de Contado</p>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                    {formatCurrency(prices.precioContado)}
                  </p>
                  <p className="text-xs sm:text-sm mt-2 opacity-75">Total: {formatCurrency(prices.precioContado)}</p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Opciones de Financiación</h3>
                    <div className="h-1 flex-1 bg-gradient-to-r from-[#D91E7A] to-[#6B4199] mx-4 rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prices.disponible6Meses && (
                      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:border-[#D91E7A] transition-all hover:shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">6 cuotas de</span>
                          <Badge className="bg-[#D91E7A]">6 meses</Badge>
                        </div>
                        <p className="text-3xl font-bold text-[#D91E7A]">
                          {formatCurrency(prices.cuota6Meses)}
                        </p>
                      </div>
                    )}

                    {prices.disponible12Meses && (
                      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:border-[#6B4199] transition-all hover:shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">12 cuotas de</span>
                          <Badge className="bg-[#6B4199]">12 meses</Badge>
                        </div>
                        <p className="text-3xl font-bold text-[#6B4199]">
                          {formatCurrency(prices.cuota12Meses)}
                        </p>
                      </div>
                    )}

                    {prices.disponible15Meses && (
                      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:border-[#D91E7A] transition-all hover:shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">15 cuotas de</span>
                          <Badge className="bg-[#D91E7A]">15 meses</Badge>
                        </div>
                        <p className="text-3xl font-bold text-[#D91E7A]">
                          {formatCurrency(prices.cuota15Meses)}
                        </p>
                      </div>
                    )}

                    {prices.disponible18Meses && (
                      <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:border-[#6B4199] transition-all hover:shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">18 cuotas de</span>
                          <Badge className="bg-[#6B4199]">18 meses</Badge>
                        </div>
                        <p className="text-3xl font-bold text-[#6B4199]">
                          {formatCurrency(prices.cuota18Meses)}
                        </p>
                      </div>
                    )}
                  </div>

                  {(prices.disponible6Meses || prices.disponible12Meses || prices.disponible15Meses || prices.disponible18Meses) && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800 text-center">
                        <strong>Nota:</strong> Los precios financiados están sujetos a intereses. Consulta con nuestro equipo para más detalles.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botón Agregar al Carrito */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-[#D91E7A] hover:bg-[#6B4199] text-white py-6 text-lg font-semibold transition-colors"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock > 0 ? "Agregar al Carrito" : "Producto sin stock"}
            </Button>
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