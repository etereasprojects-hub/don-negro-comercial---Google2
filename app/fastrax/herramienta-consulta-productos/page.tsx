"use client";

import React, { useState } from "react";
// Added missing 'Info' import from lucide-react
import { 
  Search, 
  Code, 
  Server, 
  Terminal, 
  Activity, 
  RefreshCw, 
  Package, 
  Tag, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Layers,
  ArrowDownToLine,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UnifiedProduct {
  sku: string;
  nombre: string;
  marca: string;
  precio: string;
  stock: string;
  estado: string;
}

export default function ProductExplorerTool() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [filters, setFilters] = useState({ mar: "", cat: "" });

  const executeSincro = async () => {
    setLoading(true);
    setProducts([]);
    setLastResponse(null);

    try {
      // PASO 1: Obtener lista base con OPE 1
      const payload1 = { ope: 1, mar: filters.mar || undefined, cat: filters.cat || undefined, blo: "N" };
      setLastPayload(payload1);
      
      const res1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1)
      });
      const data1 = await res1.json();
      
      if (!Array.isArray(data1)) {
        throw new Error(data1.cestatus || "Error en Paso 1 (OPE 1)");
      }

      const baseItems = data1.slice(1); // Ignorar cabecera
      if (baseItems.length === 0) {
        setLastResponse(data1);
        setLoading(false);
        return;
      }

      // PASO 2: Obtener detalles con OPE 2 (por lotes de 15 para evitar timeout)
      const skus = baseItems.map((i: any) => i.sku).slice(0, 30); // Limitamos a 30 para la herramienta
      const payload2 = { ope: 2, sku: skus.join(",") };
      
      const res2 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload2)
      });
      const data2 = await res2.json();
      setLastResponse(data2);

      if (!Array.isArray(data2)) {
        throw new Error(data2.cestatus || "Error en Paso 2 (OPE 2)");
      }

      const detailsItems = data2.slice(1);

      // MERGE de datos
      const unified = detailsItems.map((detail: any) => {
        const base = baseItems.find((b: any) => b.sku === detail.sku);
        return {
          sku: detail.sku,
          nombre: decodeURIComponent(detail.nom || "Sin Nombre"),
          marca: decodeURIComponent(detail.mar || detail.fab || "N/A"),
          precio: detail.pre,
          stock: base?.sal || "0",
          estado: base?.sta === "0" ? "OK" : "Limitado"
        };
      });

      setProducts(unified);
    } catch (error: any) {
      console.error(error);
      setLastResponse({ estatus: 99, cestatus: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Explorador de Productos</h2>
          <p className="text-slate-400 mt-1">Herramienta integral que cruza saldos y fichas técnicas en tiempo real.</p>
        </div>
        <Badge className="bg-emerald-600 text-white font-black px-4 py-1 uppercase tracking-widest">
          Tool Mode
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Filter className="w-4 h-4 text-emerald-500" />
                Filtros de Sincro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Filtrar por Marca</Label>
                <Input 
                  placeholder="Ej: Samsung, LG..." 
                  className="bg-slate-950 border-slate-700 text-white h-11"
                  value={filters.mar}
                  onChange={(e) => setFilters({ ...filters, mar: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Filtrar por Categoría</Label>
                <Input 
                  placeholder="Ej: Televisores..." 
                  className="bg-slate-950 border-slate-700 text-white h-11"
                  value={filters.cat}
                  onChange={(e) => setFilters({ ...filters, cat: e.target.value })}
                />
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 border-b-4 border-emerald-800" 
                onClick={executeSincro}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Database className="w-5 h-5 mr-2" />}
                OBTENER CATÁLOGO
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 flex gap-3 text-[11px] text-slate-500 italic leading-relaxed uppercase font-bold">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>Esta herramienta encadena automáticamente las operaciones 1 y 2 para construir una vista unificada del stock.</p>
            </CardContent>
          </Card>
        </div>

        {/* Consolas y Tabla */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> ORCHESTRATOR_OUTBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Configure filtros y sincronice..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> LAST_API_INBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {lastResponse ? JSON.stringify(lastResponse, null, 2) : "// Esperando respuesta..."}
                </pre>
              </div>
            </div>
          </div>

          {products.length > 0 && (
            <Card className="bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500">
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      Catálogo Unificado de Fastrax
                    </span>
                 </div>
                 <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                   Items: {products.length}
                 </Badge>
              </div>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-950/30">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-8">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Nombre del Producto</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Marca</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right">Precio Contado</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Stock</TableHead>
                      <TableHead className="pr-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((prod, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="pl-8 font-mono text-blue-400 font-bold text-xs">{prod.sku}</TableCell>
                        <TableCell className="font-bold text-white max-w-[240px] truncate uppercase text-xs">{prod.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-400 uppercase text-[9px] font-black">
                            {prod.marca}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-400 text-xs italic">
                           ₲ {Number(prod.precio).toLocaleString("es-PY")}
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="font-mono text-white font-bold">{prod.stock}</span>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-emerald-400">
                             <ArrowDownToLine className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-28 bg-slate-900/20 rounded-[50px] border-4 border-dashed border-slate-800">
               <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-6 shadow-2xl">
                 <Layers className="w-10 h-10 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-lg font-black uppercase tracking-tighter">Terminal de Datos Vacía</h3>
               <p className="text-slate-600 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-bold uppercase italic">
                 Sincronice para ver la lista de productos con Nombre, Marca y Precio unificados.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
