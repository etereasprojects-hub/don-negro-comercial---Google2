"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Mail, AlertCircle, Loader2, ChevronLeft } from "lucide-react";

export default function WholesaleLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (user) {
        // Verificar si el usuario tiene perfil y está activo
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, active")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || profile.role !== 'mayorista') {
          await supabase.auth.signOut();
          setError("Acceso no autorizado para clientes mayoristas");
          return;
        }

        if (!profile.active) {
          await supabase.auth.signOut();
          setError("Tu acceso está desactivado. Contacta con administración.");
          return;
        }

        router.push("/catalogo/mayorista");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/productos" className="flex items-center gap-2 text-[#2E3A52] hover:text-[#D91E7A] font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver al catálogo público
        </Link>
      </div>

      <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="h-2 bg-[#D91E7A]" />
        <CardHeader className="space-y-1 text-center pt-8">
          <CardTitle className="text-3xl font-black text-[#2E3A52] tracking-tight uppercase">
            Acceso Mayorista
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Ingresá tus credenciales para ver precios exclusivos
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#2E3A52] font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-slate-200 focus:ring-[#D91E7A] focus:border-[#D91E7A] rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#2E3A52] font-semibold">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-slate-200 focus:ring-[#D91E7A] focus:border-[#D91E7A] rounded-xl"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D91E7A] hover:bg-[#6B4199] text-white font-black py-7 rounded-xl shadow-lg shadow-[#D91E7A]/20 transition-all active:scale-95 text-lg uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-slate-400 text-sm font-medium">
        &copy; {new Date().getFullYear()} Don Negro Comercial. Todos los derechos reservados.
      </p>
    </div>
  );
}
