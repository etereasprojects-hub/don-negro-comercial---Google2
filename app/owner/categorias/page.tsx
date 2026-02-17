"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CategoriasPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  
  // New Category State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadCategories();
    }
  }, [router]);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("orden");
    if (data) setCategories(data);
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from("categories").update({ nombre: editName, slug: editName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") }).eq("id", id);
    setEditId(null);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar esta categoría?")) {
      await supabase.from("categories").delete().eq("id", id);
      loadCategories();
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    setCreating(true);
    try {
      const slug = newCategoryName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      // Get max orden
      const { data: maxData } = await supabase
        .from("categories")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextOrder = (maxData?.orden || 0) + 1;

      const { error } = await supabase.from("categories").insert([
        { nombre: newCategoryName, slug, orden: nextOrder, activo: true }
      ]);

      if (error) throw error;
      
      setNewCategoryName("");
      setIsCreateOpen(false);
      loadCategories();
    } catch (e: any) {
      alert("Error al crear categoría: " + e.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="categorias" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Nueva Categoría
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Slug</th>
                <th className="p-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {editId === cat.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => handleEdit(cat.id)} onKeyDown={(e) => e.key === 'Enter' && handleEdit(cat.id)} autoFocus />
                    ) : (
                      cat.nombre
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{cat.slug}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(cat.id); setEditName(cat.nombre); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No hay categorías registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la Categoría</Label>
              <Input 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                placeholder="Ej: Televisores"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating || !newCategoryName.trim()}>
                {creating ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
