"use client";

import React, { useState } from "react";
import { 
  DollarSign, 
  Code, 
  Server, 
  Terminal, 
  Activity, 
  RefreshCw, 
  Box, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Store,
  Percent,
  TrendingUp,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StoreStock {
  [key: string]: number;
}

interface ProductStatus {
  sku: string;
  sal: string | number; // Saldo actual
  pre: string | number; // Precio actual
  atv: string | number; // Estado 0-Inactivo 1-Activo
  slj: StoreStock[];   // Saldos por tienda
  promo: string | number; // Promoción activa
  precopromo: string | number; // Precio promocional
  nom?: string; // Descripción opcional
}

export default function Operacion98Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [nomEnabled, setNomEnabled] = useState(true);

  const handleFetch = async () => {
    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 98,
      nom: nomEnabled ? 1 : 0
    };

    // Enmascaramos credenciales para el visor de payload
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
  const products: ProductStatus[] = isArray ? response.slice(1) : [];

  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0" : num.toLocaleString("es-PY");
  };

  const getStoreName = (id: string) => {
    switch (id) {
      case "1": return "CDE";
      case "3": return "ASU";
      default: return `L${id}`;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Saldos, Precios y Activos</h2>
          <p className="text-slate-400 mt-1">Snapshot comercial masivo: existencias, precios y estados de vigencia.</p>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-emerald-500/50 text-emerald-400 font-mono text-xs bg-emerald-500/10 uppercase tracking-widest">
          OPE_ID: 98
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-2 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-xs flex items-center gap-2 text-white font-black uppercase tracking-widest">
                <Terminal className="w-4 h-4 text-emerald-500" />
                Configuración Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between space-x-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Traer Nombres</Label>
                  <p className="text-[9px] text-slate-500 italic">Incluye descripción del ítem (nom)</p>
                </div>
                <Switch 
                  checked={nomEnabled}
                  onCheckedChange={setNomEnabled}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 border-b-4 border-emerald-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <TrendingUp className="w-5 h-5 mr-2" />}
                SINCRONIZAR ESTADOS
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="p-4 space-y-3 text-[10px] text-slate-500 leading-relaxed uppercase font-bold italic">
               <div className="flex items-center gap-2 text-emerald-500">
                 <Info className="w-3 h-3" />
                 <span>Nota Operativa</span>
               </div>
               <p>Esta operación es de alto rendimiento ya que consolida el estado global de activos y precios en una sola trama de datos.</p>
            </CardContent>
          </Card>
        </div>

        {/* Consolas y Tabla */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3 text-blue-400" /> JSON_OUTBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Prepare parámetros y sincronice..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" /> JSON_INBOUND
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Esperando respuesta del servidor..."}
                </pre>
              </div>
            </div>
          </div>

          {statusInfo && (
            <Card className="bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-xl animate-in slide-in-from-top-4 duration-500">
              <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    {statusInfo.estatus === 0 || statusInfo.estatus === "0" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      Status {statusInfo.estatus}: {statusInfo.cestatus}
                    </span>
                 </div>
                 <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-800 uppercase">
                   Items Recibidos: {statusInfo.element}
                 </Badge>
              </div>

              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/30">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-6 w-[120px]">SKU / Estado</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Producto</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">Saldo</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right">Precio Actual</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right">Precio Promo</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-500">Distribución</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? products.map((prod, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-slate-800/40 transition-colors group">
                        <TableCell className="pl-6">
                           <div className="flex flex-col gap-1.5">
                             <span className="font-mono text-blue-400 font-bold text-xs">{prod.sku}</span>
                             <Badge className={`text-[8px] font-black uppercase tracking-tighter w-fit ${prod.atv == 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {prod.atv == 1 ? 'ACTIVO' : 'INACTIVO'}
                             </Badge>
                           </div>
                        </TableCell>
                        <TableCell>
                           <span className="text-xs font-bold text-white uppercase leading-tight">
                             {prod.nom ? decodeURIComponent(prod.nom) : <span className="text-slate-700 italic">Nombre no solicitado</span>}
                           </span>
                        </TableCell>
                        <TableCell className="text-center font-black text-white text-base">
                           {prod.sal}
                        </TableCell>
                        <TableCell className="text-right">
                           <span className="font-bold text-slate-300 font-mono text-xs">
                             ₲ {formatCurrency(prod.pre)}
                           </span>
                        </TableCell>
                        <TableCell className="text-right">
                           {Number(prod.precopromo) > 0 ? (
                             <div className="flex flex-col items-end">
                                <span className="text-emerald-400 font-black text-xs italic animate-pulse">₲ {formatCurrency(prod.precopromo)}</span>
                                <Badge variant="outline" className="border-emerald-500/20 text-[8px] font-black py-0 px-1 mt-1 text-emerald-500/50">PROMO_{prod.promo}</Badge>
                             </div>
                           ) : (
                             <span className="text-slate-800 text-[10px]">—</span>
                           )}
                        </TableCell>
                        <TableCell className="pr-6">
                           <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(prod.slj) ? prod.slj.map((store, sIdx) => {
                                const storeId = Object.keys(store)[0];
                                const stock = store[storeId];
                                return (
                                  <div key={sIdx} className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    <span className="text-slate-500">{getStoreName(storeId)}:</span>
                                    <span className="text-blue-400">{stock}</span>
                                  </div>
                                );
                              }) : <span className="text-slate-800 text-[10px]">N/A</span>}
                           </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-600 italic text-sm">
                           Sin datos de productos activos para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!loading && !response && (
            <div className="text-center py-28 bg-slate-900/20 rounded-[50px] border-4 border-dashed border-slate-800">
               <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-slate-800 mb-6 shadow-2xl shadow-emerald-900/10">
                 <DollarSign className="w-10 h-10 text-slate-700" />
               </div>
               <h3 className="text-slate-500 text-lg font-black uppercase tracking-tighter">Terminal Comercial de Fastrax</h3>
               <p className="text-slate-600 text-xs max-w-xs mx-auto mt-2 leading-relaxed font-bold uppercase italic">
                 Sincronice para auditar precios normales, promocionales y saldos reales distribuidos por sucursal.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
