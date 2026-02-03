"use client";

import React, { useState } from "react";
import { Send, Plus, Trash2, Code, Server, Terminal, Activity, ShoppingCart, Package, AlertCircle, RefreshCw, ShoppingBag, Info, Image as ImageIcon, UserCheck } from "lucide-react";
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
  const [orderHeader, setOrderHeader] = useState({ 
    ped: "", 
    pgt: "1",
    cli: "123456" // Código de cliente por defecto para pruebas
  });
  const [items, setItems] = useState<OrderItem[]>([{ sku: "", gra: "", qtd: "1" }]);

  // Catalog States
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
      const res1 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 1, blo: "N" })
      });
      const data1 = await res1.json();
      if (!Array.isArray(data1)) throw new Error("OPE 1 falló");
      
      const basicList = data1.slice(1);
      const skus = basicList.map((p: any) => p.sku).slice(0, 15).join(",");

      const res2 = await fetch('/api/fastrax/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ope: 2, sku: skus })
      });
      const data2 = await res2.json();
      if (!Array.isArray(data2)) throw new Error("OPE 2 falló");

      const detailsList = data2.slice(1);

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
      console.error("Catalog Error:", error);
      alert("Error sincronizando catálogo: " + error.message);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleFetch = async () => {
    console.log("Iniciando envío de pedido...");
    
    if (items.some(i => !i.sku.trim())) {
      alert("Error: Ingrese al menos un SKU válido en la tabla de ítems.");
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
      
      const data = await res.json();
      console.log("Respuesta recibida:", data);
      setResponse(data);
    } catch (error: any) {
      console.error("API Fetch Error:", error);
      setResponse({ estatus: 99, cestatus: `Error de conexión: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-slate-100">
      {/* Header Form */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Enviar Pedido (OPE 12)</h2>
          <p className="text-slate-400 mt-1">Sincronización directa con el sistema de órdenes de Fastrax.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-pink-500/50 text-pink-400 font-mono text-xs bg-pink-500/5">
          OPE_ID: 12
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Formulario */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800">
              <CardTitle className="text-sm flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-pink-500" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Cliente (CLI)</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="Código cliente..." 
                    className="bg-slate-950 border-slate-700 text-white pl-10 h-11 focus:border-pink-500 transition-colors"
                    value={orderHeader.cli}
                    onChange={(e) => setOrderHeader({...orderHeader, cli: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">ID Ecommerce (PED)</Label>
                <Input 
                  placeholder="Opcional..." 
                  className="bg-slate-950 border-slate-700 text-white h-11 focus:border-pink-500 transition-colors"
                  value={orderHeader.ped}
                  onChange={(e) => setOrderHeader({...orderHeader, ped: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Método de Pago (PGT)</Label>
                <Select value={orderHeader.pgt} onValueChange={(val) => setOrderHeader({...orderHeader, pgt: val})}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-11 focus:ring-pink-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="1">1 - Tarjeta</SelectItem>
                    <SelectItem value="2">2 - Boleta</SelectItem>
                    <SelectItem value="3">3 - Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black h-12 shadow-lg shadow-pink-900/40 transition-all active:scale-95" 
                onClick={handleFetch}
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                ENVIAR A FASTRAX
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Items */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between py-4 px-6">
              <CardTitle className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-widest">
                <Package className="w-4 h-4 text-blue-500" />
                Ítems de la Orden
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addItem} 
                className="h-8 text-[10px] uppercase font-black bg-slate-800 border-slate-700 hover:bg-blue-600 text-white transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Nueva Fila
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black px-6">SKU (Obligatorio)</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black">Grado (Color/Talla)</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-black w-[120px]">Cantidad</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <TableCell className="px-6">
                        <Input 
                          placeholder="SKU" 
                          className="bg-slate-950 border-slate-700 text-white text-xs h-9 focus:border-blue-500 font-mono"
                          value={item.sku}
                          onChange={(e) => updateItem(idx, "sku", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Ej: 40|Azul" 
                          className="bg-slate-950 border-slate-700 text-white text-xs h-9 focus:border-blue-500"
                          value={item.gra}
                          onChange={(e) => updateItem(idx, "gra", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          min="1"
                          className="bg-slate-950 border-slate-700 text-white text-xs h-9 focus:border-blue-500"
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
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Consolas de Depuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Code className="w-3 h-3" /> JSON ENVIADO
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-blue-400/90 leading-tight">
                  {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Esperando ejecución de la orden..."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-black text-slate-500 ml-2 tracking-widest flex items-center gap-1">
                <Server className="w-3 h-3" /> RESPUESTA DEL SERVIDOR
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[120px] max-h-[120px] overflow-auto shadow-inner">
                <pre className="text-[10px] font-mono text-emerald-400/90 leading-tight">
                  {response ? JSON.stringify(response, null, 2) : "// No hay respuesta aún..."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: EXPLORADOR DE CATÁLOGO */}
      <div className="border-t border-slate-800 pt-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              Sincronización de Catálogo
            </h3>
            <p className="text-xs text-slate-500 font-medium italic">Obtén datos reales del inventario para evitar errores de carga manual.</p>
          </div>
          <Button 
            onClick={fetchFullCatalog} 
            disabled={loadingCatalog}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-black px-6 shadow-lg shadow-blue-900/30"
          >
            {loadingCatalog ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            SINCRONIZAR PRODUCTOS
          </Button>
        </div>

        {catalog.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {catalog.map((prod, idx) => (
              <Card key={idx} className="bg-slate-900 border-slate-800 hover:border-blue-500/40 transition-all group shadow-xl">
                <CardContent className="p-4 flex gap-4">
                   <div className="w-20 h-20 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 shrink-0">
                      <ImageIcon className="w-8 h-8 text-slate-700 group-hover:text-blue-500 transition-colors" />
                   </div>
                   <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[9px] text-blue-400 bg-blue-500/5 border-blue-500/20">{prod.sku}</Badge>
                        <span className="text-emerald-400 font-black text-xs">₲ {Number(prod.precio).toLocaleString("es-PY")}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{prod.nombre}</h4>
                      
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-400">Stock: <b className="text-white">{prod.stock}</b></span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => loadProductToOrder(prod.sku)}
                          className="h-7 text-[10px] bg-slate-800 hover:bg-emerald-600 text-white font-black px-3"
                        >
                          AGREGAR
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
             {loadingCatalog ? (
               <div className="space-y-4">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Conectando con Fastrax API...</p>
                    <p className="text-slate-600 text-[10px] font-medium">Ejecutando operaciones en cadena para obtener ficha técnica.</p>
                  </div>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                    <Info className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-sm font-bold">Catálogo Offline</p>
                    <p className="text-slate-600 text-xs">Presiona el botón superior para cargar productos disponibles.</p>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
