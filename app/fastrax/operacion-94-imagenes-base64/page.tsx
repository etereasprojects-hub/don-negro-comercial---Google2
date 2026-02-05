"use client";

import React, { useState } from "react";
import { 
  ImageIcon, 
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
  Download,
  Layers,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductImageResult {
  sku: string;
  status: number | string;
  cestatus: string;
  base64: string[]; // Vector de strings en formato "data:image/png;base64,..."
}

export default function Operacion94Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    dat: "2018-01-01 00:00:00",
    sku: "" // Uno o varios separados por coma
  });

  const handleFetch = async () => {
    if (!filters.sku.trim()) {
      alert("Por favor ingrese al menos un SKU.");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 94,
      dat: filters.dat,
      sku: filters.sku
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
  const productResults: ProductImageResult[] = isArray ? response.slice(1) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Imágenes vía Base-64</h2>
          <p className="text-slate-400 mt-1">Recuperación masiva de activos visuales codificados para inserción directa en HTML.</p>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-indigo-500/50 text-indigo-400 font-mono text-xs bg-indigo-500/10 uppercase tracking-widest">
          OPE_ID: 94
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-indigo-500" />
                Control de Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">SKU(s) de Productos</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" />
                  <Input 
                    placeholder="Ej: 11111, 22222" 
                    className="bg-slate-950 border-slate-700 text-white h-11 pl-10 focus:border-indigo-500 font-mono font-bold"
                    value={filters.sku}
                    onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                  />
                </div>
                <p className="text-[9px] text-slate-600 italic uppercase">Separe por comas para consulta masiva.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Audit Date (dat)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" />
                  <Input 
                    placeholder="YYYY-MM-DD HH:MM:SS" 
                    className="bg-slate-950 border-slate-700 text-white h-11 pl-10 focus:border-indigo-500 font-mono"
                    value={filters.dat}
                    onChange={(e) => setFilters({ ...filters, dat: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black h-12 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 border-b-4 border-indigo-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Layers className="w-5 h-5 mr-2" />}
                EXTRAER ASSETS
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                 <Info className="w-3 h-3" /> Especificación 94
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed italic">
                 A diferencia de la Op 3, esta operación retorna un vector con <b>todas</b> las imágenes del producto en formato Base-64 listo para usar en el atributo <code>src</code>.
               </p>
            </CardContent>
          </Card>
        </div>

        {/* Depuración y Resultados */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3 text-blue-400" /> OUTBOUND_JSON
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// En espera de parámetros..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3 text-indigo-400" /> INBOUND_RAW_DATA
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-indigo-300 leading-tight">
                  {response ? JSON.stringify(response, null, 2).substring(0, 1000) + "..." : "// Sin respuesta activa..."}
                </pre>
              </div>
            </div>
          </div>

          {statusInfo && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-500 ${
              (statusInfo.estatus === 0 || statusInfo.estatus === "0" || statusInfo.estatus === "Ok") 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              <div className="flex items-center gap-4">
                 <div className="p-2 rounded-lg bg-current opacity-20">
                    {statusInfo.estatus === 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                 </div>
                 <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Status {statusInfo.estatus}: {statusInfo.cestatus}</h4>
                    <p className="text-[10px] font-bold opacity-60 font-mono">{statusInfo.data_ret} | Items: {statusInfo.element}</p>
                 </div>
              </div>
            </div>
          )}

          {/* Galería de Resultados */}
          <div className="space-y-8">
            {productResults.map((res, idx) => (
              <Card key={idx} className="bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl">
                <CardHeader className="bg-slate-950/50 border-b border-slate-800 py-3 px-6 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-indigo-600 text-white font-mono font-bold tracking-widest">SKU: {res.sku}</Badge>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${res.status == 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {res.cestatus}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                    Total Imágenes: {res.base64?.length || 0}
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  {res.base64 && res.base64.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {res.base64.map((img, iIdx) => (
                        <div key={iIdx} className="group relative aspect-square bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-all shadow-lg">
                           <img 
                             src={img} 
                             alt={`Asset ${iIdx}`} 
                             className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                              <a 
                                href={img} 
                                download={`SKU-${res.sku}-IMG-${iIdx}.png`}
                                className="bg-white text-black px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                              >
                                <Download className="w-3 h-3" /> Descargar
                              </a>
                           </div>
                           <Badge className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md border-slate-700 text-[8px] font-black">#{iIdx + 1}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-600 italic">
                      <ImageIcon className="w-12 h-12 opacity-10 mb-4" />
                      <p className="text-sm">No se encontraron activos visuales para este SKU.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && !response && (
            <div className="text-center py-32 bg-slate-900/20 rounded-[50px] border-4 border-dashed border-slate-800">
               <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center mx-auto border-2 border-slate-800 mb-8 shadow-2xl shadow-indigo-900/10">
                 <LayoutGrid className="w-12 h-12 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-xl font-black uppercase tracking-tighter italic">Visor de Activos Codificados</h3>
               <p className="text-slate-600 text-sm max-w-sm mx-auto mt-3 font-bold leading-relaxed uppercase">
                 Ingrese uno o varios códigos SKU para recuperar todas sus imágenes en formato Base-64 procesable.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
