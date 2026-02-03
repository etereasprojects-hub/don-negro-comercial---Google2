"use client";

import React, { useState } from "react";
import { Send, Plus, Trash2, Code, Server, Terminal, Activity, ShoppingCart, Package, AlertCircle, RefreshCw, ShoppingBag, Info, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  tiendas: any[];
}

export default function Operacion12Page() {
  // Form States
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [orderHeader, setOrderHeader] = useState({ ped: "", pgt: "1" });
  const [items, setItems] = useState<OrderItem[]>([{ sku: "", gra: "", qtd: "1" }]);

  // Catalog States (Integration Test)
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);

  const addItem = () => {
    setItems([...items, { sku: "", gra: "", qtd: "1" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
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

  const fetchFullCatalog = async () => {
    setLoadingCatalog(true);
    try {
      // 1. OPE 1: Obtener lista de SKUs y Stock actual
      const res1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" }) // Solo no bloqueados
      });
      const data1 = await res1.json();
      if (!Array.isArray(data1)) throw new Error("OPE 1 falló");
      
      const basicList = data1.slice(1);
      const skus = basicList.map((p: any) => p.sku).slice(0, 20).join(","); // Limitamos a 20 para la prueba

      // 2. OPE 2: Obtener Detalles completos de esos SKUs
      const res2 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 2, sku: skus })
      });
      const data2 = await res2.json();
      if (!Array.isArray(data2)) throw new Error("OPE 2 falló");

      const detailsList = data2.slice(1);

      // 3. Cruzar datos
      const merged: CatalogProduct[] = detailsList.map((detail: any) => {
        const basic = basicList.find((b: any) => b.sku === detail.sku);
        return {
          sku: detail.sku,
          nombre: decodeURIComponent(detail.nom || "Sin Nombre"),
          descripcion: decodeURIComponent(detail.bre || ""),
          precio: detail.pre,
          stock: basic?.sal || "0",
          tiendas: basic?.slj || []
        };
      });

      setCatalog(merged);
    } catch (error: any) {
      alert("Error sincronizando catálogo: " + error.message);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleFetch = async () => {
    if (items.some(i => !i.sku.trim())) {
      alert("Todos los SKUs son obligatorios.");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    const payload = {
      ope: 12,
      ped: orderHeader.ped,
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
      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      setResponse({ estatus: 99, cestatus: `Error local: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header Form */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Enviar Pedido</h2>
          <p className="text-slate-400 mt-1">Gestión avanzada de órdenes con integración de catálogo.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-pink-500/50 text-pink-400 font-mono text-xs bg-pink-500/5">
          OPERATION_ID: 12
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Formulario */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Terminal className="w-4 h-4 text-pink-500" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ID Ecommerce</Label>
                <Input 
                  placeholder="Opcional..." 
                  className="bg-slate-950 border-slate-800 text-white"
                  value={orderHeader.ped}
                  onChange={(e) => setOrderHeader({...orderHeader, ped: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pago</Label>
                <Select value={orderHeader.pgt} onValueChange={(val) => setOrderHeader({...orderHeader, pgt: val})}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="1">1 - Tarjeta</SelectItem>
                    <SelectItem value="2">2 - Boleta</SelectItem>
                    <SelectItem value="3">3 - Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-12 shadow-lg shadow-pink-900/20" 
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar a Fastrax
          </Button>
        </div>

        {/* Formulario de Items */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Items de la Orden
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-[10px] uppercase font-bold bg-slate-900 border-slate-700 hover:bg-slate-800">
                <Plus className="w-3 h-3 mr-1" /> Nueva Fila
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/50">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-500 text-[10px] uppercase font-bold">SKU *</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-bold">Grade</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-bold w-[120px]">Cantidad</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800/50 hover:bg-slate-800/30">
                      <TableCell>
                        <Input 
                          placeholder="Ingrese SKU" 
                          className="bg-slate-950 border-slate-800 text-xs h-8 text-blue-400 font-bold"
                          value={item.sku}
                          onChange={(e) => updateItem(idx, "sku", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Ej: 40|Azul" 
                          className="bg-slate-950 border-slate-800 text-xs h-8"
                          value={item.gra}
                          onChange={(e) => updateItem(idx, "gra", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          min="1"
                          className="bg-slate-950 border-slate-800 text-xs h-8"
                          value={item.qtd}
                          onChange={(e) => updateItem(idx, "qtd", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length === 1} className="text-slate-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Consolas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 ml-2">JSON Enviado</div>
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 min-h-[100px] max-h-[100px] overflow-auto">
                <pre className="text-[10px] font-mono text-blue-300">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Pendiente"}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 ml-2">Respuesta API</div>
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 min-h-[100px] max-h-[100px] overflow-auto">
                <pre className="text-[10px] font-mono text-green-300">
                  {response ? JSON.stringify(response, null, 2) : "// Sin datos"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN NUEVA: EXPLORADOR DE CATÁLOGO */}
      <div className="border-t border-slate-800 pt-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              Explorador de Catálogo (Sincronización OPE 1+2)
            </h3>
            <p className="text-xs text-slate-500 italic">Prueba simultánea de consultas y carga asistida.</p>
          </div>
          <Button 
            onClick={fetchFullCatalog} 
            disabled={loadingCatalog}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold"
          >
            {loadingCatalog ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sincronizar y Cargar Catálogo Completo
          </Button>
        </div>

        {catalog.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {catalog.map((prod, idx) => (
              <Card key={idx} className="bg-slate-900 border-slate-800 hover:border-blue-500/30 transition-all group shadow-lg">
                <CardContent className="p-4 flex gap-4">
                   <div className="w-24 h-24 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 shrink-0">
                      <ImageIcon className="w-8 h-8 text-slate-700 group-hover:text-blue-500 transition-colors" />
                   </div>
                   <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[9px] text-blue-400 bg-blue-500/5">{prod.sku}</Badge>
                        <span className="text-emerald-400 font-black text-sm">₲ {Number(prod.precio).toLocaleString("es-PY")}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{prod.nombre}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{prod.descripcion}</p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-slate-600" />
                          <span className="text-[10px] font-bold text-slate-400">Stock: <b className="text-white">{prod.stock}</b></span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => loadProductToOrder(prod.sku)}
                          className="h-7 text-[10px] bg-slate-800 hover:bg-blue-600 text-white font-bold"
                        >
                          🛒 Cargar en Pedido
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
             {loadingCatalog ? (
               <div className="space-y-4">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Consultando Fastrax API...</p>
                  <p className="text-slate-600 text-[10px]">Combinando Operaciones 1 y 2 para datos detallados.</p>
               </div>
             ) : (
               <div className="space-y-3">
                  <Info className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-slate-500 text-sm">Presiona el botón superior para explorar los productos disponibles.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
