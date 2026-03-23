"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function OwnerPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/owner/dashboard");
      } else {
        router.push("/owner/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#D91E7A] animate-spin mx-auto" />
        <p className="text-slate-400 font-medium">Redirigiendo al panel...</p>
      </div>
    </div>
  );
}
