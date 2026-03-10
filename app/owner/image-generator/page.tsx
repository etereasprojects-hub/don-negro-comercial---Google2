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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadData();
    }
  }, [router]);

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
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  const handleDownload = async () => {
    if (!frameRef.current) return;
    setGenerating(true);
    try {
      // Esperamos un poco para asegurar que las imágenes estén cargadas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dataUrl = await toPng(frameRef.current, {
        cacheBust: true,
        pixelRatio: 3, // 360 * 3 = 1080, 640 * 3 = 1920
        backgroundColor: '#ffffff',
        skipFonts: true, // A veces las fuentes externas causan problemas
      });
      
      const link = document.createElement('a');
      link.download = `producto-${selectedProduct?.nombre.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Error al generar la imagen. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isAuthenticated) return null;

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
                />
                
                <div className="max-h-[600px] overflow-y-auto border rounded-lg divide-y">
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
                      disabled={generating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Descargar para WhatsApp
                    </Button>
                  </div>

                  {/* El Frame 9:16 */}
                  <div 
                    ref={frameRef}
                    className="w-[360px] h-[640px] bg-white shadow-2xl overflow-hidden relative flex flex-col"
                    style={{ 
                      backgroundImage: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
                    }}
                  >
                    {/* Header con Logo */}
                    <div className="p-4 flex justify-end items-center h-20">
                      {storeConfig?.logo_url ? (
                        <img 
                          src={getProxiedUrl(storeConfig.logo_url)} 
                          alt="Logo" 
                          className="h-10 object-contain" 
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <h2 className="text-xl font-black uppercase tracking-tighter text-[#2E3A52]">
                          {storeConfig?.store_name || "Don Negro"}
                        </h2>
                      )}
                    </div>

                    {/* Imagen del Producto */}
                    <div className="flex-1 flex items-center justify-center p-4">
                      <div className="w-full h-full relative flex items-center justify-center">
                        <img 
                          src={getProxiedUrl(selectedProduct.imagen_url)} 
                          alt={selectedProduct.nombre}
                          className="max-w-[90%] max-h-[90%] object-contain drop-shadow-2xl"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>

                    {/* Info del Producto */}
                    <div className="p-6 space-y-4 bg-white rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                      <div className="text-center space-y-1">
                        <h2 className="text-lg font-black text-[#2E3A52] leading-tight uppercase tracking-tighter line-clamp-2">
                          {selectedProduct.nombre}
                        </h2>
                        <div className="inline-block bg-slate-100 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500">
                          {selectedProduct.categoria}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Precio Contado */}
                        <div className="bg-gradient-to-r from-[#D91E7A] to-[#6B4199] p-3 rounded-2xl text-white text-center shadow-lg">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">Precio Contado</p>
                          <p className="text-3xl font-black tracking-tighter">
                            {prices ? formatCurrency(prices.precioContado) : "---"}
                          </p>
                        </div>

                        {/* Financiación */}
                        {prices && (prices.disponible12Meses || prices.disponible6Meses) && (
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">¡Llevalo en cuotas!</p>
                            <div className="flex justify-center items-baseline gap-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Desde</span>
                              <p className="text-2xl font-black text-[#6B4199] tracking-tighter">
                                {formatCurrency(prices.cuota12Meses || prices.cuota6Meses)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-[9px] font-black text-[#6B4199] uppercase tracking-wider">
                          disponible en www.donegro.com
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          Envíos a todo el país
                        </p>
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
