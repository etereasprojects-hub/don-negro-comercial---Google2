
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";

export default function CheckoutFicticio() {
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState("0");
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    const savedTotal = localStorage.getItem("demo_total");
    if (savedTotal) setTotal(savedTotal);
  }, []);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular procesamiento
    setTimeout(() => {
      clearCart();
      router.push("/pago-finalizado/demo-success");
    }, 3500);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center px-4">
        {loading ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative inline-block">
              <Loader2 className="w-20 h-20 text-pink-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Procesando Pago Seguro</h2>
              <p className="text-gray-500">Estamos validando tu tarjeta con la entidad bancaria...</p>
            </div>
          </div>
        ) : (
          <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-pink-600">
            <CardHeader className="text-center space-y-1">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-pink-50 rounded-full text-pink-600">
                  <CreditCard size={32} />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Confirme el pago</CardTitle>
              <p className="text-gray-500">Monto a pagar: <span className="font-bold text-pink-600">₲ {Number(total).toLocaleString("es-PY")}</span></p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePay} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Número de Tarjeta</Label>
                  <Input id="card-number" placeholder="0000 0000 0000 0000" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Vencimiento</Label>
                    <Input id="expiry" placeholder="MM/AA" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" type="password" maxLength={3} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-name">Nombre en la Tarjeta</Label>
                  <Input id="card-name" placeholder="Como figura en la tarjeta" required />
                </div>
                
                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 h-12 text-lg font-bold">
                    Confirmar Pago
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Lock size={12} />
                    Pago encriptado SSL de 256 bits
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </>
  );
}
