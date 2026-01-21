"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";

export default function PagoFinalizadoPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "pending">("pending");
  const orderId = searchParams.get("id");

  useEffect(() => {
    // Pagopar suele enviar parámetros en la URL al retornar
    // Aquí podríamos validar el estado real consultando a nuestra DB
    // Por ahora mostramos un mensaje general basado en la redirección
    setStatus("success");
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
            {status === "success" ? (
              <>
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Gracias por tu compra!</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Tu pedido ha sido procesado exitosamente. Recibirás un correo de confirmación a la brevedad con los detalles de la entrega.
                </p>
              </>
            ) : status === "error" ? (
              <>
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Hubo un problema</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  No pudimos procesar el pago correctamente. Por favor, intenta de nuevo o contacta con nuestro soporte.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Clock size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Procesando...</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Estamos verificando el estado de tu transacción.
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/productos">
                <Button variant="outline" className="w-full sm:w-auto px-8">
                  Seguir Comprando
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full sm:w-auto px-8 bg-pink-600 hover:bg-pink-700">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
