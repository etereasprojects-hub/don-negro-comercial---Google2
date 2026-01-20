"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2 } from "lucide-react";

export default function CategoriasPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="categorias" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Gestión de Categorías</h1>
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
                    <Button size="sm" variant="ghost" onClick={() => { setEditId(cat.id); setEditName(cat.nombre); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
