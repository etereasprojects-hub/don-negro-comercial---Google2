"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Calendar, 
  ShieldCheck,
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AdminTabs from "@/components/admin/AdminTabs";

interface ClientProfile {
  id: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("role", "mayorista")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/owner/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear cliente");
      }

      setIsAddModalOpen(false);
      setNewClient({ email: "", password: "" });
      fetchClients();
      alert("Cliente mayorista creado con éxito");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres desactivar este cliente?")) return;

    const { error } = await supabase
      .from("user_profiles")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      alert("Error al desactivar cliente");
    } else {
      fetchClients();
    }
  };

  const filteredClients = clients.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="w-10 h-10 text-emerald-600" />
              GESTIÓN DE CLIENTES
            </h1>
            <p className="text-slate-500 font-medium mt-1">Administra tus clientes mayoristas y sus accesos.</p>
          </div>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 h-12 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 gap-2">
                <UserPlus className="w-5 h-5" />
                NUEVO MAYORISTA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">CREAR CLIENTE MAYORISTA</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Correo Electrónico</Label>
                  <Input 
                    type="email" 
                    required 
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    placeholder="ejemplo@correo.com"
                    className="h-12 border-2 border-slate-100 focus:border-emerald-500 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Contraseña Temporal</Label>
                  <Input 
                    type="password" 
                    required 
                    value={newClient.password}
                    onChange={e => setNewClient({...newClient, password: e.target.value})}
                    placeholder="••••••••"
                    className="h-12 border-2 border-slate-100 focus:border-emerald-500 rounded-xl font-bold"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREAR ACCESO"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <AdminTabs activeTab="clientes" />

        {/* Main Content */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Buscar por email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border-2 border-slate-100 rounded-2xl font-bold focus:border-emerald-500"
              />
            </div>
            <div className="text-sm font-bold text-slate-500">
              Total: {filteredClients.length} clientes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha Registro</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
                      <p className="mt-4 text-slate-500 font-bold">Cargando clientes...</p>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold">No se encontraron clientes.</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl">
                            {client.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-2">
                              {client.email}
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">ID: {client.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge className={`rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest ${
                          client.active 
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}>
                          {client.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(client.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={!client.active}
                          className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
