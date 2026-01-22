"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2, ShoppingBag, Info } from "lucide-react";

function PagoFinalizadoContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
  const [message, setMessage] = useState("Verificando transacción...");
  const [paymentInfo, setPaymentInfo] = useState<{titulo: string, descripcion: string} | null>(null);
  
  // Limpiamos el hash de posibles caracteres extraños de la URL
  const rawHash = searchParams.get("hash");
  const hash = rawHash?.replace(/[()]/g, "");

  useEffect(() => {
    async function verify() {
      if (!hash || hash === "$hash" || hash === "($hash)") {
        setStatus("failed");
        setMessage("Esperando confirmación de pago. Si ya pagaste, tu pedido será procesado en breve.");
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
          setPaymentInfo(data.paymentInfo);
        } else {
          setStatus("failed");
          setMessage(data.message || "No pudimos verificar el estado automáticamente.");
        }
      } catch (error) {
        console.error("Error verify:", error);
        setStatus("failed");
        setMessage("Error de conexión con la pasarela de pagos.");
      }
    }

    verify();
  }, [hash]);

  return (
    <div className="container mx-auto px-4 max-w-2xl text-center py-12">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-[#D91E7A] animate-spin mb-6" />
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
                  className="text-gray-700 text-sm prose prose-sm max-w-none"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Estado del Pago</h1>
            <p className="text-gray-600 mb-8 text-lg">{message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 pt-8 border-t">
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto px-8">
              Ver Catálogo
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
        <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 className="animate-spin text-[#D91E7A]" /></div>}>
          <PagoFinalizadoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}