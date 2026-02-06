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
  // DB State (Productos ya guardados)
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  
  // Import State (Productos del API)
  const [apiSkus, setApiSkus] = useState<any[]>([]);
  const [stagingProducts, setStagingProducts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // UI State
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

  // Paso 1: Obtener todos los SKUs disponibles
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
        setView("staging");
        setCurrentPage(1);
        setStagingProducts([]); 
        setSyncProgress(100);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Paso 2: Cargar detalles para los SKUs que estamos viendo en la página actual
  const loadDetailsForStaging = async () => {
    if (apiSkus.length === 0) return;
    
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

        // Obtener detalles (OPE 2)
        const res2 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 2, sku: item.sku })
        });
        const d2 = await res2.json();
        const details = Array.isArray(d2) ? d2[1] : null;

        if (!details) continue;

        // Obtener imágenes (OPE 94)
        const res3 = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 94, sku: item.sku, dat: "2018-01-01 00:00:00" })
        });
        const d3 = await res3.json();
        const images = Array.isArray(d3) && d3[1] ? d3[1].base64 || [] : [];

        // LÓGICA DE UBICACIÓN Y ID DE SUCURSAL
        const stores = Array.isArray(item.slj) ? item.slj : [];
        let finalLocation = "Fastrax Almacén";
        let branchId = "";
        
        // Buscamos stock en Asunción (3) primero para prioridad de 24hs
        const asuStock = stores.find((s: any) => Object.keys(s)[0] === "3")?.["3"] || 0;
        const cdeStock = stores.find((s: any) => Object.keys(s)[0] === "1")?.["1"] || 0;
        
        if (Number(asuStock) > 0) {
          finalLocation = "Fastrax Asunción";
          branchId = "3";
        } else if (Number(cdeStock) > 0) {
          finalLocation = "Fastrax CDE";
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
      }
      setStagingProducts(loadedBatch);
      setSyncProgress(100);
    } catch (e: any) {
      console.error("Error batch details:", e);
      alert("Error cargando detalles del lote: " + e.message);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Paso 3: Guardar en Base de Datos
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
          active: true
        };

        const { error } = await supabase
          .from("products")
          .upsert(finalProd, { onConflict: 'codigo_ext' });

        if (error) {
          console.error("Database Error:", error);
          throw new Error(`Fallo en SKU ${prod.codigo_ext}: ${error.message}`);
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

  const filtered = (view === "database" ? dbProducts : stagingProducts).filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigo_ext && p.codigo_ext.toString().includes(searchTerm))
  );

  const totalPages = Math.ceil(apiSkus.length / itemsPerPage);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Fix: Added missing handleDelete function to resolve line 427 error
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("Error al eliminar producto");
    } else {
      loadDbProducts();
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles Superiores */}
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
            Importador ({apiSkus.length})
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
              disabled={isSyncing}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black gap-2 h-11"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar con API Fastrax
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline"
                onClick={loadDetailsForStaging}
                disabled={isSyncing || apiSkus.length === 0}
                className="flex-1 md:flex-none border-blue-200 text-blue-600 font-black h-11 uppercase text-[10px]"
              >
                Cargar Lote de Página
              </Button>
              <Button 
                onClick={commitToDb}
                disabled={isSyncing || stagingProducts.length === 0}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 uppercase text-[10px]"
              >
                Guardar en Base de Datos
              </Button>
            </div>
          )}
        </div>
      </div>

      {isSyncing && (
        <div className="space-y-1">
          <Progress value={syncProgress} className="h-1.5 bg-slate-200" />
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-center">Procesando integración... {Math.round(syncProgress)}%</p>
        </div>
      )}

      {/* Paginación de Importación (Solo visible en staging) */}
      {view === "staging" && apiSkus.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
           <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
             <Layers className="w-4 h-4" /> Mostrando Lote de {itemsPerPage} de {apiSkus.length} productos totales en Fastrax
           </div>
           <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(v => v - 1); setStagingProducts([]); }}
                className="h-8 w-8 p-0"
              ><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs font-bold text-slate-600">Pág. {currentPage} / {totalPages}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === totalPages}
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