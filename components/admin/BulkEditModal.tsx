"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Category {
  id: string;
  nombre: string;
  slug: string;
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: Set<string>;
  onSave: () => void;
}

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedProductIds,
  onSave,
}: BulkEditModalProps) {
  // Manejamos los números como strings para poder diferenciar entre "" (vacío/no editar) y "0" (valor cero)
  const [formData, setFormData] = useState({
    categoria: "",
    margen_porcentaje: "" as string | number,
    interes_6_meses_porcentaje: "" as string | number,
    interes_12_meses_porcentaje: "" as string | number,
    interes_15_meses_porcentaje: "" as string | number,
    interes_18_meses_porcentaje: "" as string | number,
    estado: "",
    destacado: false,
    updateDestacado: false, // Nueva bandera para saber si queremos actualizar el checkbox
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isOpen) resetForm();
  }, [isOpen]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, nombre, slug")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const resetForm = () => {
    setFormData({
      categoria: "",
      margen_porcentaje: "",
      interes_6_meses_porcentaje: "",
      interes_12_meses_porcentaje: "",
      interes_15_meses_porcentaje: "",
      interes_18_meses_porcentaje: "",
      estado: "",
      destacado: false,
      updateDestacado: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToUpdate: any = {};

      if (formData.categoria) dataToUpdate.categoria = formData.categoria;
      if (formData.estado) dataToUpdate.estado = formData.estado;
      
      // Solo actualizamos el campo si no está vacío. Esto permite que el '0' sea válido.
      if (formData.margen_porcentaje !== "") {
        dataToUpdate.margen_porcentaje = Number(formData.margen_porcentaje);
      }
      if (formData.interes_6_meses_porcentaje !== "") {
        dataToUpdate.interes_6_meses_porcentaje = Number(formData.interes_6_meses_porcentaje);
      }
      if (formData.interes_12_meses_porcentaje !== "") {
        dataToUpdate.interes_12_meses_porcentaje = Number(formData.interes_12_meses_porcentaje);
      }
      if (formData.interes_15_meses_porcentaje !== "") {
        dataToUpdate.interes_15_meses_porcentaje = Number(formData.interes_15_meses_porcentaje);
      }
      if (formData.interes_18_meses_porcentaje !== "") {
        dataToUpdate.interes_18_meses_porcentaje = Number(formData.interes_18_meses_porcentaje);
      }
      
      if (formData.updateDestacado) {
        dataToUpdate.destacado = formData.destacado;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        alert("Por favor, completa al menos un campo para actualizar");
        setLoading(false);
        return;
      }

      dataToUpdate.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("products")
        .update(dataToUpdate)
        .in("id", Array.from(selectedProductIds));

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      alert(`${selectedProductIds.size} productos actualizados exitosamente`);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating products:", error);
      alert("Error al actualizar los productos. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Productos en Grupo</DialogTitle>
          <DialogDescription>
            Editando {selectedProductIds.size} producto{selectedProductIds.size > 1 ? "s" : ""}.
            Los campos que dejes vacíos no se actualizarán. Para desactivar una opción de crédito, escribe "0".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Margen</h3>
              <div>
                <Label htmlFor="margen_porcentaje">Margen (%)</Label>
                <Input
                  id="margen_porcentaje"
                  type="number"
                  step="0.01"
                  value={formData.margen_porcentaje}
                  onChange={(e) => setFormData({ ...formData, margen_porcentaje: e.target.value })}
                  placeholder="Ejemplo: 18"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Intereses a Crédito (%)</h3>
              <p className="text-xs text-blue-600 mb-4 font-medium">Nota: El valor "0" inhabilita la opción de cuotas para el cliente.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interes_6_meses_porcentaje">6 Meses (%)</Label>
                  <Input
                    id="interes_6_meses_porcentaje"
                    type="number"
                    step="0.01"
                    value={formData.interes_6_meses_porcentaje}
                    onChange={(e) => setFormData({ ...formData, interes_6_meses_porcentaje: e.target.value })}
                    placeholder="Ejemplo: 45"
                  />
                </div>

                <div>
                  <Label htmlFor="interes_12_meses_porcentaje">12 Meses (%)</Label>
                  <Input
                    id="interes_12_meses_porcentaje"
                    type="number"
                    step="0.01"
                    value={formData.interes_12_meses_porcentaje}
                    onChange={(e) => setFormData({ ...formData, interes_12_meses_porcentaje: e.target.value })}
                    placeholder="Ejemplo: 65"
                  />
                </div>

                <div>
                  <Label htmlFor="interes_15_meses_porcentaje">15 Meses (%)</Label>
                  <Input
                    id="interes_15_meses_porcentaje"
                    type="number"
                    step="0.01"
                    value={formData.interes_15_meses_porcentaje}
                    onChange={(e) => setFormData({ ...formData, interes_15_meses_porcentaje: e.target.value })}
                    placeholder="Ejemplo: 75"
                  />
                </div>

                <div>
                  <Label htmlFor="interes_18_meses_porcentaje">18 Meses (%)</Label>
                  <Input
                    id="interes_18_meses_porcentaje"
                    type="number"
                    step="0.01"
                    value={formData.interes_18_meses_porcentaje}
                    onChange={(e) => setFormData({ ...formData, interes_18_meses_porcentaje: e.target.value })}
                    placeholder="Ejemplo: 85"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="updateDestacado"
                  checked={formData.updateDestacado}
                  onCheckedChange={(checked) => setFormData({ ...formData, updateDestacado: checked })}
                />
                <Label htmlFor="updateDestacado" className="font-bold text-blue-700">
                  ¿Actualizar estado de "Destacado"?
                </Label>
              </div>
              
              {formData.updateDestacado && (
                <div className="flex items-center space-x-2 pl-6 animate-in fade-in slide-in-from-left-2">
                  <Switch
                    id="destacado"
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  />
                  <Label htmlFor="destacado" className="cursor-pointer">
                    Marcar como Producto Destacado
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Actualizando..." : "Actualizar Productos"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
