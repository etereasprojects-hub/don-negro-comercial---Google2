"use client";

import React, { useState } from "react";
import { Search, Code, Server, Terminal, Activity, Layers, Filter, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
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

export default function Operacion4Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    blo: "T",
    tam: "50",
    pag: "1",
    mar: "",
    cat: "",
    gru: ""
  });

  const handleFetch = async (targetPage?: string) => {
    const pageToFetch = targetPage || filters.pag;
    
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 4,
      ...filters,
      pag: pageToFetch
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
      
      if (targetPage) {
        setFilters(prev => ({ ...prev, pag: targetPage }));
      }
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error local: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Procesamiento del vector de Fastrax para Op 4:
  // [0] -> Status
  // [1] -> Paginación { pgs, pag }
  // [2...] -> Items
  const isArray = Array.isArray(response);
  const statusInfo = isArray ? response[0] : (response?.estatus !== undefined ? response : null);
  const paginationInfo = isArray && response.length > 1 ? response[1] : null;
  const items = isArray && response.length > 2 ? response.slice(2) : [];

  const totalPages = paginationInfo?.pgs ? parseInt(paginationInfo.pgs) : 0;
  const currentPage = paginationInfo?.pag ? parseInt(paginationInfo.pag) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Consulta Paginada</h2>
          <p className="text-slate-400 mt-1">Explora el catálogo por bloques de datos con filtros de marca y grupo.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-orange-500/50 text-orange-400 font-mono text-xs bg-orange-500/5">
          OPERATION_ID: 4
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Filtros */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Filter className="w-4 h-4 text-orange-500" />
              Filtros de Página
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Items/Pág</Label>
                <Input 
                  type="number" 
                  value={filters.tam}
                  onChange={(e) => setFilters({...filters, tam: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">N° Página</Label>
                <Input 
                  type="number" 
                  value={filters.pag}
                  onChange={(e) => setFilters({...filters, pag: e.target.value})}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Estado Bloqueo</Label>
              <Select value={filters.blo} onValueChange={(val) => setFilters({...filters, blo: val})}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="T">Todos (T)</SelectItem>
                  <SelectItem value="N">No Bloqueados (N)</SelectItem>
                  <SelectItem value="B">Bloqueados (B)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Marcas</Label>
              <Input 
                placeholder="Ej: Sony, Dell..." 
                value={filters.mar}
                onChange={(e) => setFilters({...filters, mar: e.target.value})}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Categorías</Label>
              <Input 
                placeholder="ID o Nombre..." 
                value={filters.cat}
                onChange={(e) => setFilters({...filters, cat: e.target.value})}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Grupos</Label>
              <Input 
                placeholder="Filtro de grupo..." 
                value={filters.gru}
                onChange={(e) => setFilters({...filters, gru: e.target.value})}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold" 
              onClick={() => handleFetch()}
              disabled={loading}
            >
              {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Consultar Página
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
                <div className="bg-slate-950/50 p-4 max-h-[120px] min-h-[120px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-blue-300 leading-relaxed">
                    {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Pendiente..."}
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
                <div className="bg-slate-950/50 p-4 max-h-[120px] min-h-[120px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-green-300 leading-relaxed">
                    {response ? JSON.stringify(response, null, 2) : "// Sin datos..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info de Paginación */}
          {paginationInfo && (
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Página Actual</span>
                  <span className="text-xl font-black text-white">{paginationInfo.pag}</span>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Páginas</span>
                  <span className="text-xl font-black text-orange-400">{paginationInfo.pgs}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handleFetch((currentPage - 1).toString())}
                  className="bg-slate-900 border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => handleFetch((currentPage + 1).toString())}
                  className="bg-slate-900 border-slate-700 text-slate-300"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Tabla de Resultados */}
          {items.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
              <CardHeader className="bg-slate-950/50 border-b border-slate-800">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <ListOrdered className="w-4 h-4 text-orange-500" />
                  Resultados del Lote ({items.length} ítems)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/80">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider w-[140px]">SKU</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Estado</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Saldo Total</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Tiendas</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">CRC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((p: any, i: number) => (
                        <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <TableCell className="font-mono text-blue-400 font-bold text-xs">{p.sku}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-bold ${
                              p.sta === "0" ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-slate-700 text-slate-400"
                            }`}>
                              {p.sta === "0" ? "OK / SALDO" : p.sta === "1" ? "SIN SALDO" : "OTRO"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-white text-base">
                            {p.Sal || p.sal || 0} <span className="text-[10px] text-slate-600 font-normal">u.</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(p.slj) ? (
                                p.slj.map((store: any, sIdx: number) => {
                                  const sId = Object.keys(store)[0];
                                  const qty = store[sId];
                                  return (
                                    <span key={sIdx} className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                                      L{sId}: <b className="text-slate-200">{qty}</b>
                                    </span>
                                  );
                                })
                              ) : "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-[10px] text-slate-700">
                            {p.crc || "0x00"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && response && items.length === 0 && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center">
              <Layers className="w-10 h-10 text-slate-700 mb-4" />
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Página sin ítems</h3>
              <p className="text-slate-600 text-xs mt-1">Verifique el número de página o los filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
