"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Database, 
  Zap, 
  Search, 
  RefreshCw, 
  Loader2, 
  Package, 
  Grid, 
  Terminal,
  Activity,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import FastraxLiveImage from "@/components/fastrax/FastraxLiveImage";
import FastraxLiveDetail from "@/components/fastrax/FastraxLiveDetail";

export default function FastraxSandbox() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Detail State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("fastrax_products")
      .select("*")
      .order("stock", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const runLiteSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(5);

    try {
      // 1. Obtener SKUs (Op 1)
      const res1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const data1 = await res1.json();
      const skus = Array.isArray(data1) ? data1.slice(1) : [];

      if (skus.length === 0) throw new Error("No se obtuvieron productos.");

      // 2. Procesar en lotes de 30 para metadatos
      const batchSize = 30;
      for (let i = 0; i < skus.length; i += batchSize) {
        const batch = skus.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / skus.length) * 100);
        setSyncProgress(progress);

        // Obtenemos los nombres y precios (Op 2) para este lote
        const res2 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 2, sku: batch.map((b:any) => b.sku).join(",") })
        });
        const d2 = await res2.json();
        const detailsList = Array.isArray(d2) ? d2.slice(1) : [];

        // Guardar solo texto en la DB Lite
        const toInsert = detailsList.map((det: any) => {
          const base = batch.find((b:any) => b.sku === det.sku);
          const nombre = decodeURIComponent((det.nom || "Sin Nombre").replace(/\+/g, ' '));
          return {
            sku: det.sku,
            nombre: nombre,
            costo: Number(det.pre || 0),
            stock: Number(base?.sal || 0),
            categoria: "Fastrax Live",
            url_slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_') + "_" + det.sku
          };
        });

        // Upsert masivo a fastrax_products
        await supabase.from("fastrax_products").upsert(toInsert, { onConflict: 'sku' });
      }

      alert("Sincronización Lite Exitosa. Se guardaron metadatos sin imágenes.");
      loadProducts();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Terminal Style */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-500 font-mono text-xs uppercase tracking-tighter">
                <Terminal size={14} />
                <span>donegro@fastrax:~/sandbox/inventory$</span>
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Laboratorio Fastrax</h1>
              <p className="text-slate-500 font-medium">Almacenamiento Lite: <span className="text-emerald-500">Optimizado para 10,000+ ítems</span></p>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
              <Button 
                onClick={runLiteSync} 
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic tracking-widest gap-2 h-12 px-6 shadow-lg shadow-blue-900/20"
              >
                {isSyncing ? <Loader2 className="animate-spin" /> : <Zap className="fill-white" />}
                Sincronización Lite
              </Button>
           </div>
        </div>

        {isSyncing && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
             <div className="flex justify-between text-[10px] font-black uppercase text-blue-400">
                <span>Inyectando metadatos al motor Lite...</span>
                <span>{syncProgress}%</span>
             </div>
             <Progress value={syncProgress} className="h-1 bg-slate-900" />
          </div>
        )}

        {/* Buscador */}
        <div className="relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
           <Input 
             placeholder="BUSCAR EN EL CATÁLOGO LITE POR SKU O NOMBRE..." 
             className="bg-slate-900 border-slate-800 h-16 pl-14 text-lg font-bold placeholder:text-slate-700 focus:border-blue-500 transition-all rounded-2xl"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        {/* Grid Minimalista */}
        {loading ? (
          <div className="py-40 flex flex-col items-center gap-4">
             <Activity className="w-12 h-12 text-slate-800 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Consultando Supabase...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
             {filteredProducts.map((product) => (
               <Card 
                 key={product.id} 
                 className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer overflow-hidden rounded-2xl shadow-xl flex flex-col"
                 onClick={() => { setSelectedProduct(product); setDetailOpen(true); }}
               >
                  <div className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
                     <FastraxLiveImage sku={product.sku} className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                     <div className="absolute top-2 left-2">
                        <Badge className="bg-slate-950/80 backdrop-blur-md text-[8px] font-mono border-slate-700">#{product.sku}</Badge>
                     </div>
                  </div>
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                     <div>
                        <h3 className="text-[11px] font-black text-white uppercase line-clamp-2 leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                          {product.nombre}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Fastrax Warehouse</p>
                     </div>
                     <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-emerald-400">₲ {product.costo.toLocaleString()}</span>
                           <span className="text-[8px] text-slate-600 font-bold uppercase">Costo Base</span>
                        </div>
                        <Badge className={`text-[9px] font-black ${product.stock > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                           {product.stock} UNI
                        </Badge>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="py-32 text-center bg-slate-900/20 rounded-[40px] border-2 border-dashed border-slate-800">
             <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
             <h3 className="text-slate-500 font-black uppercase italic">No hay datos en el Sandbox</h3>
             <p className="text-slate-600 text-sm mt-1">Haga una sincronización Lite para cargar productos sin imágenes.</p>
          </div>
        )}
      </div>

      <FastraxLiveDetail 
        product={selectedProduct} 
        isOpen={detailOpen} 
        onClose={() => setDetailOpen(false)} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      ` }} />
    </div>
  );
}