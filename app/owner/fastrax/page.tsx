"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import ProductModal from "@/components/admin/ProductModal";
import BulkEditModal from "@/components/admin/BulkEditModal";
import FastraxLiveDetail from "@/components/fastrax/FastraxLiveDetail";
// Comment: Added missing imports for UI components and utility functions
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { 
  Database, Zap, Search, RefreshCw, Loader2, Package, Grid, Terminal,
  Activity, ShoppingCart, Send, FileSearch, Receipt, Trash2, Code, Server, 
  MapPin, Tag, Clock, ChevronLeft, ChevronRight, Eye, Edit, Box, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

export default function OwnerFastraxPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Vista y Filtros
  const [view, setView] = useState<"database" | "staging">("database");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUbicacion, setFilterUbicacion] = useState("all");
  
  // Datos
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [apiSkus, setApiSkus] = useState<any[]>([]);
  const [stagingProducts, setStagingProducts] = useState<any[]>([]);
  
  // UI Loading
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Selección y Modales
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadDbProducts();
    }
  }, [router]);

  const loadDbProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("source", "Fastrax")
      .order("created_at", { ascending: false });
    
    if (data) setDbProducts(data);
    setLoading(false);
  };

  const fetchApiSkus = async () => {
    setIsSyncing(true);
    setSyncProgress(10);
    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setApiSkus(data.slice(1));
        setView("staging");
      }
    } catch (e) { console.error(e); }
    finally { setIsSyncing(false); setSyncProgress(0); }
  };

  const determineLocation = (slj: any[]) => {
    if (!Array.isArray(slj) || slj.length === 0) return "Almacén";
    const hasAsu = slj.some(s => Object.keys(s)[0] === "3" && Number(Object.values(s)[0]) > 0);
    const hasCde = slj.some(s => Object.keys(s)[0] === "1" && Number(Object.values(s)[0]) > 0);
    if (hasAsu) return "Asunción";
    if (hasCde) return "Ciudad del Este";
    return "Almacén";
  };

  const syncAllStock = async () => {
    if (!confirm("¿Deseas actualizar el stock y ubicación de todos los productos Fastrax en tu DB?")) return;
    setIsSyncing(true);
    setSyncProgress(5);
    
    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const apiData = await res.json();
      if (!Array.isArray(apiData)) throw new Error("Error API");

      const masterList = apiData.slice(1);
      const toUpdate = dbProducts.map(dbP => {
        const live = masterList.find((l: any) => l.sku === dbP.codigo_ext);
        if (live) {
          return {
            id: dbP.id,
            stock: Number(live.sal || 0),
            ubicacion: determineLocation(live.slj),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }).filter(Boolean);

      if (toUpdate.length > 0) {
        // Upsert masivo por ID
        await supabase.from("products").upsert(toUpdate);
        alert(`Stock sincronizado para ${toUpdate.length} productos.`);
        loadDbProducts();
      }
    } catch (e) { alert("Error sincronizando stock"); }
    finally { setIsSyncing(false); setSyncProgress(0); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto de la base de datos?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadDbProducts();
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedProducts.size} productos seleccionados?`)) return;
    await supabase.from("products").delete().in("id", Array.from(selectedProducts));
    setSelectedProducts(new Set());
    loadDbProducts();
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedProducts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProducts(next);
  };

  const filtered = useMemo(() => {
    return dbProducts.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo_ext?.includes(searchTerm);
      const matchUbi = filterUbicacion === "all" || p.ubicacion === filterUbicacion;
      return matchSearch && matchUbi;
    });
  }, [dbProducts, searchTerm, filterUbicacion]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <AdminHeader />
      <AdminTabs activeTab="productos-fastrax" />
      
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Catálogo Fastrax Live</h1>
            <p className="text-slate-500 font-medium">Control total sobre los productos sincronizados de la API.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={syncAllStock} disabled={isSyncing} variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold uppercase text-[10px]">
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> Sincronizar Todo el Stock
            </Button>
            <Button onClick={fetchApiSkus} disabled={isSyncing} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px]">
              <Zap size={14} className="fill-white" /> Importar Nuevos
            </Button>
          </div>
        </div>

        {isSyncing && (
          <div className="bg-white border rounded-xl p-4 space-y-2 shadow-sm animate-in fade-in">
            <div className="flex justify-between text-[10px] font-black uppercase text-blue-600">
               <span>Procesando requerimiento Fastrax...</span>
               <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-1.5" />
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex gap-3 flex-1 w-full max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por Nombre o SKU..." 
                  className="pl-10 h-11 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterUbicacion} onValueChange={setFilterUbicacion}>
                <SelectTrigger className="w-48 h-11 font-bold text-xs uppercase tracking-tighter">
                  <SelectValue placeholder="Ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Sedes</SelectItem>
                  <SelectItem value="Asunción">Asunción (24hs)</SelectItem>
                  <SelectItem value="Ciudad del Este">Ciudad del Este (48hs)</SelectItem>
                  <SelectItem value="Almacén">Solo Almacén</SelectItem>
                </SelectContent>
              </Select>
           </div>

           {selectedProducts.size > 0 && (
             <div className="flex gap-2 animate-in slide-in-from-right-2">
                <Button onClick={() => setIsBulkModalOpen(true)} className="bg-slate-900 text-white gap-2 font-bold uppercase text-[10px]">
                  <Edit size={14} /> Editar {selectedProducts.size}
                </Button>
                <Button onClick={handleBulkDelete} variant="destructive" className="gap-2 font-bold uppercase text-[10px]">
                  <Trash2 size={14} /> Eliminar Lote
                </Button>
             </div>
           )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                    <th className="px-6 py-4 w-12"><Checkbox checked={selectedProducts.size === filtered.length && filtered.length > 0} onCheckedChange={() => {
                      if (selectedProducts.size === filtered.length) setSelectedProducts(new Set());
                      else setSelectedProducts(new Set(filtered.map(p => p.id)));
                    }} /></th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Producto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU Fastrax</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Precio Final</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock / Sede</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">Cargando base de datos...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-400 italic">No hay productos Fastrax en tu catálogo.</td></tr>
                  ) : filtered.map((p) => {
                    const prices = calculatePrices({
                      costo: Number(p.costo || 0),
                      margen_porcentaje: Number(p.margen_porcentaje || 18),
                      interes_6_meses_porcentaje: Number(p.interes_6_meses_porcentaje || 45),
                      interes_12_meses_porcentaje: Number(p.interes_12_meses_porcentaje || 65),
                      interes_15_meses_porcentaje: Number(p.interes_15_meses_porcentaje || 75),
                      interes_18_meses_porcentaje: Number(p.interes_18_meses_porcentaje || 85),
                    });
                    const is24h = p.ubicacion === "Asunción";
                    const is48h = p.ubicacion === "Ciudad del Este";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4"><Checkbox checked={selectedProducts.has(p.id)} onCheckedChange={() => toggleSelection(p.id)} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border">
                               {p.imagen_url ? <img src={p.imagen_url} className="w-full h-full object-contain" /> : <Package className="text-slate-300 w-6 h-6" />}
                             </div>
                             <div className="min-w-0">
                               <p className="font-black text-slate-900 text-xs truncate uppercase tracking-tight max-w-[300px]">{p.nombre}</p>
                               <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[8px] h-4 mt-1 font-bold">{p.categoria || "Fastrax Live"}</Badge>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-blue-600 font-bold text-xs">{p.codigo_ext}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-pink-600">{formatCurrency(prices.precioContado)}</span>
                             <span className="text-[9px] text-slate-400 font-bold uppercase italic">Costo: {formatCurrency(p.costo)}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center gap-1">
                              <Badge className={`${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-none font-black text-[10px]`}>
                                {p.stock} UNI
                              </Badge>
                              {is24h && <span className="text-[8px] font-black text-blue-600 uppercase flex items-center gap-1"><Clock size={8} /> Asunción (24hs)</span>}
                              {is48h && <span className="text-[8px] font-black text-orange-600 uppercase flex items-center gap-1"><Clock size={8} /> CDE (48hs)</span>}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button onClick={() => { setSelectedProduct({ sku: p.codigo_ext, nombre: p.nombre, costo: p.costo, stock: p.stock, categoria: p.categoria }); setIsDetailOpen(true); }} size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-50" title="Consultar API">
                               <Search size={16} />
                             </Button>
                             <Button onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }} size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:bg-slate-100" title="Editar Local">
                               <Edit size={16} />
                             </Button>
                             <Button onClick={() => handleDelete(p.id)} size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" title="Eliminar de DB">
                               <Trash2 size={16} />
                             </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Modales */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} 
        product={selectedProduct} 
        onSave={loadDbProducts} 
      />

      <BulkEditModal 
        isOpen={isBulkModalOpen} 
        onClose={() => { setIsBulkModalOpen(false); setSelectedProducts(new Set()); }} 
        selectedProductIds={selectedProducts} 
        onSave={loadDbProducts} 
      />

      <FastraxLiveDetail 
        product={selectedProduct} 
        isOpen={isDetailOpen} 
        onClose={() => { setIsDetailOpen(false); setSelectedProduct(null); }} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      ` }} />
    </div>
  );
}