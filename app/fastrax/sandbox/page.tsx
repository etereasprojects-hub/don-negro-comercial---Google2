"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Database, Zap, Search, RefreshCw, Loader2, Package, Grid, Terminal,
  Activity, AlertCircle, ShoppingCart, Send, FileSearch, Receipt, Trash2, Code, Server, MapPin, Tag, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FastraxLiveImage from "@/components/fastrax/FastraxLiveImage";
import FastraxLiveDetail from "@/components/fastrax/FastraxLiveDetail";

export default function FastraxSandbox() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Filtros de Interfaz
  const [filterUbicacion, setFilterUbicacion] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");

  // Mapa de precios en memoria (SKU -> Precio)
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // States para Pedidos
  const [orderSku, setOrderSku] = useState("");
  const [orderQty, setOrderQty] = useState("1");
  const [orderId, setOrderId] = useState(""); 
  const [customPed, setCustomPed] = useState("WEB-" + Math.floor(Math.random() * 1000));
  
  // Debug
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [opLoading, setOpLoading] = useState(false);

  // Detail
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

  // Obtener listas únicas para los Selects de filtro
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.categoria))).filter(Boolean);
    return cats.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUbi = filterUbicacion === "all" || p.ubicacion === filterUbicacion;
      const matchCat = filterCategoria === "all" || p.categoria === filterCategoria;
      return matchSearch && matchUbi && matchCat;
    });
  }, [products, searchTerm, filterUbicacion, filterCategoria]);

  // Carga masiva de precios al cambiar la vista
  useEffect(() => {
    if (filteredProducts.length > 0) {
      const skus = filteredProducts.slice(0, 50).map(p => p.sku);
      fetchPricesInBulk(skus);
    }
  }, [filteredProducts]);

  const fetchPricesInBulk = async (skus: string[]) => {
    const skusToFetch = skus.filter(sku => !livePrices[sku]);
    if (loadingPrices || skusToFetch.length === 0) return;
    
    setLoadingPrices(true);
    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 11, sku: skusToFetch.join(",") })
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const newPrices: Record<string, number> = { ...livePrices };
        data.slice(1).forEach((item: any) => {
          newPrices[item.sku] = Number(item.pre || 0);
        });
        setLivePrices(newPrices);
      }
    } catch (e) {
      console.error("Error bulk prices", e);
    } finally {
      setLoadingPrices(false);
    }
  };

  const determineLocation = (slj: any[]) => {
    if (!Array.isArray(slj) || slj.length === 0) return "Almacén";
    
    let hasAsu = false;
    let hasCde = false;

    slj.forEach(storeObj => {
      const storeId = Object.keys(storeObj)[0];
      const stock = Number(storeObj[storeId]);
      
      if (stock > 0) {
        if (storeId === "3") hasAsu = true;
        if (storeId === "1") hasCde = true;
      }
    });

    if (hasAsu && hasCde) return "Asunción / CDE";
    if (hasAsu) return "Asunción";
    if (hasCde) return "Ciudad del Este";
    
    return "Almacén";
  };

  const runSmartSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(2);

    try {
      // 1. Obtener Diccionario de Categorías (Op 93) para guardar nombres reales
      const resCat = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 93, dat: "2018-01-01 00:00:00" })
      });
      const dataCat = await resCat.json();
      const catMap: Record<string, string> = {};
      if (Array.isArray(dataCat)) {
        dataCat.slice(1).forEach((c: any) => {
          catMap[c.sku] = decodeURIComponent(c.nom.replace(/\+/g, ' '));
        });
      }

      // 2. Obtener Lista Maestra de Stock (Op 1)
      const res1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const data1 = await res1.json();
      const skusWithStock = Array.isArray(data1) ? data1.slice(1).filter((p: any) => Number(p.sal) > 0) : [];
      
      if (skusWithStock.length === 0) throw new Error("No hay stock disponible en el servidor.");

      // 3. Procesar por lotes para obtener detalles (Op 2) y guardar
      const batchSize = 25;
      for (let i = 0; i < skusWithStock.length; i += batchSize) {
        const batch = skusWithStock.slice(i, i + batchSize);
        setSyncProgress(Math.round(((i + batch.length) / skusWithStock.length) * 100));

        const res2 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 2, sku: batch.map((b:any) => b.sku).join(",") })
        });
        const d2 = await res2.json();
        const detailsList = Array.isArray(d2) ? d2.slice(1) : [];

        const toInsert = detailsList.map((det: any) => {
          const baseInfo = batch.find((b:any) => b.sku === det.sku);
          const nombre = decodeURIComponent((det.nom || "Sin Nombre").replace(/\+/g, ' '));
          const catName = catMap[det.cat] || "General";
          
          return {
            sku: det.sku,
            nombre: nombre,
            stock: Number(baseInfo?.sal || 0),
            ubicacion: determineLocation(baseInfo?.slj),
            categoria: catName,
            url_slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_') + "_" + det.sku
          };
        });

        if (toInsert.length > 0) {
          await supabase.from("fastrax_products").upsert(toInsert, { onConflict: 'sku' });
        }
      }
      
      await loadProducts();
      alert("Sincronización Inteligente Finalizada (Categorías y Ubicaciones actualizadas).");
    } catch (e: any) { 
      alert("Error: " + e.message); 
    } finally { 
      setIsSyncing(false); 
      setSyncProgress(0); 
    }
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
              <p className="text-slate-500 font-medium italic">Gestión de Logística y Categorías (Real-Time Pre-Filter)</p>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
              <Button onClick={runSmartSync} disabled={isSyncing} className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic gap-2 h-12 px-6 shadow-lg shadow-blue-900/20">
                {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw className="fill-white" />}
                Sync Inteligente (24/48hs)
              </Button>
           </div>
        </div>

        {isSyncing && (
          <div className="bg-slate-900 border border-blue-500/30 p-6 rounded-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-blue-400 tracking-widest">Sincronizando Taxonomía y Logística</span>
              <span className="text-xs font-mono text-white">{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-1.5 bg-slate-950" />
            <p className="text-[10px] text-slate-500 italic">Identificando productos en Asunción y CDE para tiempos de entrega.</p>
          </div>
        )}

        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="bg-slate-900 p-1 border border-slate-800 rounded-xl h-auto">
             <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-600 font-black uppercase text-[10px] tracking-widest px-8 py-3">Catálogo con Filtros</TabsTrigger>
             <TabsTrigger value="lifecycle" className="data-[state=active]:bg-pink-600 font-black uppercase text-[10px] tracking-widest px-8 py-3">Flujo de Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
             {/* Barra de Filtros Inteligente */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    placeholder="BUSCAR SKU O NOMBRE..." 
                    className="bg-slate-900 border-slate-800 h-14 pl-14 text-lg font-bold uppercase placeholder:text-slate-700" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-1">
                  <Select value={filterUbicacion} onValueChange={setFilterUbicacion}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 h-14 font-black uppercase text-[10px] tracking-widest">
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-500" /><SelectValue placeholder="UBICACIÓN" /></div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="all">Todas las Sedes</SelectItem>
                      <SelectItem value="Asunción">Asunción (24hs)</SelectItem>
                      <SelectItem value="Ciudad del Este">Ciudad del Este (48hs)</SelectItem>
                      <SelectItem value="Asunción / CDE">Ambas Sedes</SelectItem>
                      <SelectItem value="Almacén">Almacén Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="bg-slate-900 border-slate-800 h-14 font-black uppercase text-[10px] tracking-widest">
                      <div className="flex items-center gap-2"><Tag size={14} className="text-pink-500" /><SelectValue placeholder="CATEGORÍA" /></div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-[300px]">
                      <SelectItem value="all">Todas las Categorías</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const livePrice = livePrices[product.sku];
                  const is24h = product.ubicacion?.includes("Asunción");
                  const is48h = product.ubicacion?.includes("Ciudad del Este");

                  return (
                    <Card 
                      key={product.id} 
                      className={`bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer overflow-hidden rounded-2xl flex flex-col ${isOutOfStock ? 'opacity-50' : ''}`}
                      onClick={() => { setSelectedProduct(product); setDetailOpen(true); }}
                    >
                      <div className="aspect-square bg-slate-950 relative flex items-center justify-center p-4">
                        <FastraxLiveImage sku={product.sku} className={`w-full h-full ${isOutOfStock ? 'grayscale' : ''}`} />
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <Badge className="bg-slate-950/80 border-slate-700 text-[8px] font-black py-0 px-2 h-4 uppercase">{product.sku}</Badge>
                          {is24h && (
                            <Badge className="bg-emerald-600 text-[8px] font-black py-0 px-2 h-4 uppercase flex items-center gap-1">
                              <Clock size={8} /> 24 HS
                            </Badge>
                          )}
                          {is48h && (
                            <Badge className="bg-blue-600 text-[8px] font-black py-0 px-2 h-4 uppercase flex items-center gap-1">
                              <Clock size={8} /> 48 HS
                            </Badge>
                          )}
                        </div>

                        <div className="absolute bottom-2 right-2">
                           <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-[7px] text-slate-500 font-black">{product.categoria}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3 flex-1">
                        <h3 className="text-[11px] font-black text-white uppercase line-clamp-2 leading-tight h-8">{product.nombre}</h3>
                        <div className="flex items-center justify-between border-t border-slate-800/50 pt-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Precio Live</span>
                            <span className="text-xs font-black text-emerald-400">
                              {livePrice ? `₲ ${livePrice.toLocaleString()}` : (
                                <div className="flex items-center gap-1 animate-pulse">
                                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                </div>
                              )}
                            </span>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setOrderSku(product.sku); 
                              alert("SKU copiado para pedido"); 
                            }}
                          >
                            <ShoppingCart size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                            <Input placeholder="Ej: 112233" className="bg-slate-950 border-slate-800 text-white font-mono h-11" value={orderSku} onChange={(e) => setOrderSku(e.target.value)} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase">Cantidad</Label>
                               <Input type="number" className="bg-slate-950 border-slate-800 text-white h-11" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase">Ref WEB (PED)</Label>
                               <Input className="bg-slate-950 border-slate-800 text-white font-mono h-11" value={customPed} onChange={(e) => setCustomPed(e.target.value)} />
                            </div>
                         </div>
                         <Button onClick={handleSendOrder} disabled={opLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic py-6">
                           <Send className="mr-2 w-4 h-4" /> Enviar Pedido (Op 12)
                         </Button>
                      </CardContent>
                   </Card>

                   <div className="grid grid-cols-1 gap-4">
                      <Button onClick={() => callApi(13, { pdc: orderId, ped: customPed })} disabled={!orderId || opLoading} className="bg-slate-800 hover:bg-slate-700 text-white font-black uppercase italic py-8">
                        <FileSearch className="mr-2 w-4 h-4" /> Consultar Estado (Op 13)
                      </Button>
                      <Button onClick={() => callApi(15, { pdc: orderId, ped: customPed })} disabled={!orderId || opLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic py-8">
                        <Receipt className="mr-2 w-4 h-4" /> Confirmar / Facturar (Op 15)
                      </Button>
                      <Button onClick={() => callApi(16, { pdc: orderId, ped: customPed })} disabled={!orderId || opLoading} className="bg-red-900 hover:bg-red-800 text-white font-black uppercase italic py-8">
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
                         <CardContent className="p-0 h-40 overflow-auto custom-scrollbar text-white">
                            <pre className="p-4 text-[10px] font-mono text-blue-300 leading-tight">
                               {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                            </pre>
                         </CardContent>
                      </Card>
                      <Card className="bg-slate-900 border-slate-800">
                         <CardHeader className="bg-slate-950 p-3 border-b border-slate-800 flex flex-row items-center justify-between">
                            <CardTitle className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-2"><Server size={12} /> JSON Respuesta</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0 h-40 overflow-auto custom-scrollbar text-white">
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
