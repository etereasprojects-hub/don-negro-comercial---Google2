"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  Database,
  ArrowRight,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductModal from "./ProductModal";
import { Progress } from "@/components/ui/progress";

interface FastraxProductsTableProps {
  onLogUpdate: (sent: any, received: any) => void;
}

export default function FastraxProductsTable({ onLogUpdate }: FastraxProductsTableProps) {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [apiSkus, setApiSkus] = useState<any[]>([]);
  const [stagingProducts, setStagingProducts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"database" | "staging">("database");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    loadDbProducts();
  }, []);

  const loadDbProducts = async () => {
    setDbLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("source", "Fastrax")
      .order("created_at", { ascending: false });

    if (!error) setDbProducts(data || []);
    setDbLoading(false);
  };

  const decodeFastraxText = (text: string) => {
    if (!text) return "";
    try {
      return decodeURIComponent(text.replace(/\+/g, ' '));
    } catch (e) {
      return text.replace(/\+/g, ' ');
    }
  };

  const fetchSkus = async () => {
    setIsSyncing(true);
    setSyncProgress(10);
    const payload = { ope: 1, blo: "N" };
    onLogUpdate(payload, "Consultando lista maestra...");

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      onLogUpdate(payload, data);

      if (Array.isArray(data)) {
        setApiSkus(data.slice(1));
        setView("staging");
        setSyncProgress(100);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const loadDetailsForStaging = async () => {
    setIsSyncing(true);
    setSyncProgress(20);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const batch = apiSkus.slice(start, end);
    const loadedBatch: any[] = [];

    try {
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        setSyncProgress(20 + ((i / batch.length) * 60));

        const res2 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 2, sku: item.sku })
        });
        const d2 = await res2.json();
        const details = d2[1];

        if (!details) continue;

        const res3 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 94, sku: item.sku, dat: "2018-01-01 00:00:00" })
        });
        const d3 = await res3.json();
        const images = Array.isArray(d3) ? d3[1]?.base64 || [] : [];

        // Lógica de ubicación: 1=CDE, 3=ASU
        const stores = item.slj || [];
        let finalLocation = "Fastrax Almacén";
        const hasAsu = stores.some((s: any) => Object.keys(s)[0] === "3" && s["3"] > 0);
        const hasCde = stores.some((s: any) => Object.keys(s)[0] === "1" && s["1"] > 0);
        
        if (hasAsu) finalLocation = "Fastrax Asunción";
        else if (hasCde) finalLocation = "Fastrax CDE";

        loadedBatch.push({
          nombre: decodeFastraxText(details.nom || "Sin Nombre"),
          descripcion: decodeFastraxText(details.des || details.bre || ""),
          codigo_ext: item.sku,
          costo: Number(details.pre),
          stock: Number(item.sal),
          imagen_url: images[0] || "",
          imagenes_extra: images.slice(1, 6),
          source: "Fastrax",
          ubicacion: finalLocation,
          estado: "Activo"
        });
      }
      setStagingProducts(loadedBatch);
      setSyncProgress(100);
    } catch (e: any) {
      alert("Error cargando detalles del lote: " + e.message);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const commitToDb = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    try {
      let count = 0;
      for (const prod of stagingProducts) {
        count++;
        setSyncProgress((count / stagingProducts.length) * 100);
        
        const slug = prod.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_') + "_" + prod.codigo_ext;
        const finalProd = {
          ...prod,
          url_slug: slug,
          margen_porcentaje: 18,
          interes_6_meses_porcentaje: 45,
          interes_12_meses_porcentaje: 65,
          interes_15_meses_porcentaje: 75,
          interes_18_meses_porcentaje: 85,
          active: true,
          // Si el SKU está vacío por algún error, lo mandamos como null para no chocar
          codigo_ext: prod.codigo_ext || null 
        };

        const { error } = await supabase
          .from("products")
          .upsert(finalProd, { onConflict: 'codigo_ext' });

        if (error) {
          throw new Error(`Error en SKU ${prod.codigo_ext}: ${error.message}`);
        }
      }
      
      alert("Lote guardado correctamente.");
      loadDbProducts();
      setView("database");
    } catch (e: any) {
      alert("ERROR AL GUARDAR: " + e.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadDbProducts();
  };

  const filtered = (view === "database" ? dbProducts : stagingProducts).filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigo_ext && p.codigo_ext.includes(searchTerm))
  );

  const totalPages = Math.ceil(apiSkus.length / itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button onClick={() => setView("database")} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'database' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            BASE DE DATOS ({dbProducts.length})
          </button>
          <button onClick={() => setView("staging")} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'staging' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            IMPORTADOR ({apiSkus.length})
          </button>
        </div>

        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por nombre o SKU..." className="pl-10 h-11 border-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {view === "database" ? (
            <Button onClick={fetchSkus} disabled={isSyncing} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black gap-2 h-11">
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar API
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={loadDetailsForStaging} disabled={isSyncing || apiSkus.length === 0} className="flex-1 border-blue-200 text-blue-600 font-black h-11 uppercase text-[10px]">
                Cargar Lote
              </Button>
              <Button onClick={commitToDb} disabled={isSyncing || stagingProducts.length === 0} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 shadow-lg shadow-emerald-100 uppercase text-[10px]">
                Guardar en DB
              </Button>
            </div>
          )}
        </div>
      </div>

      {isSyncing && (
        <div className="space-y-1">
          <Progress value={syncProgress} className="h-1.5 bg-slate-200" />
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-center">Integrando... {Math.round(syncProgress)}%</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-[400px]">Producto</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Costo</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((product, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                        {product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{product.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] h-4 font-black uppercase">Fastrax API</Badge>
                          {view === 'staging' && <span className="text-[9px] text-amber-600 font-bold uppercase italic">Sin guardar</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{product.codigo_ext}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">₲ {product.costo.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={`font-black tracking-widest ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock} UNI
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }} className="h-9 w-9 p-0 hover:bg-blue-50 text-blue-600">
                         {view === 'database' ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </Button>
                       {view === 'database' && (
                         <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="h-9 w-9 p-0 hover:bg-red-50 text-red-600">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} product={selectedProduct} onSave={loadDbProducts} />
    </div>
  );
}