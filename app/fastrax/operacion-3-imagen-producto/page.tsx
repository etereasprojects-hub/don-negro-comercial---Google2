
"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Code, Server, Terminal, Activity, Download, AlertCircle, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Operacion3Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    sku: "",
    img: "1"
  });

  const handleFetch = async () => {
    if (!formData.sku.trim()) {
      alert("Ingrese un SKU válido");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const visualPayload = {
      cod: "42352",
      pas: "*****************",
      ope: 3,
      sku: formData.sku,
      img: formData.img
    };
    setLastPayload(visualPayload);

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ope: 3, 
          sku: formData.sku, 
          img: formData.img 
        })
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error local: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Imagen del Producto</h2>
          <p className="text-slate-400 mt-1">Obtén el archivo binario de la imagen vinculada a un SKU.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-emerald-500/50 text-emerald-400 font-mono text-xs bg-emerald-500/5">
          OPERATION_ID: 3
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parámetros */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Terminal className="w-4 h-4 text-emerald-500" />
              Solicitud
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Define el SKU y el índice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">SKU del Ítem</Label>
              <Input 
                placeholder="Ej: 11111" 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Número de Imagen</Label>
              <Input 
                type="number"
                min="1"
                className="bg-slate-950 border-slate-800 text-white"
                value={formData.img}
                onChange={(e) => setFormData({...formData, img: e.target.value})}
              />
              <p className="text-[10px] text-slate-500 italic">Normalmente '1' es la principal.</p>
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20" 
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
              {loading ? "Descargando..." : "Obtener Imagen"}
            </Button>
          </CardContent>
        </Card>

        {/* Depuración y Visor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-blue-400 flex items-center gap-2">
                  <Code className="w-3 h-3" /> JSON_PAYLOAD_SENT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 max-h-[140px] min-h-[140px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-blue-300 leading-relaxed">
                    {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-2">
                  <Server className="w-3 h-3" /> RAW_API_RESPONSE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 max-h-[140px] min-h-[140px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-emerald-300 leading-relaxed">
                    {response ? (
                      // Mostramos una versión truncada del base64 para no bloquear la UI
                      JSON.stringify({
                        ...response,
                        imageData: response.imageData ? `${response.imageData.substring(0, 50)}... [TRUNCATED]` : undefined
                      }, null, 2)
                    ) : "// No hay datos..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visor de Imagen */}
          <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
            <CardHeader className="border-b border-slate-800 bg-slate-950/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <FileImage className="w-4 h-4 text-emerald-500" />
                  Previsualización del Archivo
                </CardTitle>
                {response?.imageData && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Binary Loaded (Base64)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {response?.imageData ? (
                <div className="relative group">
                  <img 
                    src={response.imageData} 
                    alt="Fastrax Product" 
                    className="max-h-[500px] rounded-lg shadow-2xl border-4 border-slate-800 animate-in zoom-in-95 duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <a 
                      href={response.imageData} 
                      download={`SKU-${formData.sku}-${formData.img}.jpg`}
                      className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Download size={16} />
                      Descargar JPG
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-20">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto border-2 border-dashed border-slate-700">
                    <ImageIcon className="w-10 h-10 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-bold">Sin previsualización</p>
                    <p className="text-slate-600 text-xs">Ejecute la consulta para ver el archivo binario</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {response?.estatus !== 0 && response && (
             <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
               <AlertCircle size={18} />
               <span className="text-sm font-bold">Error: {response.cestatus || "No se pudo obtener la imagen"}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
