
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import RealCartTest from "@/components/admin/RealCartTest";

export default function TestPagoPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="test-pago" />
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Entorno de Pruebas de Pago</h1>
          <p className="text-gray-500">Usa esta área para validar la integración real con Pagopar mientras el sitio público usa el flujo dummy.</p>
        </div>
        <RealCartTest />
      </div>
    </div>
  );
}
