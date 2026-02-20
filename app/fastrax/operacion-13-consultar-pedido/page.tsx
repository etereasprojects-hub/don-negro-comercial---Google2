
"use client";

import React, { useState } from "react";
import { Search, Code, Server, Terminal, Activity, FileText, Calendar, CreditCard, Package, Info, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const situationMap: Record<string, { label: string, color: string }> = {
  "1": { label: "Emitido", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "2": { label: "Borrado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "3": { label: "Pagado", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  "4": { label: "Separando", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "5": { label: "Separado", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  "6": { label: "Expedido", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  "7": { label: "Entregado", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "8": { label: "En RMA", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "9": { label: "Devuelto", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function Operacion13Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [searchParams, setSearchParams] = useState({
    ped: "",
    pdc: ""
  });

  const handleFetch = async () => {
    if (!searchParams.ped && !searchParams.pdc) {
      alert("Debe ingresar al menos un identificador (PED o PDC)");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 13,
      ped: searchParams.ped,
      pdc: searchParams.pdc
    };

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
      setResponse({ estatus: 99, cestatus: `Error local: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isArray = Array.isArray(response);
  const statusInfo = isArray ? response[0] : (response?.estatus !== undefined ? response : null);
  const headerInfo = isArray && response.length > 1 ? response[1] : null;
  const items = isArray && response.length > 2 ? response.slice(2) : [];

  const sit = headerInfo?.sit ? situationMap[headerInfo.sit] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight italic uppercase">Consultar Pedido</h2>
          <p className="text-slate-400 mt-1">Verifica el estado, ítems y trazabilidad de una orden en Fastrax.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-cyan-500/50 text-cyan-400 font-mono text-xs bg-cyan-500/5 uppercase tracking-widest">
          OPE_ID: 13
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Búsqueda */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-cyan-500" />
                Criterios de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Ecommerce (PED)</Label>
                <Input 
                  placeholder="Ej: web-123" 
                  className="bg-slate-950 border-slate-700 text-white h-11 focus:border-cyan-500 font-mono"
                  value={searchParams.ped}
                  onChange={(e) => setSearchParams({ ...searchParams, ped: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-700 uppercase">O BIEN</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Sistema (PDC)</Label>
                <Input 
                  placeholder="Correlativo ERP" 
                  className="bg-slate-950 border-slate-700 text-white h-11 focus:border-cyan-500 font-mono"
                  value={searchParams.pdc}
                  onChange={(e) => setSearchParams({ ...searchParams, pdc: e.target.value })}
                />
              </div>

              <Button 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black h-12 shadow-lg shadow-cyan-900/40 transition-all active:scale-95 border-b-4 border-cyan-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                LOCALIZAR PEDIDO
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados y Consolas */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> JSON ENVIADO
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Ingrese ID y presione buscar..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> RESPUESTA API
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90">
                  {response ? JSON.stringify(response, null, 2) : "// Sin datos..."}
                </pre>
              </div>
            </div>
          </div>

          {headerInfo && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Resumen Cabecera */}
              <Card className="bg-slate-900 border-2 border-slate-800 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-6 border-b border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <Badge className="bg-cyan-600 text-white font-black">SISTEMA: #{headerInfo.pdc}</Badge>
                         <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono">ECOMM: {headerInfo.ped}</Badge>
                      </div>
                      <h3 className="text-2xl font-black text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-cyan-400" />
                        Detalles de la Orden
                      </h3>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Valor del Pedido</div>
                       <div className="text-3xl font-black text-emerald-400">₲ {Number(headerInfo.val).toLocaleString("es-PY")}</div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* Status & Times */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Situación Actual</span>
                           {sit ? (
                             <Badge variant="outline" className={`font-black ${sit.color}`}>{sit.label}</Badge>
                           ) : (
                             <Badge variant="outline">{headerInfo.sit}</Badge>
                           )}
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
                             <Calendar className="w-3 h-3" /> Trazabilidad Temporal
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                                <span className="text-slate-400">Emisión:</span>
                                <span className="text-white font-mono">{headerInfo.emi || "-"}</span>
                              </div>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-800/50 text-emerald-400">
                                <span className="font-bold">Pago Confirmado:</span>
                                <span className="font-mono">{headerInfo.pag || "-"}</span>
                              </div>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                                <span className="text-slate-400">Inicio Separación:</span>
                                <span className="text-white font-mono">{headerInfo.spi || "-"}</span>
                              </div>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-800/50 text-blue-400">
                                <span className="font-bold">Expedición:</span>
                                <span className="font-mono">{headerInfo.exp || "-"}</span>
                              </div>
                              <div className="flex justify-between text-xs py-1 text-green-400">
                                <span className="font-bold uppercase tracking-tighter">Entrega Final:</span>
                                <span className="font-mono">{headerInfo.ent || "-"}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Ítems Tabla */}
                     <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Package className="w-4 h-4 text-cyan-500" /> 
                             Contenido del Paquete ({headerInfo.ite} Ítems)
                           </h4>
                        </div>
                        <div className="border rounded-xl border-slate-800 overflow-hidden">
                           <Table>
                              <TableHeader className="bg-slate-950">
                                 <TableRow className="border-slate-800">
                                    <TableHead className="text-[10px] uppercase font-black text-slate-500">SKU</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Cantidad</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right">Val. Unitario</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right">Subtotal</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {items.map((item: any, i: number) => (
                                   <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30">
                                      <TableCell className="font-mono text-cyan-400 text-xs font-bold">{item.sku}</TableCell>
                                      <TableCell className="text-center font-black text-white">{item.qtd}</TableCell>
                                      <TableCell className="text-right text-slate-300 font-bold">₲ {Number(item.val).toLocaleString("es-PY")}</TableCell>
                                      <TableCell className="text-right text-emerald-400 font-black">₲ {(Number(item.qtd) * Number(item.val)).toLocaleString("es-PY")}</TableCell>
                                   </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </div>
                     </div>
                  </div>
                </CardContent>
              </Card>

              {/* Casos Especiales (Cancelaciones / RMA) */}
              {(headerInfo.can || headerInfo.rmi || headerInfo.rmf || headerInfo.dev) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {headerInfo.can && (
                     <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex gap-4">
                        <AlertCircle className="text-red-500 w-6 h-6 shrink-0" />
                        <div>
                           <p className="text-[10px] uppercase font-black text-red-500 tracking-widest">Orden Cancelada</p>
                           <p className="text-sm font-bold text-white mt-1">Fecha: {headerInfo.can}</p>
                        </div>
                     </div>
                   )}
                   {(headerInfo.rmi || headerInfo.dev) && (
                     <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex gap-4">
                        <Info className="text-orange-500 w-6 h-6 shrink-0" />
                        <div>
                           <p className="text-[10px] uppercase font-black text-orange-500 tracking-widest">Gestión de Retorno / RMA</p>
                           <div className="text-xs space-y-1 mt-2">
                             {headerInfo.dev && <p className="text-white">Devolución: <span className="font-mono text-orange-400">{headerInfo.dev}</span></p>}
                             {headerInfo.rmi && <p className="text-white">Recibo RMA: <span className="font-mono text-orange-400">{headerInfo.rmi}</span></p>}
                             {headerInfo.rmf && <p className="text-white">Salida RMA: <span className="font-mono text-orange-400">{headerInfo.rmf}</span></p>}
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              )}
            </div>
          )}

          {!loading && response && !headerInfo && (
            <div className="text-center py-20 bg-slate-900/30 rounded-[40px] border-4 border-dashed border-slate-800">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700 mb-4">
                 <Search className="w-10 h-10 text-slate-600" />
               </div>
               <h3 className="text-slate-400 text-lg font-black uppercase tracking-tighter">Pedido no encontrado</h3>
               <p className="text-slate-600 text-sm max-w-sm mx-auto mt-2">
                 {statusInfo?.cestatus || "Verifique los identificadores ingresados. El pedido puede no existir o no haber sido generado por este ecommerce."}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
