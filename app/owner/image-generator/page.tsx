"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Download, Search, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { toPng } from "html-to-image";

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
  stock: number;
}

interface StoreConfig {
  store_name: string;
  logo_url: string | null;
}

export default function ImageGeneratorPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [captureKey, setCaptureKey] = useState(0);
  const [urlTimestamp, setUrlTimestamp] = useState(Date.now());
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Reset image loaded status when selecting a product
  useEffect(() => {
    if (selectedProduct) {
      setImageLoaded(false);
      setCaptureKey(prev => prev + 1);
      setUrlTimestamp(Date.now());
    }
  }, [selectedProduct]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("estado", "Activo")
        .order("nombre");
      
      const { data: configData } = await supabase
        .from("store_configuration")
        .select("store_name, logo_url")
        .maybeSingle();

      if (productsData) {
        setProducts(productsData);
        setFilteredProducts(productsData);
      }
      if (configData) setStoreConfig(configData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = products.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const getProxiedUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("data:")) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}&t=${urlTimestamp}`;
  };

  const handleDownload = async () => {
    if (!frameRef.current || !selectedProduct || !imageLoaded) return;
    
    // Capturamos el producto actual para el nombre del archivo
    const productToDownload = { ...selectedProduct };
    setGenerating(true);
    
    try {
      // Un retraso un poco mayor para asegurar que el navegador haya terminado de pintar
      // y que html-to-image no use versiones intermedias
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Intentamos generar la imagen
      const dataUrl = await toPng(frameRef.current, {
        cacheBust: true,
        pixelRatio: 3, 
        backgroundColor: '#ffffff',
        skipFonts: true,
        // Forzamos a que no use caché interna si la tiene
        includeGraphics: true,
      });
      
      const link = document.createElement('a');
      link.download = `producto-${productToDownload.nombre.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Error al generar la imagen. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const prices = selectedProduct ? calculatePrices({
    costo: Number(selectedProduct.costo ?? 0),
    margen_porcentaje: Number(selectedProduct.margen_porcentaje ?? 18),
    interes_6_meses_porcentaje: Number(selectedProduct.interes_6_meses_porcentaje ?? 45),
    interes_12_meses_porcentaje: Number(selectedProduct.interes_12_meses_porcentaje ?? 65),
    interes_15_meses_porcentaje: Number(selectedProduct.interes_15_meses_porcentaje ?? 75),
    interes_18_meses_porcentaje: Number(selectedProduct.interes_18_meses_porcentaje ?? 85),
  }) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="generador" />
      
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Selector de Producto */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Seleccionar Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Buscar producto por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={generating}
                />
                
                <div className={`max-h-[600px] overflow-y-auto border rounded-lg divide-y ${generating ? 'opacity-50 pointer-events-none' : ''}`}>
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando productos...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No se encontraron productos</div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-4 ${
                          selectedProduct?.id === product.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                        }`}
                      >
                        <div className="w-12 h-12 relative rounded border overflow-hidden bg-white flex-shrink-0">
                          <img 
                            src={product.imagen_url} 
                            alt={product.nombre}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate uppercase">{product.nombre}</p>
                          <p className="text-xs text-gray-500">{product.categoria}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista Previa y Generador */}
          <div className="space-y-6 flex flex-col items-center">
            {selectedProduct ? (
              <>
                <div className="sticky top-6 space-y-4 w-full flex flex-col items-center">
                  <div className="flex items-center justify-between w-full max-w-[360px]">
                    <h3 className="font-bold text-lg">Vista Previa (9:16)</h3>
                    <Button 
                      onClick={handleDownload} 
                      disabled={generating || !imageLoaded}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : !imageLoaded ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {!imageLoaded ? "Cargando..." : "Descargar para WhatsApp"}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full max-w-[360px] border-[#6B4199] text-[#6B4199] hover:bg-purple-50 font-black uppercase tracking-tighter"
                    onClick={() => window.open(`/owner/image-generator/capture/${selectedProduct.id}`, '_blank')}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Abrir Página de Captura (Full Layout)
                  </Button>

                  {/* El Frame 9:16 */}
                  <div 
                    key={captureKey}
                    ref={frameRef}
                    className="w-[360px] h-[640px] bg-white shadow-2xl overflow-hidden relative flex flex-col"
                  >
                    {/* 50% Imagen del Producto */}
                    <div className="h-[320px] relative bg-white overflow-hidden flex items-center justify-center p-4">
                      <img 
                        src={getProxiedUrl(selectedProduct.imagen_url)} 
                        alt={selectedProduct.nombre}
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)} // Enable even on error to allow "empty" capture
                      />
                      
                      {/* Logo Superpuesto */}
                      <div className="absolute top-6 left-6 drop-shadow-xl">
                        {storeConfig?.logo_url ? (
                          <img 
                            src={getProxiedUrl(storeConfig.logo_url)} 
                            alt="Logo" 
                            className="h-7 object-contain" 
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <h2 className="text-sm font-black uppercase tracking-tighter text-[#2E3A52] bg-white/90 px-2 py-1 rounded-lg shadow-sm">
                            {storeConfig?.store_name || "Don Negro"}
                          </h2>
                        )}
                      </div>
                    </div>

                    {/* 10% Texto de Disponibilidad */}
                    <div className="h-[64px] flex flex-col items-center justify-center bg-slate-50 border-y border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D91E7A]">disponible en www.donegro.com</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">envios a todo el pais</p>
                    </div>

                    {/* 40% Area de Precios y Financiación */}
                    <div className="h-[256px] p-3 flex flex-col justify-center space-y-2 bg-white relative z-10">
                      <div className="text-center space-y-0.5">
                        <h2 className="text-base font-black text-[#2E3A52] leading-tight uppercase tracking-tighter line-clamp-1 px-2">
                          {selectedProduct.nombre}
                        </h2>
                        <div className="inline-block bg-slate-100 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest text-slate-500">
                          {selectedProduct.categoria}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {/* Precio Contado */}
                        <div className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] py-1.5 px-4 rounded-xl text-white text-center shadow-md">
                          <p className="text-[7px] font-black uppercase tracking-widest opacity-90 mb-0.5">Precio Contado</p>
                          <p className="text-2xl font-black tracking-tighter">
                            {prices ? formatCurrency(prices.precioContado) : "---"}
                          </p>
                        </div>

                        {/* Financiación */}
                        {prices && (prices.disponible6Meses || prices.disponible12Meses || prices.disponible15Meses || prices.disponible18Meses) && (
                          <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
                            <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1 text-center">Opciones de Financiación</p>
                            <div className="grid grid-cols-2 gap-1">
                              {prices.disponible6Meses && (
                                <div className="bg-white p-1 rounded-lg border border-slate-100 flex flex-col items-center">
                                  <span className="text-[6px] font-bold text-slate-400 uppercase">6 Cuotas</span>
                                  <p className="text-sm font-black text-[#6B4199] tracking-tighter">
                                    {formatCurrency(prices.cuota6Meses)}
                                  </p>
                                </div>
                              )}
                              {prices.disponible12Meses && (
                                <div className="bg-white p-1 rounded-lg border border-slate-100 flex flex-col items-center">
                                  <span className="text-[6px] font-bold text-slate-400 uppercase">12 Cuotas</span>
                                  <p className="text-sm font-black text-[#6B4199] tracking-tighter">
                                    {formatCurrency(prices.cuota12Meses)}
                                  </p>
                                </div>
                              )}
                              {prices.disponible15Meses && (
                                <div className="bg-white p-1 rounded-lg border border-slate-100 flex flex-col items-center">
                                  <span className="text-[6px] font-bold text-slate-400 uppercase">15 Cuotas</span>
                                  <p className="text-sm font-black text-[#6B4199] tracking-tighter">
                                    {formatCurrency(prices.cuota15Meses)}
                                  </p>
                                </div>
                              )}
                              {prices.disponible18Meses && (
                                <div className="bg-white p-1 rounded-lg border border-slate-100 flex flex-col items-center">
                                  <span className="text-[6px] font-bold text-slate-400 uppercase">18 Cuotas</span>
                                  <p className="text-sm font-black text-[#6B4199] tracking-tighter">
                                    {formatCurrency(prices.cuota18Meses)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Decoración */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D91E7A] via-[#6B4199] to-[#D91E7A]"></div>
                  </div>
                  
                  <p className="text-xs text-gray-400 text-center max-w-[300px]">
                    La imagen se descargará en alta resolución (1080x1920) lista para subir a tus estados.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[640px] w-[360px] border-2 border-dashed border-gray-200 rounded-3xl bg-white text-gray-400 p-8 text-center space-y-4">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p className="font-medium">Selecciona un producto de la lista para generar la tarjeta</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
