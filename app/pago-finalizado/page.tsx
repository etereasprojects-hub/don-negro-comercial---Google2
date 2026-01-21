"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";

function PagoFinalizadoContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "pending">("pending");
  
  // Capturamos el hash probando los nombres más comunes usados por Pagopar
  const hashId = searchParams.get("id") || searchParams.get("hash") || searchParams.get("token");

  useEffect(() => {
    // Validamos que exista un hash y que no sea el placeholder del panel de control
    if (hashId && hashId !== "$hash" && hashId !== "$HASH") {
      setStatus("success");
    } else {
      // Si entramos sin hash real, esperamos un momento por si es una redirección lenta
      const timer = setTimeout(() => {
        if (!hashId || hashId.includes("$")) setStatus("error");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hashId]);

  return (
    <div className="container mx-auto px-4 max-w-2xl text-center">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
        {status === "success" ? (
          <>
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Procesado!</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Hemos recibido la confirmación de tu transacción. Un asesor de Don Negro Comercial se pondrá en contacto contigo pronto para coordinar la entrega.
              <span className="block mt-4 text-xs text-gray-400 font-mono">ID de Transacción: {hashId}</span>
            </p>
          </>
        ) : status === "error" ? (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Estado Pendiente</h1>
            <p className="text-gray-600 mb-8 text-lg">
              No hemos podido verificar el pago automáticamente. Si ya realizaste la transferencia, no te preocupes, validaremos tu pedido manualmente con el comprobante.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Clock size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verificando Pago...</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Estamos conectando con Pagopar para confirmar tu pedido. Por favor, no cierres esta ventana.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto px-8">
              Seguir comprando
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
          <div className="container mx-auto px-4 text-center">
            <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles...</p>
          </div>
        }>
          <PagoFinalizadoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
