"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2, ShoppingBag } from "lucide-react";

function PagoFinalizadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
  const [message, setMessage] = useState("Verificando tu pago...");
  
  const hash = searchParams.get("hash");

  useEffect(() => {
    async function verify() {
      if (!hash || hash.includes("$hash")) {
        setStatus("failed");
        setMessage("No se encontró una referencia de pago válida.");
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
          setMessage("¡Tu pago ha sido confirmado! Tu pedido ya está en proceso.");
        } else if (data.status === "pending") {
          setStatus("pending");
          setMessage("Tu pago está pendiente de aprobación. Te avisaremos cuando se confirme.");
        } else {
          setStatus("failed");
          setMessage(data.message || "No pudimos confirmar tu pago.");
        }
      } catch (error) {
        console.error("Error verificando pago:", error);
        setStatus("failed");
        setMessage("Hubo un error al conectar con la pasarela.");
      }
    }

    verify();
  }, [hash]);

  return (
    <div className="container mx-auto px-4 max-w-2xl text-center py-12">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h1 className="text-2xl font-bold mb-2">Validando transacción</h1>
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-8 text-lg">{message}</p>
          </div>
        )}

        {status === "pending" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
              <Clock size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pago Pendiente</h1>
            <p className="text-gray-600 mb-8 text-lg">{message}</p>
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t">
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto px-8">
              Seguir Comprando
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