"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  Eye,
  Zap,
  Play,
  StopCircle,
  FileX
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductModal from "./ProductModal";
import { Progress } from "@/components/ui/progress";

interface FastraxProductsTableProps {
  onLogUpdate: (sent: any, received: any) => void;
}

export default function FastraxProductsTable({ onLogUpdate }: FastraxProductsTableProps) {
  // DB State (Productos ya guardados)
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  
  // Comment: Added missing states to resolve multiple "Cannot find name" errors.
  const [view, setView] = useState<"database" | "staging">("database");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Import State (Productos del API)
  const [apiSkus, setApiSkus] = useState<any[]>([]);
  const [stagingProducts, setStagingProducts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // AUTO SYNC STATE
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [autoSyncBatchProgress, setAutoSyncBatchProgress] = useState(0);
  const [autoSyncOverallProgress, setAutoSyncOverallProgress] = useState(0);
  const [currentBatchNum, setCurrentBatchNum] = useState(0);
  const [totalBatchesNum, setTotalBatchesNum] = useState(0);
  const [autoSyncErrors, setAutoSyncErrors] = useState<any[]>([]);

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
        const filteredList = data.slice(1);
        setApiSkus(filteredList); 
        return filteredList;
      }
      return [];
    } catch (error) {
      console.error("Fetch SKUs Error:", error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  };

  const loadDetailsForStaging = async () => {
    if (apiSkus.length === 0) return;
    setIsSyncing(true);
    setSyncProgress(20);
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const batch = apiSkus.slice(start, end);
    const result = await processBatch(batch);
    setStagingProducts(result);
    setIsSyncing(false);
  };

  const processBatch = async (batch: any[], onProductComplete?: (idx: number, total: number) => void) => {
    const loadedBatch: any[] = [];
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      if (onProductComplete) onProductComplete(i + 1, batch.length);
      else setSyncProgress(20 + ((i / batch.length) * 60));

      try {
        // Op 2: Detalles
        const res2 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 2, sku: item.sku })
        });
        const d2 = await res2.json();
        const details = Array.isArray(d2) ? d2[1] : null;

        if (!details) {
            setAutoSyncErrors(prev => [...prev, { sku: item.sku, error: "Detalles no encontrados en Servidor" }]);
            continue;
        }

        // Op 94: Imágenes
        const res3 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 94, sku: item.sku, dat: "2018-01-01 00:00:00" })
        });
        const d3 = await res3.json();
        const images = Array.isArray(d3) && d3[1] ? d3[1].base64 || [] : [];

        // Ubicación y Stock
        const stores = Array.isArray(item.slj) ? item.slj : [];
        let finalLocation = "Almacén";
        let branchId = "";
        const asuStock = stores.find((s: any) => Object.keys(s)[0] === "3")?.["3"] || 0;
        const cdeStock = stores.find((s: any) => Object.keys(s)[0] === "1")?.["1"] || 0;
        
        if (Number(asuStock) > 0) {
          finalLocation = "Asunción";
          branchId = "3";
        } else if (Number(cdeStock) > 0) {
          finalLocation = "Ciudad del Este";
          branchId = "1";
        }

        loadedBatch.push({
          nombre: decodeFastraxText(details.nom || "Sin Nombre"),
          descripcion: decodeFastraxText(details.des || details.bre || ""),
          codigo_ext: item.sku,
          costo: Number(details.pre || 0),
          stock: Number(item.sal || 0),
          imagen_url: images[0] || "",
          imagenes_extra: images.slice(1, 6),
          source: "Fastrax",
          ubicacion: finalLocation,
          fastrax_id_sucursal: branchId,
          fastrax_distribucion: stores,
          estado: "Activo"
        });
      } catch (err: any) {
        setAutoSyncErrors(prev => [...prev, { sku: item.sku, error: err.message || "Error desconocido" }]);
      }
    }
    return loadedBatch;
  };

  const commitToDb = async (batchToCommit: any[]) => {
    if (batchToCommit.length === 0) return;
    
    for (const prod of batchToCommit) {
      try {
        const slug = prod.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_') + "_" + prod.codigo_ext;
        const finalProd = {
          ...prod,
          url_slug: slug,
          margen_porcentaje: 18,
          interes_6_meses_porcentaje: 45,
          interes_12_meses_porcentaje: 65,
          interes_15_meses_porcentaje: 75,
          interes_18_meses_porcentaje: 85,
          active: true
        };

        const { error } = await supabase
          .from("products")
          .upsert(finalProd, { onConflict: 'codigo_ext' });

        if (error) {
           setAutoSyncErrors(prev => [...prev, { sku: prod.codigo_ext, error: "Database: " + error.message }]);
        }
      } catch (e: any) {
        setAutoSyncErrors(prev => [...prev, { sku: prod.codigo_ext, error: "Runtime: " + e.message }]);
      }
    }
  };

  const handleCommitManual = async () => {
    setIsSyncing(true);
    try {
      await commitToDb(stagingProducts);
      alert("Lote guardado correctamente.");
      loadDbProducts();
      setView("database");
    } catch (e: any) {
      alert("ERROR AL GUARDAR: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // FULL AUTO SYNC LOGIC - OPTIMIZED
  const handleFullAutoSync = async () => {
    if (isAutoSyncing) return;
    
    setIsAutoSyncing(true);
    setAutoSyncErrors([]);
    setAutoSyncOverallProgress(1); // Muestra que empezó
    setAutoSyncBatchProgress(0);

    // 1. Aseguramos tener los SKUs
    let skus = apiSkus;
    if (skus.length === 0) {
      onLogUpdate(null, "Iniciando descarga de lista maestra...");
      skus = await fetchSkus();
    }

    if (!skus || skus.length === 0) {
      alert("No se pudieron obtener productos de la API. Verifique conexión y logs.");
      setIsAutoSyncing(false);
      return;
    }

    // 2. Calculamos lotes
    const totalBatches = Math.ceil(skus.length / itemsPerPage);
    setTotalBatchesNum(totalBatches);
    console.log(`Iniciando procesamiento de ${skus.length} productos en ${totalBatches} lotes.`);

    // 3. Loop de procesamiento
    for (let b = 0; b < totalBatches; b++) {
      setCurrentBatchNum(b + 1);
      setAutoSyncBatchProgress(0);
      
      const start = b * itemsPerPage;
      const end = start + itemsPerPage;
      const batchSkus = skus.slice(start, end);

      // Procesar el lote de 20 (detalles e imágenes)
      const loadedProducts = await processBatch(batchSkus, (current, total) => {
         setAutoSyncBatchProgress((current / total) * 100);
      });

      // Guardar en Supabase (producto por producto para no detener el lote si uno falla)
      await commitToDb(loadedProducts);

      // Actualizar progreso global
      const progress = ((b + 1) / totalBatches) * 100;
      setAutoSyncOverallProgress(progress);
    }

    setIsAutoSyncing(false);
    loadDbProducts();
    alert("Sincronización Total Finalizada. Revise el log si hubo fallos menores.");
  };

  // Comment: Fixed references to state variables below.
  const filtered = (view === "database" ? dbProducts : stagingProducts).filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigo_ext && p.codigo_ext.toString().includes(searchTerm))
  );

  const totalPages = Math.ceil(apiSkus.length / itemsPerPage);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Error al eliminar producto");
    else loadDbProducts();
  };

  return (
    <div className="space-y-4">
      {/* Panel de Automatización Total */}
      <Card className="bg-slate-900 border-slate-800 border-2 overflow-hidden shadow-2xl">
        <CardContent className="p-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                 <h3 className="text-xl font-black text-white flex items-center justify-center md:justify-start gap-2 uppercase tracking-tighter italic">
                    <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                    Sincronización Inteligente Total
                 </h3>
                 <p className="text-slate-500 text-sm font-medium">Procesa automáticamente los {apiSkus.length || '...'} productos detectados en el servidor.</p>
              </div>
              <Button 
                onClick={handleFullAutoSync} 
                disabled={isAutoSyncing || isSyncing}
                className={`h-14 px-8 font-black uppercase text-base transition-all ${isAutoSyncing ? 'bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0'}`}
              >
                {isAutoSyncing ? (
                   <div className="flex items-center gap-3">
                      <Loader2 className="animate-spin w-5 h-5" /> PROCESANDO...
                   </div>
                ) : (
                  <div className="flex items-center gap-3">
                     <Play className="w-5 h-5 fill-white" /> Iniciar Sincronización Total
                  </div>
                )}
              </Button>
           </div>

           {(isAutoSyncing || autoSyncOverallProgress > 0) && (
             <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <div className="flex justify-between items-end">
                         <Label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Progreso Global de Lotes</Label>
                         <span className="text-xs font-black text-slate-300">Lote {currentBatchNum} / {totalBatchesNum}</span>
                      </div>
                      <Progress value={autoSyncOverallProgress} className="h-2 bg-slate-800" />
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-end">
                         <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Avance Ítems en Lote Actual</Label>
                         <span className="text-xs font-black text-slate-300">{Math.round(autoSyncBatchProgress)}% completado</span>
                      </div>
                      <Progress value={autoSyncBatchProgress} className="h-2 bg-slate-800" />
                   </div>
                </div>
                
                {autoSyncErrors.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                     <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase mb-2 tracking-widest">
                        <FileX className="w-4 h-4" /> Log de Fallos en Importación ({autoSyncErrors.length})
                     </div>
                     <div className="max-h-[150px] overflow-y-auto space-y-1 custom-scrollbar pr-2">
                        {autoSyncErrors.map((err, i) => (
                           <div key={i} className="text-[10px] font-mono text-red-400 flex justify-between bg-red-950/20 px-2 py-1 rounded border border-red-900/20">
                              <span className="font-bold">ITEM {err.sku}:</span>
                              <span className="opacity-70">{err.error}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           )}
        </CardContent>
      </Card>

      {/* Controles Superiores Manuales */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setView("database")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'database' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Base de Datos ({dbProducts.length})
          </button>
          <button 
            onClick={() => setView("staging")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'staging' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Importador Manual ({apiSkus.length})
          </button>
        </div>

        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre o SKU..." 
            className="pl-10 h-11 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {view === "database" ? (
            <Button 
              onClick={fetchSkus} 
              disabled={isSyncing || isAutoSyncing}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black gap-2 h-11"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Listar SKUs Servidor
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline"
                onClick={loadDetailsForStaging}
                disabled={isSyncing || isAutoSyncing || apiSkus.length === 0}
                className="flex-1 md:flex-none border-blue-200 text-blue-600 font-black h-11 uppercase text-[10px]"
              >
                Cargar Lote de Página
              </Button>
              <Button 
                onClick={handleCommitManual}
                disabled={isSyncing || isAutoSyncing || stagingProducts.length === 0}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 uppercase text-[10px]"
              >
                Guardar Lote Manual
              </Button>
            </div>
          )}
        </div>
      </div>

      {isSyncing && !isAutoSyncing && (
        <div className="space-y-1">
          <Progress value={syncProgress} className="h-1.5 bg-slate-200" />
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-center">Procesando integración... {Math.round(syncProgress)}%</p>
        </div>
      )}

      {/* Paginación de Importación (Solo visible en staging) */}
      {view === "staging" && apiSkus.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
           <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
             <Layers className="w-4 h-4" /> Mostrando Lote de {itemsPerPage} de {apiSkus.length} productos totales en servidor
           </div>
           <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === 1 || isAutoSyncing}
                onClick={() => { setCurrentPage(v => v - 1); setStagingProducts([]); }}
                className="h-8 w-8 p-0"
              ><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs font-bold text-slate-600">Pág. {currentPage} / {totalPages}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === totalPages || isAutoSyncing}
                onClick={() => { setCurrentPage(v => v + 1); setStagingProducts([]); }}
                className="h-8 w-8 p-0"
              ><ChevronRight className="w-4 h-4" /></Button>
           </div>
        </div>
      )}

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-[400px]">Producto</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU Externo</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Costo (Base)</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {dbLoading && view === "database" ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Accediendo a Supabase...</p>
                   </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        {view === 'database' 
                          ? "No se han encontrado productos importados." 
                          : "Seleccione un lote y cargue los detalles para verificar."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((product, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                        {product.imagen_url ? (
                          <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{product.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] h-4 font-black uppercase">
                            Fastrax API
                          </Badge>
                          {product.fastrax_id_sucursal && (
                            <Badge className={`${product.fastrax_id_sucursal === '3' ? 'bg-blue-600' : 'bg-orange-600'} text-white text-[8px] h-4 font-black uppercase`}>
                              {product.fastrax_id_sucursal === '3' ? 'Asunción' : 'CDE'}
                            </Badge>
                          )}
                          {view === 'staging' && <span className="text-[9px] text-amber-600 font-bold uppercase italic">Sin guardar</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                    {product.codigo_ext}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">₲ {Number(product.costo).toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 font-black uppercase">Costo Proveedor</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={`font-black tracking-widest ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock} UNI
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => openProductModal(product)}
                         className="h-9 w-9 p-0 hover:bg-blue-50 text-blue-600"
                       >
                         {view === 'database' ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </Button>
                       {view === 'database' && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => handleDelete(product.id)} 
                           className="h-9 w-9 p-0 hover:bg-red-50 text-red-600"
                         >
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        onSave={loadDbProducts}
      />
    </div>
  );
}