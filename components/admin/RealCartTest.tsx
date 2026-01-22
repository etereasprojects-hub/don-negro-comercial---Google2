
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Minus, Plus, CreditCard, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RealCartTest() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "Tester Pagopar",
    email: "tester@example.com",
    phone: "0981000000",
    address: "Calle de prueba 123",
    documento: "1234567",
  });

  const handleRealCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    setLoading(true);
    try {
      // 1. Guardar el pedido internamente primero
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerData.name,
            customer_email: customerData.email,
            customer_phone: customerData.phone,
            customer_address: customerData.address,
            items: items,
            total: total,
            status: "pendiente",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Llamar al API Route interno de Next.js (Integración Real v1.1)
      const response = await fetch('/api/pagopar/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          customer: customerData,
          items: items
        })
      });

      const payData = await response.json();

      if (!response.ok || !payData?.url) {
        console.error("Error Real Pagopar:", payData);
        alert(`Error Real: ${payData.details || payData.error}`);
        return;
      }

      localStorage.setItem('last_pagopar_hash', payData.hash);
      clearCart();
      window.location.href = payData.url;
      
    } catch (error: any) {
      console.error("Error Real Checkout:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart size={20} />
            Carrito para Pruebas Reales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400">
              Agrega productos desde el catálogo público para probar aquí.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded relative">
                    {item.imagen_url && <Image src={item.imagen_url} alt={item.nombre} fill className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{item.nombre}</h4>
                    <p className="text-xs text-pink-600">₲ {item.precio.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.cantidad - 1)}><Minus size={12} /></Button>
                      <span className="text-xs">{item.cantidad}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.cantidad + 1)}><Plus size={12} /></Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-pink-600">₲ {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <AlertCircle size={20} />
            Configuración del Test (Pagopar Real)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRealCheckout} className="space-y-4">
             <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
               Este formulario usa la API v1.1 real de Pagopar. Al pagar, se creará un pedido real en el dashboard.
             </div>
             <div>
               <Label>Nombre</Label>
               <Input value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} />
             </div>
             <div>
               <Label>C.I.</Label>
               <Input value={customerData.documento} onChange={e => setCustomerData({...customerData, documento: e.target.value})} />
             </div>
             <div>
               <Label>Email</Label>
               <Input type="email" value={customerData.email} onChange={e => setCustomerData({...customerData, email: e.target.value})} />
             </div>
             <div>
               <Label>Teléfono</Label>
               <Input value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} />
             </div>
             <div>
               <Label>Dirección</Label>
               <Input value={customerData.address} onChange={e => setCustomerData({...customerData, address: e.target.value})} />
             </div>
             <Button type="submit" disabled={loading || items.length === 0} className="w-full bg-blue-600 hover:bg-blue-700">
               {loading ? "Conectando con Pagopar..." : "Probar Integración Real"}
             </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
