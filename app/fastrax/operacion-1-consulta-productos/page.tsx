"use client";

import React, { useState } from "react";
import { Search, Code, Server, Send, Package, Filter, AlertCircle, CheckCircle2, Info, Activity, Terminal } from "lucide-react";
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

export default function Operacion1Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  // Form Filters
  const [filters, setFilters] = useState({
    sku: "",
    blo: "T",
    mar: "",
    cat: "",
    gru: ""
  });

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    // El payload que mostramos (el proxy inyecta las credenciales reales)
    const visualPayload = {
      cod: "42352",
      pas: "*****************",
      ope: 1,
      ...filters
    };
    
    setLastPayload(visualPayload);

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, ...filters })
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error local: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Procesamiento seguro de la respuesta
  const isArrayResponse = Array.isArray(response);
  const statusInfo = isArrayResponse ? response[0] : response?.estatus !== undefined ? response : null;
  const products = isArrayResponse ? response.slice(1) : [];

  const getStatusLabel = (sta: any) => {
    const s = Number(sta);
    switch (s) {
      case 0: return { label: "OK / Con Saldo", class: "bg-green-500/20 text-green-400 border-green-500/30" };
      case 1: return { label: "Sin Saldo", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
      case 2: return { label: "Bloqueado", class: "bg-red-500/20 text-red-400 border-red-500/30" };
      case 8: return { label: "Fuera de Sistema", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
      case 9: return { label: "No Existe", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
      default: return { label: "Desconocido", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Consulta de Productos</h2>
          <p className="text-slate-400 mt-1">Sincroniza y filtra el catálogo completo de Fastrax.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-4 py-1.5 border-blue-500/50 text-blue-400 font-mono text-xs bg-blue-500/5">
            OPERATION_ID: 1
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Filter className="w-4 h-4 text-blue-500" />
              Parámetros
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Filtra el catálogo de Fastrax</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">SKU(s)</Label>
              <Input 
                placeholder="Separados por coma..." 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 h-10"
                value={filters.sku}
                onChange={(e) => setFilters({...filters, sku: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Estado de Bloqueo</Label>
              <Select value={filters.blo} onValueChange={(val) => setFilters({...filters, blo: val})}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="T">Todos (T)</SelectItem>
                  <SelectItem value="N">No bloqueados (N)</SelectItem>
                  <SelectItem value="B">Bloqueados (B)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Marcas</Label>
              <Input 
                placeholder="Ej: Samsung, LG..." 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 h-10"
                value={filters.mar}
                onChange={(e) => setFilters({...filters, mar: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Categorías</Label>
              <Input 
                placeholder="Ej: TV, Celulares..." 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 h-10"
                value={filters.cat}
                onChange={(e) => setFilters({...filters, cat: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Grupos</Label>
              <Input 
                placeholder="Filtro de grupo..." 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 h-10"
                value={filters.gru}
                onChange={(e) => setFilters({...filters, gru: e.target.value})}
              />
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 font-bold" 
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> 
                  Conectando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Consultar Catálogo
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 text-blue-400">
                  <Code className="w-3 h-3" />
                  JSON_PAYLOAD_SENT
                </CardTitle>
                <Terminal className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 min-h-[140px] max-h-[140px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-blue-300 leading-relaxed">
                    {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 text-green-400">
                  <Server className="w-3 h-3" />
                  RAW_API_RESPONSE
                </CardTitle>
                <Activity className="w-3 h-3 text-slate-700 group-hover:text-green-500 transition-colors" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 min-h-[140px] max-h-[140px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-green-300 leading-relaxed">
                    {response ? JSON.stringify(response, null, 2) : "// No hay datos..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {statusInfo && (
            <div className={`p-4 rounded-xl border flex items-start gap-4 shadow-lg transition-all ${
              (statusInfo.estatus === 0 || statusInfo.estatus === "Ok" || statusInfo.estatus === "0") 
                ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              <div className={`p-2 rounded-lg ${(statusInfo.estatus === 0 || statusInfo.estatus === "Ok" || statusInfo.estatus === "0") ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {(statusInfo.estatus === 0 || statusInfo.estatus === "Ok" || statusInfo.estatus === "0") ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm tracking-tight uppercase">
                    Status {statusInfo.estatus}: {statusInfo.cestatus}
                  </h4>
                  <span className="text-[10px] opacity-60 font-mono">{statusInfo.data_ret}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs opacity-80">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    Elementos: {statusInfo.element || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {products.length > 0 && Array.isArray(products) && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-slate-800 bg-slate-950/30 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-white text-base">
                  <Package className="w-5 h-5 text-blue-500" />
                  Resultados ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/80 sticky top-0 z-10">
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider w-[120px]">SKU</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Estado</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Saldo</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Distribución</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">CRC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p: any, i: number) => {
                        const status = getStatusLabel(p.sta);
                        return (
                          <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                            <TableCell className="font-mono text-blue-400 font-bold text-xs">{p.sku}</TableCell>
                            <TableCell>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-block ${status.class}`}>
                                {status.label}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-white text-base">
                              {p.sal} <span className="text-[10px] text-slate-500 font-normal">u.</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(p.slj) ? (
                                  p.slj.map((store: any, idx: number) => {
                                    const storeId = Object.keys(store)[0];
                                    const stock = store[storeId];
                                    const storeName = storeId === "1" ? "CDE" : storeId === "3" ? "ASU" : `L${storeId}`;
                                    return (
                                      <Badge key={idx} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 text-[10px]">
                                        {storeName}: <span className="text-white ml-1 font-bold">{stock}</span>
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-slate-600 text-[10px]">No disponible</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-[10px] text-slate-600">
                              {p.crc || "0x0"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {(!isArrayResponse || products.length === 0) && !loading && response && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center">
              <AlertCircle className="w-10 h-10 text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold">SIN DATOS</h3>
              <p className="text-slate-600 text-xs mt-1">
                {isArrayResponse ? "La consulta no devolvió productos." : "Error en el formato de respuesta de la API."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
