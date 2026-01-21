"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShoppingBag } from "lucide-react";

export default function PagoFinalizadoDinamico() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "pending">("pending");
  
  // Capturamos el hash ya sea de la ruta /pago-finalizado/VALOR o del query ?id=VALOR
  const hashId = params.id || searchParams.get("id");

  useEffect(() => {
    if (hashId && hashId !== "$HASH" && hashId !== "$hash") {
      setStatus("success");
    } else {
      // Si llegamos aquí sin un ID real, mostramos estado de verificación o error
      const timeout = setTimeout(() => {
        if (!hashId) setStatus("error");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [hashId]);

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
                <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Recibido!</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Tu pedido ha sido procesado. Un asesor de Don Negro Comercial se pondrá en contacto contigo a la brevedad.
                  <span className="block mt-4 text-xs text-gray-400 font-mono">Ref: {hashId}</span>
                </p>
              </>
            ) : status === "error" ? (
              <>
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Información Pendiente</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  No pudimos detectar automáticamente el comprobante de pago. Si ya realizaste la transferencia, no te preocupes, validaremos tu pedido manualmente.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Clock size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Validando Pago...</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Estamos esperando la confirmación de la pasarela.
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
      </main>
      <Footer />
    </>
  );
}
