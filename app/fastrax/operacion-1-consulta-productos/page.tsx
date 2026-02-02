"use client";

import React, { useState } from "react";
import { Search, Code, Server, Send, Package, Filter, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    
    const payload = {
      ope: 1,
      ...filters
    };
    
    setLastPayload(payload);

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ estatus: 99, cestatus: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  // El primer elemento es el status, los demás son productos
  const statusInfo = Array.isArray(response) ? response[0] : response?.estatus !== undefined ? response : null;
  const products = Array.isArray(response) ? response.slice(1) : [];

  const getStatusLabel = (sta: number) => {
    switch (sta) {
      case 0: return { label: "OK / Saldo", class: "bg-green-500/20 text-green-400 border-green-500/30" };
      case 1: return { label: "Sin Saldo", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
      case 2: return { label: "Bloqueado", class: "bg-red-500/20 text-red-400 border-red-500/30" };
      case 8: return { label: "No Sistema", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
      case 9: return { label: "No Existe", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
      default: return { label: "Desconocido", class: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Operación 1</h2>
          <p className="text-slate-400 mt-1">Consulta masiva o específica de productos del catálogo Fastrax.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 border-blue-500 text-blue-400 font-mono">ope: 1</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Filtros */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">SKU (separados por coma)</Label>
              <Input 
                placeholder="Ej: 17,130,1220995" 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                value={filters.sku}
                onChange={(e) => setFilters({...filters, sku: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Situación de Bloqueo</Label>
              <Select value={filters.blo} onValueChange={(val) => setFilters({...filters, blo: val})}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
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
              <Label className="text-slate-300">Marcas</Label>
              <Input 
                placeholder="Marcas por coma" 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                value={filters.mar}
                onChange={(e) => setFilters({...filters, mar: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Categorías</Label>
              <Input 
                placeholder="Categorías por coma" 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                value={filters.cat}
                onChange={(e) => setFilters({...filters, cat: e.target.value})}
              />
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4" 
              onClick={handleFetch}
              disabled={loading}
            >
              {loading ? <div className="flex items-center gap-2"><Send className="w-4 h-4 animate-spin" /> Consultando...</div> : "Consultar Catálogo"}
            </Button>
          </CardContent>
        </Card>

        {/* Debugger Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3">
                <CardTitle className="text-xs uppercase flex items-center gap-2 text-blue-400">
                  <Code className="w-3 h-3" />
                  Payload Enviado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <pre className="p-4 text-[10px] font-mono text-blue-300 overflow-x-auto max-h-48 custom-scrollbar">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución..."}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-950 border-b border-slate-800 py-3">
                <CardTitle className="text-xs uppercase flex items-center gap-2 text-green-400">
                  <Server className="w-3 h-3" />
                  Respuesta Recibida
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <pre className="p-4 text-[10px] font-mono text-green-300 overflow-x-auto max-h-48 custom-scrollbar">
                  {response ? JSON.stringify(response, null, 2) : "// Esperando respuesta..."}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Status Alert */}
          {statusInfo && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
              statusInfo.estatus === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              {statusInfo.estatus === 0 ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
              <div>
                <h4 className={`font-bold ${statusInfo.estatus === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Status {statusInfo.estatus}: {statusInfo.cestatus}
                </h4>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span>Solicitud: {statusInfo.data_sol}</span>
                  <span>Elementos: {statusInfo.element}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados Table */}
      {products.length > 0 && (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-900/50">
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="w-5 h-5 text-blue-500" />
              Productos Encontrados ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950">
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">SKU</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                  <TableHead className="text-slate-400">Saldo Total</TableHead>
                  <TableHead className="text-slate-400">Saldos por Tienda</TableHead>
                  <TableHead className="text-slate-400">Variantes</TableHead>
                  <TableHead className="text-slate-400 text-right">Checksum (CRC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p: any, i: number) => {
                  const status = getStatusLabel(p.sta);
                  return (
                    <TableRow key={i} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-mono text-white">{p.sku}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${status.class}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-blue-400">{p.sal}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.slj?.map((store: any, idx: number) => {
                            const storeId = Object.keys(store)[0];
                            const stock = store[storeId];
                            return (
                              <Badge key={idx} variant="secondary" className="bg-slate-800 text-[10px]">
                                Loja {storeId}: {stock}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-500 text-xs italic">
                          {p.grd?.length || 0} variantes
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10px] text-slate-500">{p.crc}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && !loading && response && (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-slate-400 font-medium">No se encontraron productos con estos criterios</h3>
          <p className="text-slate-600 text-sm">Prueba ajustando los filtros o consultando sin parámetros.</p>
        </div>
      )}
    </div>
  );
}
