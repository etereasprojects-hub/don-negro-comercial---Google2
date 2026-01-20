"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Edit, Trash2, ArrowUp, ArrowDown, Power, PowerOff } from "lucide-react";

interface AIInstruction {
  id: string;
  title: string;
  instruction: string;
  category: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export default function AIConfigPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [instructions, setInstructions] = useState<AIInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<AIInstruction | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    instruction: "",
    category: "general",
    priority: 0,
  });

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadInstructions();
    }
  }, [router]);

  const loadInstructions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_instructions")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInstructions(data || []);
    } catch (error) {
      console.error("Error loading instructions:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingInstruction(null);
    setFormData({
      title: "",
      instruction: "",
      category: "general",
      priority: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (instruction: AIInstruction) => {
    setEditingInstruction(instruction);
    setFormData({
      title: instruction.title,
      instruction: instruction.instruction,
      category: instruction.category,
      priority: instruction.priority,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingInstruction) {
        const { error } = await supabase
          .from("ai_instructions")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingInstruction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_instructions").insert([
          {
            ...formData,
            is_active: true,
          },
        ]);

        if (error) throw error;
      }

      setShowModal(false);
      loadInstructions();
    } catch (error) {
      console.error("Error saving instruction:", error);
    }
  };

  const deleteInstruction = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta instrucción?")) return;

    try {
      const { error } = await supabase.from("ai_instructions").delete().eq("id", id);

      if (error) throw error;
      loadInstructions();
    } catch (error) {
      console.error("Error deleting instruction:", error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_instructions")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      loadInstructions();
    } catch (error) {
      console.error("Error toggling instruction:", error);
    }
  };

  const updatePriority = async (id: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from("ai_instructions")
        .update({ priority: newPriority })
        .eq("id", id);

      if (error) throw error;
      loadInstructions();
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="ia" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-7 h-7" />
              Configuración de IA
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona las instrucciones que la IA usará en las conversaciones
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Instrucción
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando instrucciones...</p>
          </div>
        ) : instructions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No hay instrucciones configuradas</p>
              <Button onClick={openCreateModal}>Crear primera instrucción</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {instructions.map((instruction) => (
              <Card
                key={instruction.id}
                className={`hover:shadow-lg transition-shadow ${
                  !instruction.is_active ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{instruction.title}</CardTitle>
                        <Badge variant="secondary">{instruction.category}</Badge>
                        {instruction.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Power className="w-3 h-3 mr-1" />
                            Activa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <PowerOff className="w-3 h-3 mr-1" />
                            Inactiva
                          </Badge>
                        )}
                        <Badge variant="outline">Prioridad: {instruction.priority}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {instruction.instruction}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(instruction.id, instruction.is_active)}
                    >
                      {instruction.is_active ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePriority(instruction.id, instruction.priority + 1)}
                    >
                      <ArrowUp className="w-4 h-4 mr-1" />
                      Aumentar Prioridad
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePriority(instruction.id, instruction.priority - 1)}
                    >
                      <ArrowDown className="w-4 h-4 mr-1" />
                      Disminuir Prioridad
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(instruction)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => deleteInstruction(instruction.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstruction ? "Editar Instrucción" : "Nueva Instrucción"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Saludo inicial"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ej: saludo, ventas, soporte"
                />
              </div>
              <div>
                <Label>Prioridad</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) })
                  }
                  placeholder="Mayor número = mayor prioridad"
                />
              </div>
              <div>
                <Label>Instrucción</Label>
                <Textarea
                  value={formData.instruction}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  placeholder="Escribe aquí la instrucción para la IA..."
                  rows={8}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingInstruction ? "Guardar Cambios" : "Crear Instrucción"}
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
