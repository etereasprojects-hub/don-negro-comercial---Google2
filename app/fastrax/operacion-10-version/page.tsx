"use client";

import React, { useState } from "react";
import { Activity, Code, Server, Terminal, Info, Cpu, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Operacion10Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 10
    };

    const visualPayload = {
      cod: "42352",
      pas: "*****************",
      ...payload
    };
    setLastPayload(visualPayload);

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

  // La Op 10 suele retornar un objeto directo o el primer elemento de un vector
  const statusInfo = Array.isArray(response) ? response[0] : response;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Versión de la API</h2>
          <p className="text-slate-400 mt-1">Verifica la disponibilidad del servicio y la versión actual del motor Fastrax.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-blue-500/50 text-blue-400 font-mono text-xs bg-blue-500/5">
          OPERATION_ID: 10
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Lateral */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-2xl h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Estado del Sistema
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Consulta técnica rápida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Esta operación no requiere parámetros adicionales. Úsela para diagnosticar latencia o verificar actualizaciones de software en la API de Fastrax.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" 
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Server className="w-4 h-4 mr-2" />}
              Consultar Versión
            </Button>
          </CardContent>
        </Card>

        {/* Tráfico y Resultados */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-2">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-blue-400 flex items-center gap-2">
                  <Code className="w-3 h-3" /> JSON_PAYLOAD_SENT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 min-h-[100px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-blue-300 leading-relaxed">
                    {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-2">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-green-400 flex items-center gap-2">
                  <Server className="w-3 h-3" /> RAW_API_RESPONSE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 min-h-[100px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-green-300 leading-relaxed">
                    {response ? JSON.stringify(response, null, 2) : "// Sin datos..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultado Visual */}
          {statusInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Versión API</p>
                      <p className="text-2xl font-black text-white">{statusInfo.ver || "0.00"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Fecha Versión</p>
                      <p className="text-sm font-bold text-white">{statusInfo.dat || "No disponible"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${statusInfo.estatus == 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <Activity className={`w-5 h-5 ${statusInfo.estatus == 0 ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Status {statusInfo.estatus}</p>
                      <p className="text-sm font-bold text-white truncate">{statusInfo.cestatus}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {statusInfo && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <CardHeader className="bg-slate-950/50 border-b border-slate-800">
                <CardTitle className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" /> Tiempos de Respuesta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
                  <div className="space-y-2">
                    <p className="text-slate-500 uppercase">Momento de Solicitud:</p>
                    <p className="text-blue-400 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                      {statusInfo.data_sol}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-500 uppercase">Momento de Retorno:</p>
                    <p className="text-green-400 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                      {statusInfo.data_ret}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !response && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center">
              <Terminal className="w-10 h-10 text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sistema en espera</h3>
              <p className="text-slate-600 text-[10px] mt-1">Presione el botón para verificar la conectividad con Fastrax.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
