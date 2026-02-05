"use client";

import React, { useState } from "react";
import { 
  History, 
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
  Clock,
  Database,
  ArrowRight,
  Zap
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AlteredProduct {
  sku: string;
  sta: string | number; // 1-Datos, 2-Imágenes, 3-Ambos
  dpd: string; // Fecha alteración datos
  dlg: string; // Fecha alteración imágenes
}

export default function Operacion99Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    dat: "2018-01-01 00:00:00",
    mod: "A" // A-Ambos, P-Datos, I-Imágenes
  });

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 99,
      dat: filters.dat,
      mod: filters.mod
    };

    // Enmascaramos credenciales para el visor público de la herramienta
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
      setResponse({ estatus: 99, cestatus: `Error crítico: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isArray = Array.isArray(response);
  const statusInfo = isArray ? response[0] : (response?.estatus !== undefined ? response : null);
  const alteredList: AlteredProduct[] = isArray ? response.slice(1) : [];

  const getAlterationLabel = (sta: any) => {
    const s = Number(sta);
    switch (s) {
      case 1: return { label: "Datos Alterados", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      case 2: return { label: "Imágenes Alteradas", class: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case 3: return { label: "Datos + Imágenes", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      default: return { label: "Desconocido", class: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Consulta de Alterados</h2>
          <p className="text-slate-400 mt-1">Monitoreo incremental de cambios en fichas técnicas y archivos multimedia.</p>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-emerald-500/50 text-emerald-400 font-mono text-xs bg-emerald-500/10 uppercase tracking-widest">
          OPE_ID: 99
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-emerald-500" />
                Trigger de Sincro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Desde Fecha (dat)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                  <Input 
                    placeholder="YYYY-MM-DD HH:MM:SS" 
                    className="bg-slate-950 border-slate-700 text-white pl-10 h-11 focus:border-emerald-500 font-mono"
                    value={filters.dat}
                    onChange={(e) => setFilters({ ...filters, dat: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Modo de Alteración (mod)</Label>
                <Select value={filters.mod} onValueChange={(v) => setFilters({...filters, mod: v})}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-11 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white font-bold">
                    <SelectItem value="A">Ambos (A)</SelectItem>
                    <SelectItem value="P">Datos del Producto (P)</SelectItem>
                    <SelectItem value="I">Imágenes (I)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 border-b-4 border-emerald-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                SINCRONIZACIÓN DELTA
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                 <Info className="w-3 h-3" /> Propósito del Delta
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed italic">
                 Utilice esta operación para mantener su base de datos local actualizada sin descargar los miles de productos cada vez. 
               </p>
            </CardContent>
          </Card>
        </div>

        {/* Consolas y Tabla */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3 text-blue-400" /> OUTBOUND_JSON_DELTA
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Prepare consulta incremental..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" /> INBOUND_RAW_DELTA
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Esperando respuesta delta..."}
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
                   Deltas: {statusInfo.element}
                 </Badge>
              </div>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-950/30">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-8">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Tipo de Alteración</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Fecha Datos (dpd)</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Fecha Imágenes (dlg)</TableHead>
                      <TableHead className="text-right pr-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alteredList.length > 0 ? alteredList.map((item, i) => {
                      const label = getAlterationLabel(item.sta);
                      return (
                        <TableRow key={i} className="border-slate-800 hover:bg-slate-800/40 transition-colors group">
                          <TableCell className="pl-8">
                             <span className="font-mono text-emerald-500 font-bold text-xs">#{item.sku}</span>
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className={`font-black text-[9px] uppercase ${label.class}`}>
                               {label.label}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-400">
                             <div className="flex items-center gap-1.5">
                               <Clock className="w-3 h-3 text-slate-600" />
                               {item.dpd || "-"}
                             </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-400">
                             <div className="flex items-center gap-1.5">
                               <Clock className="w-3 h-3 text-slate-600" />
                               {item.dlg || "-"}
                             </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-emerald-600 opacity-0 group-hover:opacity-100 transition-all">
                               Actualizar Ficha
                               <ArrowRight className="w-3 h-3 ml-1" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-600 italic text-sm">
                           No se han detectado productos alterados desde el punto de control especificado.
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
                 <History className="w-10 h-10 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-lg font-black uppercase tracking-tighter">Delta Tracker Fastrax</h3>
               <p className="text-slate-600 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-bold uppercase italic text-center px-4">
                 Sincronice para obtener la lista de ítems modificados. Esto le permite actualizar su base de datos local de forma eficiente.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
