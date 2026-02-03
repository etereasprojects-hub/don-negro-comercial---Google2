"use client";

import React, { useState } from "react";
import { Send, Plus, Trash2, Code, Server, Terminal, Activity, ShoppingCart, CreditCard, Package, AlertCircle } from "lucide-react";
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

export default function Operacion12Page() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);
  
  const [orderHeader, setOrderHeader] = useState({
    ped: "",
    pgt: "1"
  });

  const [items, setItems] = useState<OrderItem[]>([
    { sku: "", gra: "", qtd: "1" }
  ]);

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

  const handleFetch = async () => {
    // Validar ítems
    if (items.some(i => !i.sku.trim())) {
      alert("Todos los SKUs son obligatorios.");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    // Transformar ítems a strings separados por coma
    const skuString = items.map(i => i.sku.trim()).join(",");
    const graString = items.map(i => i.gra.trim()).join(",");
    const qtdString = items.map(i => i.qtd.trim()).join(",");

    const payload = {
      ope: 12,
      ped: orderHeader.ped,
      sku: skuString,
      gra: graString,
      qtd: qtdString,
      pgt: orderHeader.pgt
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
  const resultData = isArray && response.length > 1 ? response[1] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Enviar Pedido</h2>
          <p className="text-slate-400 mt-1">Crea una orden de compra directamente en el sistema de Fastrax.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 border-pink-500/50 text-pink-400 font-mono text-xs bg-pink-500/5">
          OPERATION_ID: 12
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuración de Pedido */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Terminal className="w-4 h-4 text-pink-500" />
                Cabecera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Orden Ecommerce (Opcional)</Label>
                <Input 
                  placeholder="ID pedido web..." 
                  className="bg-slate-950 border-slate-800 text-white"
                  value={orderHeader.ped}
                  onChange={(e) => setOrderHeader({...orderHeader, ped: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Método de Pago</Label>
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

        {/* Detalle de Productos */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-950/50 border-b border-slate-800 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Ítems del Pedido
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-[10px] uppercase font-bold bg-slate-900 border-slate-700 hover:bg-slate-800">
                <Plus className="w-3 h-3 mr-1" /> Agregar Fila
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-950/50">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-500 text-[10px] uppercase font-bold">SKU *</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-bold">Grado (Grade)</TableHead>
                    <TableHead className="text-slate-500 text-[10px] uppercase font-bold w-[120px]">Cantidad</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800/50 hover:bg-slate-800/30">
                      <TableCell>
                        <Input 
                          placeholder="Código SKU" 
                          className="bg-slate-950 border-slate-800 text-xs h-8"
                          value={item.sku}
                          onChange={(e) => updateItem(idx, "sku", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Ej: 40|Blanco" 
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

          {/* Consola Técnica */}
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
                    {lastPayload ? JSON.stringify(lastPayload, null, 2) : "// Pendiente de envío..."}
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

          {/* Resultado de la Orden */}
          {resultData && (
            <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-pink-500 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
               <CardHeader className="bg-slate-950/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-pink-400" />
                      Orden Creada Exitosamente
                    </CardTitle>
                    <Badge className="bg-pink-600 text-white font-mono text-xs">#{resultData.ped}</Badge>
                  </div>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fecha de Emisión</p>
                        <p className="text-sm font-mono text-slate-300">{resultData.emi}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cantidad de Ítems</p>
                        <p className="text-sm font-bold text-white">{resultData.ite} productos</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valor Total</p>
                        <p className="text-xl font-black text-emerald-400">₲ {Number(resultData.val).toLocaleString("es-PY")}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
          )}

          {statusInfo && statusInfo.estatus !== 0 && statusInfo.estatus !== "0" && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
               <AlertCircle size={18} />
               <div className="text-sm">
                 <p className="font-bold">Error {statusInfo.estatus}</p>
                 <p className="text-xs opacity-80">{statusInfo.cestatus}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
