"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Code, 
  Server, 
  Terminal, 
  Activity, 
  RefreshCw, 
  FileWarning, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Calendar,
  ChevronRight,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface PendingOrder {
  pdc: string;
  ped: string;
  emi: string;
  day: string;
}

export default function Operacion31Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 31
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
  const orders: PendingOrder[] = isArray ? response.slice(1) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Pedidos No Facturados</h2>
          <p className="text-slate-400 mt-1">Listado proactivo de órdenes pendientes de confirmación fiscal en el ERP.</p>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-amber-500/50 text-amber-400 font-mono text-xs bg-amber-500/10 uppercase tracking-widest">
          OPE_ID: 31
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Lateral de Acción */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-amber-500" />
                Control de Sincro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed italic">
                Esta operación recupera todos los pedidos generados por el ecommerce que aún no han sido facturados por el sistema.
              </p>
              
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black h-12 shadow-lg shadow-amber-900/40 transition-all active:scale-95 border-b-4 border-amber-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <PackageSearch className="w-5 h-5 mr-2" />}
                SINCRONIZAR PENDIENTES
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                 <Info className="w-3 h-3" /> Leyenda de Riesgo
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Bloqueo Inminente (≤ 2 días)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Pendiente Estándar</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Consolas y Tabla */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> PAYLOAD OUTBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución de OPE_31..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> API INBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Sin datos de respuesta..."}
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
                 <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-800">
                   Elements: {statusInfo.element}
                 </Badge>
              </div>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-950/30">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-6">ID Sistema (PDC)</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">ID Ecommerce (PED)</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Fecha Emisión</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Días p/ Bloqueo</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right pr-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length > 0 ? orders.map((order, i) => {
                      const daysLeft = parseInt(order.day);
                      const isHighRisk = daysLeft <= 2;
                      
                      return (
                        <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <TableCell className="pl-6 font-mono text-amber-500 font-bold">#{order.pdc}</TableCell>
                          <TableCell className="font-bold text-white">{decodeURIComponent(order.ped)}</TableCell>
                          <TableCell className="text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-600" />
                              {order.emi}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`font-black ${isHighRisk ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
                              {order.day} Días
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                             <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                               Facturar (Op 15)
                               <ChevronRight className="w-3 h-3 ml-1" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-600 italic text-sm">
                           No hay pedidos pendientes de facturación en este momento.
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
               <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-6 shadow-2xl shadow-amber-900/10">
                 <FileWarning className="w-10 h-10 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-lg font-black uppercase tracking-tighter italic">Terminal en Espera de Datos</h3>
               <p className="text-slate-600 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-bold uppercase">
                 Inicie la sincronización para auditar los pedidos que requieren facturación inmediata.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
