
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Minus, Plus, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface CartProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function Cart({ open: controlledOpen, onOpenChange, hideTrigger }: CartProps = {}) {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    documento: "",
  });

  const handleGoToDemoPayment = (e: React.FormEvent) => {
    e.preventDefault();
    // Guardamos datos temporales para la demo
    localStorage.setItem("demo_customer", JSON.stringify(customerData));
    localStorage.setItem("demo_total", total.toString());
    
    setIsOpen(false);
    router.push("/checkout-ficticio");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button className="hidden md:block fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg bg-orange-500 hover:bg-orange-600 z-50">
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                {items.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>

        {!showCheckout ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tu carrito está vacío</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded relative flex-shrink-0">
                      {item.imagen_url ? (
                        <Image
                          src={item.imagen_url}
                          alt={item.nombre}
                          fill
                          sizes="80px"
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.nombre}</h3>
                      <p className="text-pink-600 font-bold">
                        ₲ {item.precio.toLocaleString("es-PY")}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.cantidad}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-pink-600">₲ {total.toLocaleString("es-PY")}</span>
                </div>
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  onClick={() => setShowCheckout(true)}
                >
                  Proceder al Checkout
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleGoToDemoPayment} className="py-4 space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-4 flex items-center gap-3">
              <ShieldCheck className="text-green-600" size={20} />
              <p className="text-xs text-green-800">Estás en un entorno de pago seguro y cifrado.</p>
            </div>
            <div>
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                required
                placeholder="Nombre y Apellido"
              />
            </div>
            <div>
              <Label htmlFor="documento">Cédula de Identidad *</Label>
              <Input
                id="documento"
                value={customerData.documento}
                onChange={(e) => setCustomerData({ ...customerData, documento: e.target.value.replace(/\D/g, '') })}
                required
                placeholder="Ej: 1234567"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                required
                placeholder="09xx xxx xxx"
              />
            </div>
            <div>
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                required
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="address">Dirección de Entrega *</Label>
              <Input
                id="address"
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                required
                placeholder="Ciudad, Calle y Nro de Casa"
              />
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between font-bold">
                <span>Total a Pagar:</span>
                <span className="text-pink-600">₲ {total.toLocaleString("es-PY")}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCheckout(false)}
                className="flex-1"
              >
                Volver
              </Button>
              <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700">
                Pagar Ahora
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
