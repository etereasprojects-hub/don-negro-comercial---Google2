
"use client";

import React, { useState } from "react";
import { 
  FolderTree, 
  Code, 
  Server, 
  Terminal, 
  Activity, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Calendar,
  Layers,
  ChevronRight,
  Globe2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CategoryWeb {
  sku: string; // ID de categoría
  nom: string; // Nombre PT
  no2: string; // Nombre ES
  ord: string; // Orden
  par: string; // Parent ID
  met: string; // Meta description
}

export default function Operacion91Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    dat: "2018-01-01 00:00:00", // Fecha por defecto según ejemplo
    sku: "" // ID Categoría específico
  });

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 91,
      dat: filters.dat,
      sku: filters.sku || undefined
    };

    // Payload visual (ocultando credenciales)
    setLastPayload({ cod: "42352", pas: "*********", ...payload });

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error de red: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isArray = Array.isArray(response);
  const statusInfo = isArray ? response[0] : (response?.estatus !== undefined ? response : null);
  const categories: CategoryWeb[] = isArray ? response.slice(1) : [];

  const decodeSafe = (text: string) => {
    try {
      return decodeURIComponent(text.replace(/\+/g, ' '));
    } catch (e) {
      return text;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Categorías WEB</h2>
          <p className="text-slate-400 mt-1">Estructura taxonómica y menús configurados para el ecommerce.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-blue-500/50 text-blue-400 font-mono text-xs bg-blue-500/10 uppercase tracking-widest">
          OPE_ID: 91
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Lateral de Filtros */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-blue-500" />
                Parámetros de Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Desde Fecha (dat)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="YYYY-MM-DD HH:MM:SS" 
                    className="bg-slate-950 border-slate-700 text-white pl-10 h-11 focus:border-blue-500 font-mono"
                    value={filters.dat}
                    onChange={(e) => setFilters({ ...filters, dat: e.target.value })}
                  />
                </div>
                <p className="text-[9px] text-slate-500 italic">Trae categorías alteradas después de esta fecha.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Categoría (sku)</Label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="ID específico (opcional)" 
                    className="bg-slate-950 border-slate-700 text-white pl-10 h-11 focus:border-blue-500 font-mono"
                    value={filters.sku}
                    onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-12 shadow-lg shadow-blue-900/40 transition-all active:scale-95 border-b-4 border-blue-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                SINCRONIZAR ÁRBOL
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                 <Info className="w-3 h-3" /> Información Taxonómica
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed italic">
                 Utilice esta operación para generar menús automáticos. El campo <b>Parent</b> define la jerarquía de subcategorías.
               </p>
            </CardContent>
          </Card>
        </div>

        {/* Depuración y Resultados */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> PAYLOAD OUTBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Configure parámetros y sincronice..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> API INBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Sin respuesta del servidor..."}
                </pre>
              </div>
            </div>
          </div>

          {statusInfo && (
            <Card className="bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-xl animate-in slide-in-from-top-4 duration-500">
              <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    {statusInfo.estatus === 0 || statusInfo.estatus === "0" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      Status {statusInfo.estatus}: {statusInfo.cestatus}
                    </span>
                 </div>
                 <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-800 uppercase">
                   Nodes: {statusInfo.element}
                 </Badge>
              </div>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-950/30">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-6">ID Node</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Nombre (ES / PT)</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Orden / Parent</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Meta Description</TableHead>
                      <TableHead className="text-right pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length > 0 ? categories.map((cat, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                        <TableCell className="pl-6">
                           <div className="flex flex-col">
                             <span className="font-mono text-blue-400 font-bold text-xs">#{cat.sku}</span>
                             <span className="text-[8px] text-slate-600 font-black uppercase">UID_NODE</span>
                           </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                             <div className="text-xs font-bold text-white uppercase">{decodeSafe(cat.no2)}</div>
                             <div className="text-[10px] text-slate-500 italic flex items-center gap-1">
                               <Globe2 className="w-3 h-3" /> {decodeSafe(cat.nom)}
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                             <Badge className="bg-slate-800 text-[10px] font-mono">Ord: {cat.ord}</Badge>
                             <ChevronRight className="w-3 h-3 text-slate-700" />
                             <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">Par: {cat.par}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                           <p className="text-[10px] text-slate-500 max-w-xs truncate italic" title={decodeSafe(cat.met)}>
                             {decodeSafe(cat.met) || "Sin descripción meta"}
                           </p>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                             Ver Sub-nodos
                           </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-600 italic text-sm">
                           No se han recuperado categorías. Inicie la sincronización.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!loading && !response && (
            <div className="text-center py-28 bg-slate-900/20 rounded-[50px] border-4 border-dashed border-slate-800">
               <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-6 shadow-2xl shadow-blue-900/10">
                 <FolderTree className="w-10 h-10 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-lg font-black uppercase tracking-tighter">Explorador de Categorías Web</h3>
               <p className="text-slate-600 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-bold uppercase italic">
                 Obtenga la estructura jerárquica de Fastrax para replicarla en su plataforma de ventas.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
