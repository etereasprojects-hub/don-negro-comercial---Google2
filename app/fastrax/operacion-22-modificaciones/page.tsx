"use client";

import React, { useState } from "react";
import { 
  RefreshCcw, 
  Code, 
  Server, 
  Terminal, 
  Activity, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Hash, 
  Calendar, 
  Box,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Operacion22Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [formData, setFormData] = useState({
    ord: "", // Orden final
    odi: ""  // Orden inicial de comparación
  });

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 22,
      ord: formData.ord || undefined,
      odi: formData.odi || undefined
    };

    // Payload visual (credenciales ocultas)
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
  const summaryInfo = isArray && response.length > 1 ? response[1] : null;
  const alteredItems = summaryInfo?.alt || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight italic uppercase">Modificación de Datos y Saldos</h2>
          <p className="text-slate-400 mt-1">Sincroniza cambios masivos comparando lotes de órdenes (ord/odi).</p>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-blue-500/50 text-blue-400 font-mono text-xs bg-blue-500/5 uppercase tracking-widest">
          OPE_ID: 22
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-blue-500" />
                Diferencial de Sincro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Orden Final (ORD)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                  <Input 
                    placeholder="Número de orden actual" 
                    className="bg-slate-950 border-slate-700 text-white h-11 pl-10 focus:border-blue-500 font-mono"
                    value={formData.ord}
                    onChange={(e) => setFormData({ ...formData, ord: e.target.value })}
                  />
                </div>
                <p className="text-[9px] text-slate-500 italic">Si se omite, genera una nueva orden basada en datos actuales.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Orden Inicial (ODI)</Label>
                <div className="relative">
                  <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                  <Input 
                    placeholder="Orden para comparar" 
                    className="bg-slate-950 border-slate-700 text-white h-11 pl-10 focus:border-blue-500 font-mono"
                    value={formData.odi}
                    onChange={(e) => setFormData({ ...formData, odi: e.target.value })}
                  />
                </div>
                <p className="text-[9px] text-slate-500 italic">Por defecto considera "ord - 1". Máx 30 operaciones.</p>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-12 shadow-lg shadow-blue-900/40 transition-all active:scale-95 border-b-4 border-blue-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <RefreshCcw className="w-5 h-5 mr-2" />}
                EJECUTAR SINCRO
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-950/50 border border-slate-800">
            <CardContent className="p-4 flex gap-3 text-[10px] text-slate-500 leading-relaxed uppercase font-bold italic">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p>Ideal para detectar qué productos han cambiado de precio o saldo entre dos puntos en el tiempo.</p>
            </CardContent>
          </Card>
        </div>

        {/* Consolas de Depuración */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3 text-blue-400" /> JSON_SENT
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[140px] max-h-[140px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Configure ord/odi y ejecute..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" /> RAW_RESPONSE
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[140px] max-h-[140px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Sin datos de retorno..."}
                </pre>
              </div>
            </div>
          </div>

          {/* Resultado de la Sincronización */}
          {summaryInfo && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-6 border-b border-slate-800">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white font-black px-3">ORD_FINAL: {summaryInfo.ord}</Badge>
                          <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono">ODI_REF: {summaryInfo.odi}</Badge>
                        </div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-2 italic uppercase">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          Cambios Detectados
                        </h3>
                      </div>
                      
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                         <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Ítems Alterados</p>
                         <p className="text-2xl font-black text-blue-400">{summaryInfo.qua}</p>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                         <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Fecha Operación</p>
                         <div className="flex items-center justify-center gap-1 text-xs font-bold text-white">
                           <Calendar className="w-3 h-3 text-slate-500" />
                           {summaryInfo.dat_ord || "N/A"}
                         </div>
                      </div>
                   </div>
                </div>

                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-950">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-8">SKU del Producto</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Ficha / Datos (dad)</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Saldo de Stock (sal)</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right pr-8">Acción Requerida</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alteredItems.length > 0 ? alteredItems.map((item: any, i: number) => (
                        <TableRow key={i} className="border-slate-800 hover:bg-blue-500/5 transition-colors">
                          <TableCell className="pl-8 font-mono text-blue-400 font-bold">{item.sku}</TableCell>
                          <TableCell className="text-center">
                            {item.dad ? (
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black uppercase text-[9px]">Alterado</Badge>
                            ) : (
                              <span className="text-slate-700 text-[9px] font-bold uppercase tracking-tighter">Sin Cambios</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.sal ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black uppercase text-[9px]">Saldo Actualizado</Badge>
                            ) : (
                              <span className="text-slate-700 text-[9px] font-bold uppercase tracking-tighter">Stock Estable</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white border border-transparent hover:border-blue-400">
                               Recargar OPE_2
                             </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-slate-600 italic text-xs font-medium">
                            No se encontraron cambios entre las órdenes especificadas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {statusInfo && statusInfo.estatus !== 0 && (
            <div className="bg-red-500/5 border-2 border-red-500/20 p-6 rounded-3xl flex items-center gap-5 animate-in shake-in duration-300">
              <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
              <div>
                <p className="text-xs uppercase font-black text-red-500 tracking-widest mb-1">Error de Sincronización</p>
                <p className="text-lg font-bold text-white">STATUS_{statusInfo.estatus}: {statusInfo.cestatus}</p>
                <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase italic">Data_ret: {statusInfo.data_ret}</p>
              </div>
            </div>
          )}

          {!loading && !response && (
            <div className="text-center py-24 bg-slate-900/30 rounded-[40px] border-4 border-dashed border-slate-800 group hover:border-blue-500/20 transition-all">
               <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                 <Layers className="w-10 h-10 text-slate-700 group-hover:text-blue-500 transition-colors" />
               </div>
               <h3 className="text-slate-400 text-lg font-black uppercase tracking-tighter">Comparador de Transacciones</h3>
               <p className="text-slate-600 text-sm max-w-sm mx-auto mt-2 italic font-medium">
                 Ejecute la operación para obtener el vector diferencial de ítems que requieren actualización de ficha o stock.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
