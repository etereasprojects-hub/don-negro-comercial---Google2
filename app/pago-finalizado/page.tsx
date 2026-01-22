"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2, ShoppingBag, Info } from "lucide-react";

/**
 * Componente principal que maneja la lógica de verificación tras la redirección de Pagopar.
 */
function PagoFinalizadoContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
  const [message, setMessage] = useState("Verificando transacción...");
  const [paymentInfo, setPaymentInfo] = useState<{titulo: string, descripcion: string} | null>(null);
  
  // Pagopar envía el hash en la URL especificada: ?hash=($hash)
  const hash = searchParams.get("hash");

  useEffect(() => {
    async function verify() {
      // Validamos que el hash no sea un placeholder
      if (!hash || hash === "($hash)" || hash === "$hash") {
        setStatus("failed");
        setMessage("No se recibió una referencia de pago válida.");
        return;
      }

      try {
        const response = await fetch("/api/pagopar/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash })
        });

        const data = await response.json();

        if (data.status === "paid") {
          setStatus("success");
          setMessage("¡Pago confirmado! Tu pedido está siendo procesado.");
        } else if (data.status === "pending") {
          setStatus("pending");
          setMessage(data.message || "Tu pago está pendiente de aprobación.");
          setPaymentInfo(data.paymentInfo); // Instrucciones para efectivo (Pago Express, etc)
        } else {
          setStatus("failed");
          setMessage(data.message || "La transacción no pudo ser validada.");
        }
      } catch (error) {
        console.error("Error verify:", error);
        setStatus("failed");
        setMessage("Ocurrió un error al conectar con la pasarela.");
      }
    }

    verify();
  }, [hash]);

  return (
    <div className="container mx-auto px-4 max-w-2xl text-center py-12">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h1 className="text-2xl font-bold mb-2">Validando con Pagopar</h1>
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Muchas Gracias!</h1>
            <p className="text-gray-600 mb-8 text-lg">{message}</p>
          </div>
        )}

        {status === "pending" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
              <Clock size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {paymentInfo?.titulo || "Pago en Proceso"}
            </h1>
            <p className="text-gray-600 mb-6 text-lg">{message}</p>
            
            {paymentInfo?.descripcion && (
              <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left mb-8">
                <div className="flex items-center gap-2 text-blue-800 font-bold mb-3">
                  <Info size={18} />
                  <span>Instrucciones para completar el pago:</span>
                </div>
                <div 
                  className="text-gray-700 text-sm prose prose-sm max-w-none 
                    [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 
                    [&>li]:mb-1 [&>strong]:text-blue-900"
                  dangerouslySetInnerHTML={{ __html: paymentInfo.descripcion }}
                />
              </div>
            )}
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <XCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verificación Fallida</h1>
            <p className="text-gray-600 mb-8 text-lg">{message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 pt-8 border-t">
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto px-8">
              Ver otros productos
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto px-8 bg-[#D91E7A] hover:bg-[#6B4199]">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ir al Inicio
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
        <Suspense fallback={null}>
          <PagoFinalizadoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}