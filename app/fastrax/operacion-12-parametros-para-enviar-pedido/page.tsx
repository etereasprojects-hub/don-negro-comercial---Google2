"use client";

import React, { useState } from "react";
import { Send, Plus, Trash2, Code, Server, Terminal, Activity, ShoppingCart, Package, AlertCircle, RefreshCw, ShoppingBag, Info, Image as ImageIcon, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderItem {
  sku: string;
  gra: string;
  qtd: string;
}

interface CatalogProduct {
  sku: string;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
}

export default function Operacion12Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);

  const [orderHeader, setOrderHeader] = useState({ 
    ped: "", 
    pgt: "1",
    cli: "123456" 
  });
  
  const [items, setItems] = useState<OrderItem[]>([{ sku: "", gra: "", qtd: "1" }]);

  const addItem = () => setItems([...items, { sku: "", gra: "", qtd: "1" }]);
  
  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const loadProductToOrder = (sku: string) => {
    const emptyIndex = items.findIndex(item => !item.sku);
    if (emptyIndex !== -1) {
      updateItem(emptyIndex, "sku", sku);
    } else {
      setItems([...items, { sku, gra: "", qtd: "1" }]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFetch = async () => {
    if (items.some(i => !i.sku.trim())) {
      alert("Por favor ingrese todos los SKUs requeridos.");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 12,
      ped: orderHeader.ped,
      cli: orderHeader.cli,
      sku: items.map(i => i.sku.trim()).join(","),
      gra: items.map(i => i.gra.trim()).join(","),
      qtd: items.map(i => i.qtd.trim()).join(","),
      pgt: orderHeader.pgt
    };

    setLastPayload({ cod: "42352", pas: "*********", ...payload });

    try {
      const res = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error de red: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchFullCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const r1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const d1 = await r1.json();
      if (!Array.isArray(d1)) throw new Error("OPE 1 Falló");

      const skus = d1.slice(1, 11).map((p: any) => p.sku).join(",");
      const r2 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 2, sku: skus })
      });
      const d2 = await r2.json();
      if (!Array.isArray(d2)) throw new Error("OPE 2 Falló");

      const merged = d2.slice(1).map((det: any) => {
        const bas = d1.find((b: any) => b.sku === det.sku);
        return {
          sku: det.sku,
          nombre: decodeURIComponent(det.nom || "Sin Nombre"),
          descripcion: decodeURIComponent(det.bre || ""),
          precio: det.pre,
          stock: bas?.sal || "0"
        };
      });
      setCatalog(merged);
    } catch (e: any) {
      alert("Catálogo error: " + e.message);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Contrast Safe Inputs Style
  const inputClass = "bg-slate-950 border-slate-600 text-slate-50 h-11 placeholder:text-slate-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-bold";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Operación 12: Enviar Pedido</h2>
          <p className="text-slate-400 font-medium">Inyección directa de órdenes al ERP de Fastrax.</p>
        </div>
        <Badge variant="outline" className="px-6 py-2 border-pink-500/50 text-pink-400 font-mono text-xs bg-pink-500/10">
          SYSTEM_OP: 0x12
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-700 shadow-2xl overflow-hidden border-2">
            <CardHeader className="bg-slate-950/80 border-b border-slate-700 p-4">
              <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4 text-pink-500" />
                Configuración Global
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">ID Cliente</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                  <Input 
                    className={`${inputClass} pl-10`}
                    value={orderHeader.cli}
                    onChange={(e) => setOrderHeader({...orderHeader, cli: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">ID Ecommerce</Label>
                <Input 
                  className={inputClass}
                  placeholder="ID Pedido Externo"
                  value={orderHeader.ped}
                  onChange={(e) => setOrderHeader({...orderHeader, ped: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Método de Pago</Label>
                <Select value={orderHeader.pgt} onValueChange={(val) => setOrderHeader({...orderHeader, pgt: val})}>
                  <SelectTrigger className="bg-slate-950 border-slate-600 text-slate-50 font-bold h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="1">1 - Tarjeta</SelectItem>
                    <SelectItem value="2">2 - Boleta</SelectItem>
                    <SelectItem value="3">3 - Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black h-14 shadow-lg shadow-pink-900/40 transition-all active:scale-95 text-base border-b-4 border-pink-800" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <Activity className="w-6 h-6 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                ENVIAR A FASTRAX
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-900 border-slate-700 shadow-xl overflow-hidden border-2">
            <CardHeader className="bg-slate-950/80 border-b border-slate-700 py-3 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Matriz de Productos
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addItem} 
                className="h-8 text-[10px] uppercase font-black bg-slate-800 border-slate-600 hover:bg-blue-600 text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Fila Nueva
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/50">
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300 text-[10px] uppercase font-black px-6">SKU (Obligatorio)</TableHead>
                    <TableHead className="text-slate-300 text-[10px] uppercase font-black">Grado (Variante)</TableHead>
                    <TableHead className="text-slate-300 text-[10px] uppercase font-black w-[150px]">Cantidad</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                      <TableCell className="px-6">
                        <Input 
                          placeholder="Código SKU" 
                          className="bg-slate-950 border-slate-700 text-blue-400 text-sm h-10 font-black focus:border-blue-500"
                          value={item.sku}
                          onChange={(e) => updateItem(idx, "sku", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Ej: 40 o Blanco" 
                          className="bg-slate-950 border-slate-700 text-slate-200 text-sm h-10 focus:border-blue-500"
                          value={item.gra}
                          onChange={(e) => updateItem(idx, "gra", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          min="1"
                          className="bg-slate-950 border-slate-700 text-slate-50 text-sm h-10 font-bold focus:border-blue-500"
                          value={item.qtd}
                          onChange={(e) => updateItem(idx, "qtd", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(idx)} 
                          disabled={items.length === 1} 
                          className="text-slate-600 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> Dump Payload (Salida)
              </Label>
              <div className="bg-slate-950 border-2 border-slate-800 p-5 rounded-2xl h-[160px] overflow-auto shadow-inner">
                <pre className="text-[11px] font-mono text-blue-400 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// No se ha disparado ninguna petición..."}
                </pre>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> API Response (Entrada)
              </Label>
              <div className="bg-slate-950 border-2 border-slate-800 p-5 rounded-2xl h-[160px] overflow-auto shadow-inner relative">
                {loading && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10">
                    <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                  </div>
                )}
                <pre className="text-[11px] font-mono text-emerald-400 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// Esperando datos del servidor..."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-12 space-y-8">
        <div className="bg-gradient-to-r from-blue-900/40 to-slate-950 p-8 rounded-3xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 uppercase italic">
              <ShoppingBag className="w-6 h-6 text-blue-400" />
              Sincronizador Automático de Catálogo
            </h3>
            <p className="text-slate-400 font-medium max-w-xl">
              Consulta en tiempo real el inventario disponible de Fastrax y cárgalo instantáneamente al panel de envío.
            </p>
          </div>
          <Button 
            onClick={fetchFullCatalog} 
            disabled={loadingCatalog}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-3 font-black px-8 py-7 shadow-2xl shadow-blue-900/50 text-lg border-b-4 border-blue-800 transition-all active:scale-95"
          >
            {loadingCatalog ? <RefreshCw className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
            SINCRONIZAR INVENTARIO
          </Button>
        </div>

        {catalog.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {catalog.map((prod, idx) => (
              <Card key={idx} className="bg-slate-900 border-slate-700 hover:border-blue-500/50 transition-all group shadow-2xl border-2">
                <CardContent className="p-5 flex gap-5">
                   <div className="w-24 h-24 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-700 shrink-0">
                      <ImageIcon className="w-10 h-10 text-slate-800 group-hover:text-blue-500 transition-colors" />
                   </div>
                   <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border-blue-500/30 font-bold">{prod.sku}</Badge>
                        <span className="text-emerald-400 font-black text-sm tracking-tighter">₲ {Number(prod.precio).toLocaleString("es-PY")}</span>
                      </div>
                      <h4 className="text-sm font-black text-white truncate uppercase italic">{prod.nombre}</h4>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Stock: <b className="text-white ml-1">{prod.stock}</b></span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => loadProductToOrder(prod.sku)}
                          className="h-8 text-[10px] bg-slate-800 hover:bg-emerald-600 text-white font-black px-4 border border-slate-700"
                        >
                          AUTO-CARGAR
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-950/30 rounded-[40px] border-4 border-dashed border-slate-800">
             {loadingCatalog ? (
               <div className="space-y-6">
                  <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto opacity-50" />
                  <div className="space-y-2">
                    <p className="text-slate-200 font-black uppercase tracking-widest text-lg italic">Procesando Flujo OPE_1 + OPE_2</p>
                    <p className="text-slate-600 font-medium">Cruzando saldos de almacén con fichas técnicas...</p>
                  </div>
               </div>
             ) : (
               <div className="space-y-6">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-800 shadow-2xl shadow-blue-900/20">
                    <Info className="w-10 h-10 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-400 text-lg font-black uppercase tracking-tighter">Explorador Desactivado</p>
                    <p className="text-slate-600 text-sm max-w-sm mx-auto">Sincroniza el catálogo para ver los productos disponibles y evitar la carga manual de SKUs.</p>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}