
"use client";

import React, { useState } from "react";
import { Trash2, Code, Server, Terminal, Activity, AlertTriangle, CheckCircle2, Info, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const statusCodes: Record<string, { label: string, color: string }> = {
  "0": { label: "OK - Pedido Borrado", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  "1": { label: "Usuario incorrecto", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "2": { label: "Seña incorrecta", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "40": { label: "Parámetros incorrectos", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "70": { label: "Pedido no existe en Sistema", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "71": { label: "Pedido existe pero no fue generado por ecommerce", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  "72": { label: "Pedido ya borrado o inexistente", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  "73": { label: "Pedido borrado por Sistema", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "80": { label: "ERROR: Pedido ya facturado (No se puede borrar)", color: "bg-red-600/20 text-red-500 border-red-600/30" },
  "99": { label: "Error indeterminado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function Operacion16Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [formData, setFormData] = useState({
    ped: "",
    pdc: ""
  });

  const handleFetch = async () => {
    if (!formData.ped && !formData.pdc) {
      alert("Debe ingresar al menos un identificador (PED o PDC) para proceder.");
      return;
    }

    if (!confirm("¿Está seguro de que desea BORRAR este pedido? Esta acción no se puede deshacer y solo funcionará si el pedido no ha sido facturado.")) {
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 16,
      ped: formData.ped,
      pdc: formData.pdc
    };

    // Payload para visualización (ocultando credenciales reales)
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
      setResponse({ estatus: 99, cestatus: `Error de comunicación: ${error.message}` });
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
          <h2 className="text-3xl font-bold text-white tracking-tight italic uppercase">Borrar Pedido</h2>
          <p className="text-slate-400 mt-1">Eliminación de órdenes no facturadas del sistema Fastrax.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-red-500/50 text-red-400 font-mono text-xs bg-red-500/5 uppercase tracking-widest">
          OPE_ID: 16
        </Badge>
      </div>

      <Alert className="bg-red-950/20 border-red-900/50 text-red-200">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertTitle className="font-bold uppercase text-xs tracking-widest">Atención Crítica</AlertTitle>
        <AlertDescription className="text-xs">
          Esta operación solo es válida para pedidos que aún <b>no han sido facturados</b>. Una vez que un pedido tiene factura emitida, el sistema bloqueará su eliminación por integridad contable.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Formulario de Acción */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-red-500" />
                Identificación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Ecommerce (PED)</Label>
                <Input 
                  placeholder="Número de orden web..." 
                  className="bg-slate-950 border-slate-700 text-slate-50 h-11 focus:border-red-500 font-mono font-bold"
                  value={formData.ped}
                  onChange={(e) => setFormData({ ...formData, ped: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-700 uppercase italic">O Bien</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Sistema (PDC)</Label>
                <Input 
                  placeholder="ID correlativo ERP..." 
                  className="bg-slate-950 border-slate-700 text-slate-50 h-11 focus:border-red-500 font-mono font-bold"
                  value={formData.pdc}
                  onChange={(e) => setFormData({ ...formData, pdc: e.target.value })}
                />
              </div>

              <Button 
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-12 shadow-lg shadow-red-900/40 transition-all active:scale-95 border-b-4 border-red-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                BORRAR DE FASTRAX
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 flex gap-3 text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-tighter italic">
              <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <p>Recomendamos verificar el estado del pedido con la Op. 13 antes de intentar borrarlo.</p>
            </CardContent>
          </Card>
        </div>

        {/* Paneles de Depuración y Respuesta */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> PAYLOAD OUTBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando disparador..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> API INBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// No hay respuesta..."}
                </pre>
              </div>
            </div>
          </div>

          {statusInfo && (
            <Card className={`bg-slate-900 border-2 overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 ${codeConfig?.color.split(' ')[2] || 'border-slate-800'}`}>
              <div className="flex flex-col md:flex-row">
                 <div className={`p-8 md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 ${codeConfig?.color.split(' ')[0] || 'bg-slate-950'}`}>
                    {statusInfo.estatus === 0 || statusInfo.estatus === "0" ? (
                      <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4 animate-bounce" />
                    ) : (
                      <AlertTriangle className="w-20 h-20 text-red-500 mb-4 animate-pulse" />
                    )}
                    <h3 className="text-3xl font-black text-white">OP_{statusInfo.estatus}</h3>
                    <p className={`text-[11px] font-black uppercase tracking-widest mt-2 text-center leading-tight ${codeConfig?.color.split(' ')[1] || 'text-slate-400'}`}>
                      {codeConfig?.label || "Respuesta No Tipificada"}
                    </p>
                 </div>
                 
                 <div className="p-8 flex-1 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Activity className="w-4 h-4 text-red-500" />
                         Diagnóstico de Ejecución
                       </h4>
                       <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-500 font-mono">
                         REF: {statusInfo.data_ret}
                       </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Mensaje de Salida</p>
                             <p className="text-base font-bold text-white leading-relaxed italic">"{statusInfo.cestatus}"</p>
                          </div>
                          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                             <p className="text-[10px] text-slate-600 font-black uppercase mb-2 tracking-widest">Información de Respuesta</p>
                             <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-500">Elementos procesados:</span>
                               <span className="text-emerald-400 font-black">{statusInfo.element || 0}</span>
                             </div>
                          </div>
                       </div>

                       <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800 space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-500 uppercase font-bold text-[9px]">Solicitud:</span>
                               <span className="text-slate-300 font-mono">{statusInfo.data_sol || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-500 uppercase font-bold text-[9px]">Respuesta:</span>
                               <span className="text-slate-300 font-mono">{statusInfo.data_ret || "N/A"}</span>
                            </div>
                          </div>
                          <div className="h-px bg-slate-800" />
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase italic tracking-tighter">
                             <Server className="w-3 h-3" /> Nodo de Conexión: Fastrax.php.API.v1
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </Card>
          )}

          {!loading && !response && (
            <div className="text-center py-28 bg-slate-900/20 rounded-[50px] border-4 border-dashed border-slate-800 transition-all hover:bg-slate-900/30">
               <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-8 shadow-2xl shadow-red-900/10 transform -rotate-3">
                 <Trash2 className="w-12 h-12 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-xl font-black uppercase tracking-tighter">Módulo de Borrado de Órdenes</h3>
               <p className="text-slate-600 text-sm max-w-md mx-auto mt-3 font-medium leading-relaxed italic">
                 Ingrese los identificadores del pedido que desea eliminar. Recuerde que esta operación tiene restricciones de estado en el ERP.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
