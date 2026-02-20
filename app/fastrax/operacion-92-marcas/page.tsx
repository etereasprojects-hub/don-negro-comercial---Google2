
"use client";

import React, { useState } from "react";
import { 
  Tag, 
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
  Hash,
  ArrowRight
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

interface Brand {
  sku: string; // ID de la marca
  nom: string; // Nombre de la marca
}

export default function Operacion92Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    dat: "2018-01-01 00:00:00", // Fecha base para marcas
    sku: "" // ID de marca específico
  });

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 92,
      dat: filters.dat,
      sku: filters.sku || undefined
    };

    // Payload visual (credenciales enmascaradas)
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
  const brands: Brand[] = isArray ? response.slice(1) : [];

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
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Marcas del Sistema</h2>
          <p className="text-slate-400 mt-1">Sincronización del catálogo de fabricantes y marcas oficiales.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-emerald-500/50 text-emerald-400 font-mono text-xs bg-emerald-500/10 uppercase tracking-widest">
          OPE_ID: 92
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Lateral de Parámetros */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-emerald-500" />
                Control de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Desde Fecha (dat)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="YYYY-MM-DD HH:MM:SS" 
                    className="bg-slate-950 border-slate-700 text-white pl-10 h-11 focus:border-emerald-500 font-mono"
                    value={filters.dat}
                    onChange={(e) => setFilters({ ...filters, dat: e.target.value })}
                  />
                </div>
                <p className="text-[9px] text-slate-500 italic">Marcas agregadas o modificadas desde esta fecha.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Marca (sku)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="ID opcional" 
                    className="bg-slate-950 border-slate-700 text-white pl-10 h-11 focus:border-emerald-500 font-mono"
                    value={filters.sku}
                    onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 border-b-4 border-emerald-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                SINCRONIZAR MARCAS
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                 <Info className="w-3 h-3" /> Información
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed italic">
                 Esta operación retorna el listado de marcas registradas en el ERP. Útil para normalizar filtros de búsqueda por fabricante.
               </p>
            </CardContent>
          </Card>
        </div>

        {/* Consolas de Depuración y Resultados */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> OUTBOUND PAYLOAD
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// En espera de solicitud..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> INBOUND RESPONSE
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// No hay respuesta..."}
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
                   Total Brands: {statusInfo.element}
                 </Badge>
              </div>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-950/30">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-8 w-[200px]">ID de Marca (SKU)</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Nombre del Fabricante / Marca</TableHead>
                      <TableHead className="text-right pr-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.length > 0 ? brands.map((brand, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-emerald-500/5 transition-colors group">
                        <TableCell className="pl-8">
                           <div className="flex flex-col">
                             <span className="font-mono text-emerald-400 font-bold text-xs">#{brand.sku}</span>
                             <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">UID_BRAND</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                             <span className="text-sm font-bold text-white uppercase tracking-tight">{decodeSafe(brand.nom)}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-emerald-600 opacity-0 group-hover:opacity-100 transition-all">
                             Filtrar Productos
                             <ArrowRight className="w-3 h-3 ml-1" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-slate-600 italic text-sm">
                           No se han recuperado marcas. Inicie la sincronización.
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
               <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-6 shadow-2xl shadow-emerald-900/10">
                 <Tag className="w-10 h-10 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-lg font-black uppercase tracking-tighter">Explorador de Marcas</h3>
               <p className="text-slate-600 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-bold uppercase italic">
                 Recupere el listado actualizado de proveedores y fabricantes registrados en Fastrax.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
