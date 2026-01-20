"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminHeader() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("Don Negro Comercial");

  useEffect(() => {
    loadBusinessName();
  }, []);

  const loadBusinessName = async () => {
    try {
      const { data } = await supabase
        .from('store_configuration')
        .select('business_name')
        .single();

      if (data?.business_name) {
        setBusinessName(data.business_name);
      }
    } catch (error) {
      console.error('Error loading business name:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ownerAuth");
    router.push("/owner");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Panel del Propietario</h1>
            <p className="text-sm text-gray-500">{businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank">
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Sitio
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
