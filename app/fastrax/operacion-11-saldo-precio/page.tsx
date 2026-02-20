
"use client";

import React, { useState } from "react";
import { Search, Code, Server, Terminal, Activity, DollarSign, Package, Tag, Layers, AlertCircle } from "lucide-react";
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

export default function Operacion11Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    sku: "",
    mar: "",
    cat: "",
    gru: ""
  });

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 11,
      ...filters
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

  const isArray = Array.isArray(response);
  const statusInfo = isArray ? response[0] : (response?.estatus !== undefined ? response : null);
  const items = isArray ? response.slice(1) : [];

  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0" : num.toLocaleString("es-PY");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Saldo y Precio</h2>
          <p className="text-slate-400 mt-1">Detalla productos para venta con precios normales y promocionales.</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-emerald-500/50 text-emerald-400 font-mono text-xs bg-emerald-500/5">
          OPERATION_ID: 11
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parámetros */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Terminal className="w-4 h-4 text-emerald-500" />
              Filtros de Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">SKU(s)</Label>
              <Input 
                placeholder="Ej: 111, 222..." 
                className="bg-slate-950 border-slate-800 text-white"
                value={filters.sku}
                onChange={(e) => setFilters({...filters, sku: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Marcas</Label>
              <Input 
                placeholder="Samsung, Apple..." 
                className="bg-slate-950 border-slate-800 text-white"
                value={filters.mar}
                onChange={(e) => setFilters({...filters, mar: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Categorías</Label>
              <Input 
                placeholder="Smartphone, TV..." 
                className="bg-slate-950 border-slate-800 text-white"
                value={filters.cat}
                onChange={(e) => setFilters({...filters, cat: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Grupos</Label>
              <Input 
                placeholder="Filtro de grupo..." 
                className="bg-slate-950 border-slate-800 text-white"
                value={filters.gru}
                onChange={(e) => setFilters({...filters, gru: e.target.value})}
              />
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Consultar Precios
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
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
                <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-2">
                  <Server className="w-3 h-3" /> RAW_API_RESPONSE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950/50 p-4 max-h-[120px] min-h-[120px] overflow-auto custom-scrollbar">
                  <pre className="text-[10px] font-mono text-emerald-300 leading-relaxed">
                    {response ? JSON.stringify(response, null, 2) : "// Sin datos..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {items.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
              <CardHeader className="bg-slate-950/50 border-b border-slate-800">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  Listado de Precios y Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/80">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider w-[120px]">SKU / Estado</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Saldo Total</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Precio Normal</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Precio Promo</TableHead>
                        <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">Detalles Grilla</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((p: any, i: number) => (
                        <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <TableCell>
                            <div className="font-mono text-blue-400 font-bold text-xs">{p.sku}</div>
                            <Badge variant="outline" className={`text-[9px] mt-1 ${p.sta == 0 ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'}`}>
                              {p.sta == 0 ? "DISPONIBLE" : p.sta == 1 ? "SIN SALDO" : "BLOQUEADO"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-white text-base">
                            {p.sal} <span className="text-[10px] text-slate-600 font-normal">u.</span>
                          </TableCell>
                          <TableCell className="font-bold text-slate-300">
                            ₲ {formatCurrency(p.pre)}
                          </TableCell>
                          <TableCell>
                            {p.prm > 0 ? (
                               <div className="flex flex-col">
                                 <span className="text-emerald-400 font-black">₲ {formatCurrency(p.prm)}</span>
                                 <span className="text-[9px] text-emerald-500/50 font-bold uppercase tracking-tighter">Oferta Activa</span>
                               </div>
                            ) : (
                              <span className="text-slate-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex flex-col items-end gap-1">
                               {Array.isArray(p.grd) ? p.grd.map((g: any, gIdx: number) => (
                                 <span key={gIdx} className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-500">
                                   {g[0]}: <b className="text-slate-300">{g[1]}</b> | {g[2]}: <b className="text-slate-300">{g[3]}</b> | Stock: <b className="text-emerald-400">{g[4]}</b>
                                 </span>
                               )) : <span className="text-slate-700 text-xs">N/A</span>}
                             </div>
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
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin coincidencias</h3>
              <p className="text-slate-600 text-xs mt-1">Verifique los filtros ingresados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
