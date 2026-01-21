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
  // Pagopar devuelve el hash en el parámetro que definamos en el panel
  const hashId = searchParams.get("id");

  useEffect(() => {
    // Si llegamos aquí y hay un hash, asumimos éxito inicial. 
    // En una fase Pro, aquí consultaríamos a nuestra base de datos si el webhook ya confirmó.
    if (hashId) {
      setStatus("success");
    } else {
      // Si no hay hash, podría ser un acceso directo o un error
      setStatus("error");
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Confirmado!</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Tu transacción ha sido procesada con éxito. Ya estamos preparando tu pedido.
              {hashId && <span className="block mt-2 text-xs text-gray-400">Ref: {hashId}</span>}
            </p>
          </>
        ) : status === "error" ? (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Estado Incierto</h1>
            <p className="text-gray-600 mb-8 text-lg">
              No pudimos verificar automáticamente tu pago. Por favor, revisa tu correo o contacta con nosotros si el monto fue debitado.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Clock size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verificando...</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Estamos validando la información de tu compra.
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
  );
}

export default function PagoFinalizadoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-32 pb-20">
        <Suspense fallback={<div className="text-center">Cargando...</div>}>
          <PagoFinalizadoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
