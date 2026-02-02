"use client";

import React, { useState } from "react";
import { Search, Code, Server, Package, Info, Activity, Terminal, LayoutGrid, DollarSign, Box, Ruler } from "lucide-react";
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

export default function Operacion2Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [sku, setSku] = useState("");

  const handleFetch = async () => {
    if (!sku.trim()) {
      alert("Por favor, ingrese al menos un SKU.");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    // Payload visual para el usuario
    const visualPayload = {
      cod: "42352",
      pas: "*****************",
      ope: 2,
      sku: sku
    };
    setLastPayload(visualPayload);

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 2, sku: sku })
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error local: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isArrayResponse = Array.isArray(response);
  const statusInfo = isArrayResponse ? response[0] : response?.estatus !== undefined ? response : null;
  const productDetails = isArrayResponse ? response.slice(1) : [];

  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0" : num.toLocaleString("es-PY");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Detalles de Productos</h2>
          <p className="text-slate-400 mt-1">Consulta información extendida, ficha técnica y stock por tienda.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-purple-500/50 text-purple-400 font-mono text-xs bg-purple-500/5">
          OPERATION_ID: 2
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Terminal className="w-4 h-4 text-purple-500" />
              Consulta por SKU
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Ingrese uno o más códigos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Código(s) SKU</Label>
              <Input 
                placeholder="Ej: SKU123, SKU456..." 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 italic">Separe múltiples SKUs por coma.</p>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-900/20" 
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              {loading ? "Consultando..." : "Ver Detalles"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados y Tráfico */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-blue-400 flex items-center gap-2">
                  <Code className="w-3 h-3" /> JSON_PAYLOAD_SENT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 max-h-[140px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-blue-300 leading-relaxed">
                    {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-green-400 flex items-center gap-2">
                  <Server className="w-3 h-3" /> RAW_API_RESPONSE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 max-h-[140px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-green-300 leading-relaxed">
                    {response ? JSON.stringify(response, null, 2) : "// No hay datos..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Alert */}
          {statusInfo && (
            <div className={`p-4 rounded-xl border flex items-center gap-4 shadow-lg transition-all ${
              (statusInfo.estatus === 0 || statusInfo.estatus === "0" || statusInfo.estatus === "Ok") 
                ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              <div className="p-2 rounded-lg bg-current opacity-20">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm uppercase">Status {statusInfo.estatus}: {statusInfo.cestatus}</h4>
                <p className="text-[10px] opacity-60">Retornado: {statusInfo.data_ret} | Elementos: {statusInfo.element}</p>
              </div>
            </div>
          )}

          {/* Product Details Cards */}
          <div className="space-y-6">
            {productDetails.map((prod: any, idx: number) => (
              <Card key={idx} className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-purple-900/40 to-slate-900 p-6 border-b border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-purple-600 text-white font-mono">{prod.sku}</Badge>
                        <h3 className="text-xl font-bold text-white">{decodeURIComponent(prod.nom || "")}</h3>
                      </div>
                      <p className="text-slate-400 text-sm">{decodeURIComponent(prod.bre || "Sin descripción breve")}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Precio Contado</div>
                      <div className="text-2xl font-black text-green-400">₲ {formatCurrency(prod.pre)}</div>
                      {prod.prm > 0 && (
                        <div className="text-xs text-yellow-400/80 font-bold">PROMO: ₲ {formatCurrency(prod.prm)}</div>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ficha Técnica */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Ruler className="w-3 h-3" /> Especificaciones
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Peso</div>
                          <div className="text-sm font-mono text-white">{prod.pes || 0} kg</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Medidas (A/L/P)</div>
                          <div className="text-sm font-mono text-white">{prod.alt}/{prod.lgr}/{prod.pfd}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Imágenes</div>
                          <div className="text-sm font-mono text-white">{prod.img || 0} disp.</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Categoría</div>
                          <div className="text-sm font-mono text-white">ID: {prod.cat}</div>
                        </div>
                      </div>
                    </div>

                    {/* Stock y Tiendas */}
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-3 h-3" /> Distribución de Stock (Total: {prod.sal})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.isArray(prod.sl) ? (
                          prod.sl.map((store: any, sIdx: number) => {
                            const storeId = Object.keys(store)[0];
                            const stock = store[storeId];
                            const storeName = storeId === "1" ? "Ciudad del Este" : storeId === "3" ? "Asunción" : `Tienda ${storeId}`;
                            return (
                              <div key={sIdx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-purple-500/30 transition-colors">
                                <div className="text-[10px] text-slate-400 font-bold truncate">{storeName}</div>
                                <div className="text-lg font-black text-white">{stock} <span className="text-[10px] font-normal text-slate-600">u.</span></div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-4 text-center py-4 bg-slate-950 rounded-lg text-slate-600 italic text-sm">
                            Información de tiendas no disponible
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción Detallada */}
                  <div className="space-y-2 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" /> Descripción Técnica
                    </h4>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {decodeURIComponent(prod.des || "No hay una descripción detallada disponible.")}
                    </div>
                  </div>

                  {/* Atributos / Características */}
                  {prod.car && (
                    <div className="flex flex-wrap gap-2">
                      {decodeURIComponent(prod.car).split(';').map((c, i) => {
                        if (!c.trim()) return null;
                        return (
                          <Badge key={i} variant="outline" className="bg-slate-950 border-slate-800 text-slate-400 font-normal">
                            {c.trim()}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {productDetails.length === 0 && !loading && response && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center">
              <Package className="w-10 h-10 text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold">SIN RESULTADOS</h3>
              <p className="text-slate-600 text-xs mt-1">Intente con otro SKU o verifique los parámetros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
