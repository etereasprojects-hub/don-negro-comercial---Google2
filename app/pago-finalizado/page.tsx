"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
/* Fixed: Corrected invalid package name 'lucide-center' to 'lucide-react' and consolidated icon imports. */
import { CheckCircle as CheckIcon, XCircle as ErrorIcon, Clock as ClockIcon, ShoppingBag } from "lucide-react";

function PagoFinalizadoContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "pending">("pending");
  
  // Capturamos el hash del parámetro 'hash' (syntax ($hash)) o 'id' (antigua)
  const hashId = searchParams.get("hash") || searchParams.get("id") || searchParams.get("token");

  useEffect(() => {
    // Verificamos si el hash existe y no es un placeholder literal ($hash, {$hash}, ($hash))
    const isPlaceholder = !hashId || 
                         hashId.includes("$hash") || 
                         hashId.includes("{$hash}") || 
                         hashId.includes("($hash)") ||
                         hashId === "($hash)";

    if (hashId && !isPlaceholder) {
      setStatus("success");
    } else {
      // Si no hay hash real, esperamos un momento por si es una redirección lenta
      const timer = setTimeout(() => {
        if (isPlaceholder) {
          setStatus("error");
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hashId]);

  return (
    <div className="container mx-auto px-4 max-w-2xl text-center">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
        {status === "success" ? (
          <>
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago en Proceso!</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Tu transacción ha sido registrada exitosamente. Un asesor de Don Negro Comercial validará tu pedido y se comunicará contigo para coordinar la entrega.
              {hashId && <span className="block mt-4 text-xs text-gray-400 font-mono">Ref: {hashId}</span>}
            </p>
          </>
        ) : status === "error" ? (
          <>
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ErrorIcon size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verificación Manual</h1>
            <p className="text-gray-600 mb-8 text-lg">
              No hemos podido detectar el hash de pago automáticamente, pero no te preocupes. Si completaste el pago, procesaremos tu pedido manualmente.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <ClockIcon size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Validando Transacción...</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Estamos conectando con la red de Pagopar para confirmar tu pago. Por favor espera.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto px-8">
              Ver más productos
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto px-8 bg-pink-600 hover:bg-pink-700">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoFinalizadoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-32 pb-20">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
          </div>
        }>
          <PagoFinalizadoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
