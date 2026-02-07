"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Globe, Tag, Info } from "lucide-react";

interface FastraxLiveDetailProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FastraxLiveDetail({ product, isOpen, onClose }: FastraxLiveDetailProps) {
  const [details, setDetails] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product?.sku) {
      loadLiveInfo();
    } else {
      setDetails(null);
      setImages([]);
    }
  }, [isOpen, product]);

  const loadLiveInfo = async () => {
    setLoading(true);
    try {
      // 1. Cargar Ficha Técnica (Op 2)
      const res2 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 2, sku: product.sku })
      });
      const d2 = await res2.json();
      if (Array.isArray(d2)) setDetails(d2[1]);

      // 2. Cargar Galería (Op 94)
      const res3 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 94, sku: product.sku, dat: "2018-01-01 00:00:00" })
      });
      const d3 = await res3.json();
      if (Array.isArray(d3) && d3[1]) setImages(d3[1].base64 || []);

    } catch (e) {
      console.error("Error loading live details", e);
    } finally {
      setLoading(false);
    }
  };

  const decodeText = (t: string) => {
    if (!t) return "";
    try { return decodeURIComponent(t.replace(/\+/g, ' ')); } catch (e) { return t.replace(/\+/g, ' '); }
  };

  // Función para parsear precio de la API
  const parseLivePrice = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    // Limpia puntos y comas si vienen en formato PYG string
    const clean = val.toString().replace(/\./g, '').replace(/,/g, '');
    return Number(clean) || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white uppercase italic font-black">
            <Package className="text-blue-500" />
            Detalle en Tiempo Real
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extrayendo datos de Fastrax...</p>
          </div>
        ) : (
          <div className="space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Galería */}
              <div className="space-y-4">
                <div className="aspect-square bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  {images[0] ? (
                    <img src={images[0]} className="w-full h-full object-contain p-4" alt="Main" />
                  ) : (
                    <div className="text-slate-700 flex flex-col items-center gap-2">
                       <Package size={48} />
                       <span className="text-[10px] font-bold">SIN IMAGEN</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                   {images.slice(1).map((img, i) => (
                     <div key={i} className="w-16 h-16 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
                        <img src={img} className="w-full h-full object-contain p-1" alt="thumb" />
                     </div>
                   ))}
                </div>
              </div>

              {/* Info básica */}
              <div className="space-y-6">
                 <div>
                    <Badge className="bg-blue-600 text-white font-mono mb-2">{product?.sku}</Badge>
                    <h2 className="text-2xl font-black text-white leading-tight uppercase italic">{product?.nombre}</h2>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                       <p className="text-[10px] text-slate-500 font-black uppercase">Costo Proveedor</p>
                       <p className="text-xl font-black text-emerald-400">
                         ₲ {parseLivePrice(details?.pre || product?.costo).toLocaleString()}
                       </p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                       <p className="text-[10px] text-slate-500 font-black uppercase">Stock Almacén</p>
                       <p className="text-xl font-black text-blue-400">{product?.stock} <span className="text-xs font-normal opacity-50">UNI</span></p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <Tag className="w-3 h-3" /> Categoría
                    </div>
                    <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 font-bold">
                       {product?.categoria || "General"}
                    </Badge>
                 </div>
              </div>
            </div>

            {/* Ficha Técnica Dinámica */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <Info className="w-3 h-3" /> Ficha Técnica Directa
               </div>
               <div className="bg-slate-900/30 p-6 rounded-3xl border border-slate-800/50 text-slate-300 text-sm leading-relaxed">
                  {details?.des || details?.bre ? (
                    <div className="product-description-html" dangerouslySetInnerHTML={{ __html: decodeText(details.des || details.bre) }} />
                  ) : (
                    <p className="italic text-slate-600">No hay descripción detallada disponible en el servidor en este momento.</p>
                  )}
               </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
