
"use client";

import React, { useState } from "react";
import { Receipt, Code, Server, Terminal, Activity, CheckCircle2, AlertCircle, FileCheck, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusCodes: Record<string, { label: string, color: string }> = {
  "0": { label: "OK - Facturado con éxito", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  "1": { label: "Usuario incorrecto", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "2": { label: "Seña incorrecta", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "40": { label: "Parámetros incorrectos", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "70": { label: "Pedido no existe en Sistema", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "71": { label: "Pedido existe pero no fue generado por ecommerce", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "72": { label: "Pedido borrado", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  "74": { label: "Inconsistencia en los datos del pedido del Sistema", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "80": { label: "Pedido ya facturado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "99": { label: "Error indeterminado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function Operacion15Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [formData, setFormData] = useState({
    ped: "",
    pdc: ""
  });

  const handleFetch = async () => {
    if (!formData.ped && !formData.pdc) {
      alert("Debe ingresar al menos un identificador (PED o PDC) para confirmar el pedido.");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 15,
      ped: formData.ped,
      pdc: formData.pdc
    };

    // Payload visual con credenciales ocultas
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
  const codeConfig = statusInfo ? statusCodes[statusInfo.estatus.toString()] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight italic uppercase">Facturar Pedido</h2>
          <p className="text-slate-400 mt-1">Confirmación definitiva y emisión de factura en el sistema ERP de Fastrax.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-emerald-500/50 text-emerald-400 font-mono text-xs bg-emerald-500/5 uppercase tracking-widest">
          OPE_ID: 15
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Acción */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-emerald-500" />
                Confirmación de Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Ecommerce (PED)</Label>
                <Input 
                  placeholder="Número de pedido web..." 
                  className="bg-slate-950 border-slate-700 text-white h-11 focus:border-emerald-500 font-mono"
                  value={formData.ped}
                  onChange={(e) => setFormData({ ...formData, ped: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-700 uppercase">Y/O</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Sistema (PDC)</Label>
                <Input 
                  placeholder="ID de sistema generado..." 
                  className="bg-slate-950 border-slate-700 text-white h-11 focus:border-emerald-500 font-mono"
                  value={formData.pdc}
                  onChange={(e) => setFormData({ ...formData, pdc: e.target.value })}
                />
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 border-b-4 border-emerald-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <FileCheck className="w-5 h-5 mr-2" />}
                CONFIRMAR Y FACTURAR
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 flex gap-3 text-xs text-slate-500 leading-relaxed italic">
              <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <p>Esta operación es irreversible en el ERP. Asegúrese de que el pago esté validado antes de facturar.</p>
            </CardContent>
          </Card>
        </div>

        {/* Depuración y Resultados */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> JSON ENVIADO
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> RESPUESTA API
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Sin datos de retorno..."}
                </pre>
              </div>
            </div>
          </div>

          {statusInfo && (
            <Card className={`bg-slate-900 border-2 overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 ${codeConfig?.color.split(' ')[2] || 'border-slate-800'}`}>
              <div className="flex flex-col md:flex-row">
                 <div className={`p-6 md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 ${codeConfig?.color.split(' ')[0] || 'bg-slate-950'}`}>
                    {statusInfo.estatus === 0 || statusInfo.estatus === "0" ? (
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                    ) : (
                      <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
                    )}
                    <h3 className="text-2xl font-black text-white">STATUS {statusInfo.estatus}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center ${codeConfig?.color.split(' ')[1] || 'text-slate-400'}`}>
                      {codeConfig?.label || "Estado Desconocido"}
                    </p>
                 </div>
                 
                 <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Info className="w-4 h-4 text-emerald-500" />
                         Descripción del Proceso
                       </h4>
                       <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-500">
                         {statusInfo.data_ret}
                       </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <div className="space-y-1">
                             <p className="text-[10px] text-slate-600 font-black uppercase">Mensaje del Servidor</p>
                             <p className="text-sm font-bold text-white leading-relaxed">{statusInfo.cestatus}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] text-slate-600 font-black uppercase">Elementos Retornados</p>
                             <p className="text-sm font-mono text-emerald-400">{statusInfo.element || 0}</p>
                          </div>
                       </div>

                       <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-500">Recibido en API:</span>
                             <span className="text-white font-mono">{statusInfo.data_sol || "-"}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-500">Respuesta enviada:</span>
                             <span className="text-white font-mono">{statusInfo.data_ret || "-"}</span>
                          </div>
                          <div className="h-px bg-slate-800" />
                          <div className="flex items-center gap-2 text-[10px] text-emerald-500/70 font-bold uppercase italic">
                             <Activity className="w-3 h-3" /> Conexión Fastrax Estable
                          </div>
                       </div>
                    </div>

                    {statusInfo.estatus === 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between group">
                         <div className="flex items-center gap-3">
                           <Receipt className="text-emerald-500 w-5 h-5" />
                           <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">La orden ha sido inyectada al flujo de logística</span>
                         </div>
                         <ArrowRight className="w-4 h-4 text-emerald-800 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                 </div>
              </div>
            </Card>
          )}

          {!loading && !response && (
            <div className="text-center py-24 bg-slate-900/30 rounded-[40px] border-4 border-dashed border-slate-800">
               <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700 mb-6 shadow-2xl shadow-emerald-900/10">
                 <Receipt className="w-10 h-10 text-slate-600" />
               </div>
               <h3 className="text-slate-400 text-lg font-black uppercase tracking-tighter">Esperando Parámetros</h3>
               <p className="text-slate-600 text-sm max-w-sm mx-auto mt-2 italic">
                 Ingrese el ID de la orden para proceder con la facturación y confirmación definitiva en Fastrax.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
