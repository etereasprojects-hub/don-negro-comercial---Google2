"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Database, Zap, Search, RefreshCw, Loader2, Package, Grid, Terminal,
  Activity, AlertCircle, ShoppingCart, Send, FileSearch, Receipt, Trash2, Code, Server
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Added missing Label import to fix line 191, 196, and 200 errors
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FastraxLiveImage from "@/components/fastrax/FastraxLiveImage";
import FastraxLiveDetail from "@/components/fastrax/FastraxLiveDetail";

export default function FastraxSandbox() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // States para Pedidos
  const [orderSku, setOrderSku] = useState("");
  const [orderQty, setOrderQty] = useState("1");
  const [orderId, setOrderId] = useState(""); // ID que devuelve Fastrax
  const [customPed, setCustomPed] = useState("WEB-" + Math.floor(Math.random() * 1000));
  
  // Consolas de Debug
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [opLoading, setOpLoading] = useState(false);

  // Detail State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("fastrax_products").select("*").order("stock", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const runLiteSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(5);
    try {
      const res1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const data1 = await res1.json();
      const skus = Array.isArray(data1) ? data1.slice(1) : [];
      if (skus.length === 0) throw new Error("No se obtuvieron productos.");
      const batchSize = 30;
      for (let i = 0; i < skus.length; i += batchSize) {
        const batch = skus.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / skus.length) * 100);
        setSyncProgress(progress);
        const res2 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 2, sku: batch.map((b:any) => b.sku).join(",") })
        });
        const d2 = await res2.json();
        const detailsList = Array.isArray(d2) ? d2.slice(1) : [];
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
        await supabase.from("fastrax_products").upsert(toInsert, { onConflict: 'sku' });
      }
      loadProducts();
    } catch (e: any) { alert("Error: " + e.message); } finally { setIsSyncing(false); setSyncProgress(0); }
  };

  const callApi = async (ope: number, params: any) => {
    setOpLoading(true);
    setLastPayload({ cod: "42352", pas: "****", ope, ...params });
    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope, ...params })
      });
      const data = await res.json();
      setLastResponse(data);
      return data;
    } catch (e: any) {
      setLastResponse({ error: e.message });
    } finally {
      setOpLoading(false);
    }
  };

  const handleSendOrder = async () => {
    const data = await callApi(12, { sku: orderSku, qtd: orderQty, ped: customPed, cli: "42352" });
    if (Array.isArray(data) && data[1]?.pdc) {
      setOrderId(data[1].pdc);
    }
  };

  const handleQueryOrder = () => callApi(13, { pdc: orderId, ped: customPed });
  const handleFactureOrder = () => callApi(15, { pdc: orderId, ped: customPed });
  const handleDeleteOrder = () => callApi(16, { pdc: orderId, ped: customPed });

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sandbox Profesional</h1>
              <p className="text-slate-500 font-medium italic">Laboratorio de Ciclo de Vida del Pedido</p>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
              <Button onClick={runLiteSync} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic gap-2 h-12 px-6">
                {isSyncing ? <Loader2 className="animate-spin" /> : <Zap className="fill-white" />}
                Sync Catálogo
              </Button>
           </div>
        </div>

        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="bg-slate-900 p-1 border border-slate-800 rounded-xl">
             <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-600 font-black uppercase text-[10px] tracking-widest px-8 py-3">Catálogo Lite</TabsTrigger>
             <TabsTrigger value="lifecycle" className="data-[state=active]:bg-pink-600 font-black uppercase text-[10px] tracking-widest px-8 py-3">Ciclo de Vida del Pedido</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                <Input placeholder="BUSCAR SKU..." className="bg-slate-900 border-slate-800 h-16 pl-14 text-lg font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer overflow-hidden rounded-2xl flex flex-col">
                    <div className="aspect-square bg-slate-950 relative flex items-center justify-center p-4">
                      <FastraxLiveImage sku={product.sku} className="w-full h-full" />
                    </div>
                    <CardContent className="p-4 space-y-3 flex-1">
                      <h3 className="text-[11px] font-black text-white uppercase line-clamp-2 leading-tight">{product.nombre}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400">₲ {product.costo.toLocaleString()}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => { setOrderSku(product.sku); alert("SKU copiado al flujo de pedido"); }}>
                          <ShoppingCart size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Paso 1: Formulario */}
                <div className="space-y-6">
                   <Card className="bg-slate-900 border-slate-800 border-2 border-dashed">
                      <CardHeader><CardTitle className="text-sm font-black uppercase text-blue-400">1. Preparar Orden</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase">SKU del Producto</Label>
                            <Input placeholder="Ej: 112233" className="bg-slate-950 border-slate-800 text-white font-mono" value={orderSku} onChange={(e) => setOrderSku(e.target.value)} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase">Cantidad</Label>
                               <Input type="number" className="bg-slate-950 border-slate-800 text-white" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase">Ref WEB (PED)</Label>
                               <Input className="bg-slate-950 border-slate-800 text-white font-mono" value={customPed} onChange={(e) => setCustomPed(e.target.value)} />
                            </div>
                         </div>
                         <Button onClick={handleSendOrder} disabled={opLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic py-6">
                           <Send className="mr-2 w-4 h-4" /> Enviar Pedido (Op 12)
                         </Button>
                      </CardContent>
                   </Card>

                   <div className="grid grid-cols-1 gap-4">
                      <Button onClick={handleQueryOrder} disabled={!orderId || opLoading} className="bg-slate-800 hover:bg-slate-700 text-white font-black uppercase italic py-8">
                        <FileSearch className="mr-2 w-4 h-4" /> Consultar Estado (Op 13)
                      </Button>
                      <Button onClick={handleFactureOrder} disabled={!orderId || opLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic py-8">
                        <Receipt className="mr-2 w-4 h-4" /> Confirmar / Facturar (Op 15)
                      </Button>
                      <Button onClick={handleDeleteOrder} disabled={!orderId || opLoading} className="bg-red-900 hover:bg-red-800 text-white font-black uppercase italic py-8">
                        <Trash2 className="mr-2 w-4 h-4" /> Borrar / Cancelar (Op 16)
                      </Button>
                   </div>
                </div>

                {/* Paso 2: Payloads */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-slate-900 border-slate-800">
                         <CardHeader className="bg-slate-950 p-3 border-b border-slate-800 flex flex-row items-center justify-between">
                            <CardTitle className="text-[9px] font-black uppercase text-blue-400 flex items-center gap-2"><Code size={12} /> JSON Saliente</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0 h-40 overflow-auto custom-scrollbar">
                            <pre className="p-4 text-[10px] font-mono text-blue-300 leading-tight">
                               {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                            </pre>
                         </CardContent>
                      </Card>
                      <Card className="bg-slate-900 border-slate-800">
                         <CardHeader className="bg-slate-950 p-3 border-b border-slate-800 flex flex-row items-center justify-between">
                            <CardTitle className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-2"><Server size={12} /> JSON Respuesta</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0 h-40 overflow-auto custom-scrollbar">
                            <pre className="p-4 text-[10px] font-mono text-emerald-300 leading-tight">
                               {lastResponse ? JSON.stringify(lastResponse, null, 2) : "// No hay datos..."}
                            </pre>
                         </CardContent>
                      </Card>
                   </div>

                   {/* Resumen Visual del Pedido */}
                   {orderId && (
                     <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-pink-600 animate-in zoom-in-95">
                        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div className="space-y-1">
                              <Badge className="bg-pink-600 text-white mb-2">ORDEN ACTIVA EN MEMORIA</Badge>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID ERP Fastrax</p>
                              <h4 className="text-3xl font-black text-white font-mono">#{orderId}</h4>
                           </div>
                           <div className="flex gap-4">
                              <div className="text-center bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800">
                                 <p className="text-[8px] font-black text-slate-500 uppercase">Referencia Web</p>
                                 <p className="text-sm font-bold text-blue-400">{customPed}</p>
                              </div>
                              <div className="text-center bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800">
                                 <p className="text-[8px] font-black text-slate-500 uppercase">Status sandbox</p>
                                 <p className="text-sm font-bold text-amber-500 uppercase tracking-tighter">Verificado</p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                   )}
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <FastraxLiveDetail product={selectedProduct} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      ` }} />
    </div>
  );
}
