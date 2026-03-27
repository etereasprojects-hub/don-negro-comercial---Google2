"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Power, 
  PowerOff,
  Search,
  AlertCircle,
  CheckCircle2,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";

interface ClientProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Edit State
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    password: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Cliente temporal sin persistencia para no pisar la sesión del owner
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInBrowser: false } }
      );

      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insertar en user_profiles usando el cliente principal (sesión del owner)
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            { 
              id: authData.user.id, 
              email: formData.email, 
              full_name: formData.full_name,
              role: "mayorista", 
              active: true 
            }
          ]);

        if (profileError) throw profileError;

        setMessage({ type: 'success', text: "Cliente mayorista registrado con éxito." });
        setFormData({ email: "", full_name: "", password: "" });
        fetchClients();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Error al registrar cliente" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClientStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("user_profiles")
      .update({ active: !currentStatus })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar estado");
    } else {
      fetchClients();
    }
  };

  const handleEditClick = (client: ClientProfile) => {
    setEditingClient(client);
    setEditFormData({
      full_name: client.full_name || "",
      password: ""
    });
    setEditMessage(null);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    setIsUpdating(true);
    setEditMessage(null);

    try {
      const response = await fetch("/api/owner/update-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingClient.id,
          full_name: editFormData.full_name,
          password: editFormData.password || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al actualizar cliente");

      setEditMessage({ type: 'success', text: "Cliente actualizado con éxito." });
      fetchClients();
      setTimeout(() => setEditingClient(null), 1500);
    } catch (error: any) {
      setEditMessage({ type: 'error', text: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AdminHeader />
      <AdminTabs activeTab="clientes" />

      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        
        {/* Formulario de Registro */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 p-8">
            <div className="flex items-center gap-4">
              <div className="bg-[#D91E7A] p-3 rounded-2xl shadow-lg shadow-[#D91E7A]/20">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-[#2E3A52] uppercase tracking-tight">
                  Nuevo Cliente Mayorista
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">
                  El cliente podrá ingresar en <span className="text-[#D91E7A] font-bold">donegro.com/login</span> con estas credenciales.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-xs font-black uppercase text-slate-500 tracking-widest">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="full_name"
                    required 
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Juan Pérez"
                    className="pl-10 h-12 border-gray-200 focus:border-[#D91E7A] focus:ring-[#D91E7A] rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase text-slate-500 tracking-widest">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email"
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="cliente@email.com"
                    className="pl-10 h-12 border-gray-200 focus:border-[#D91E7A] focus:ring-[#D91E7A] rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase text-slate-500 tracking-widest">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password"
                    type="password" 
                    required 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="pl-10 h-12 border-gray-200 focus:border-[#D91E7A] focus:ring-[#D91E7A] rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex-1 w-full">
                  {message && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                      message.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-red-50 border-red-100 text-red-600'
                    } text-sm font-bold animate-in fade-in slide-in-from-top-1`}>
                      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {message.text}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-64 bg-[#2E3A52] hover:bg-[#D91E7A] text-white font-black h-14 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar Cliente"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tabla de Clientes */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black text-[#2E3A52] uppercase tracking-tight">
                Clientes Registrados
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Gestiona los accesos y estados de tus mayoristas.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre o email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-[#D91E7A]/20"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-[#D91E7A] mx-auto" />
                      <p className="mt-4 text-slate-500 font-bold uppercase text-xs tracking-widest">Cargando base de datos...</p>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No se encontraron clientes</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="font-black text-[#2E3A52] uppercase tracking-tight">
                          {client.full_name || "Sin nombre"}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm font-bold text-slate-500">{client.email}</div>
                      </td>
                      <td className="p-6">
                        <Badge className={`rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none ${
                          client.active 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {client.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClick(client)}
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleClientStatus(client.id, client.active)}
                            className={`rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4 gap-2 transition-all ${
                              client.active 
                                ? "border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200" 
                                : "border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                            }`}
                          >
                            {client.active ? (
                              <><PowerOff className="w-3 h-3" /> Desactivar</>
                            ) : (
                              <><Power className="w-3 h-3" /> Activar</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal de Edición */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-[#2E3A52]">Editar Cliente</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Modifica los datos del cliente mayorista. Deja la contraseña en blanco para no cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name" className="text-xs font-black uppercase text-slate-500 tracking-widest">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="edit_full_name"
                  required 
                  value={editFormData.full_name}
                  onChange={e => setEditFormData({...editFormData, full_name: e.target.value})}
                  className="pl-10 h-12 border-gray-200 focus:border-[#D91E7A] focus:ring-[#D91E7A] rounded-xl font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password" className="text-xs font-black uppercase text-slate-500 tracking-widest">Nueva Contraseña (Opcional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="edit_password"
                  type="password" 
                  value={editFormData.password}
                  onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                  placeholder="Dejar en blanco para mantener"
                  className="pl-10 h-12 border-gray-200 focus:border-[#D91E7A] focus:ring-[#D91E7A] rounded-xl font-bold"
                />
              </div>
            </div>

            {editMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                editMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                  : 'bg-red-50 border-red-100 text-red-600'
              } text-sm font-bold`}>
                {editMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {editMessage.text}
              </div>
            )}

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="w-full bg-[#D91E7A] hover:bg-[#6B4199] text-white font-black h-12 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
