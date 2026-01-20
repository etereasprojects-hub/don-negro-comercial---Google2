"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePrices, formatCurrency } from "@/lib/pricing";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  codigo_wos: string;
  codigo_pro: string;
  codigo_ext: string;
  categoria: string;
  url_slug: string;
  costo: number | string;
  margen_porcentaje: number | string;
  interes_6_meses_porcentaje: number | string;
  interes_12_meses_porcentaje: number | string;
  interes_15_meses_porcentaje: number | string;
  interes_18_meses_porcentaje: number | string;
  stock: number;
  ubicacion: string;
  estado: string;
  imagen_url: string;
  imagenes_extra?: string[];
  video_url?: string;
  destacado: boolean;
  show_in_hero: boolean;
}

interface Category {
  id: string;
  nombre: string;
  slug: string;
  orden?: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: () => void;
}

export default function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    codigo_wos: "",
    codigo_pro: "",
    codigo_ext: "",
    categoria: "",
    url_slug: "",
    costo: 0,
    margen_porcentaje: 18,
    interes_6_meses_porcentaje: 45,
    interes_12_meses_porcentaje: 65,
    interes_15_meses_porcentaje: 75,
    interes_18_meses_porcentaje: 85,
    stock: 0,
    ubicacion: "En Local",
    estado: "Activo",
    imagen_url: "",
    imagenes_extra: ["", "", "", "", ""],
    video_url: "",
    destacado: false,
    show_in_hero: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, nombre, slug, orden")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Por favor ingresa un nombre para la categoría");
      return;
    }

    setSavingCategory(true);
    try {
      const categorySlug = generateSlug(newCategoryName);

      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.orden || 0)) : 0;

      const { data, error } = await supabase
        .from("categories")
        .insert([{
          nombre: newCategoryName.trim(),
          slug: categorySlug,
          activo: true,
          orden: maxOrder + 1
        }])
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error creating category:", error);
        throw error;
      }

      if (data) {
        await loadCategories();
        setFormData({ ...formData, categoria: newCategoryName.trim() });
        setNewCategoryName("");
        setShowCategoryModal(false);
        alert("Categoría creada exitosamente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear la categoría. Por favor intenta de nuevo.");
    } finally {
      setSavingCategory(false);
    }
  };

  const loadProductData = async (productId: string) => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (!error && data) {
        const imagenesExtra = Array.isArray(data.imagenes_extra) ? data.imagenes_extra : [];
        const paddedImages = [...imagenesExtra, "", "", "", "", ""].slice(0, 5);

        setFormData({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          codigo_wos: data.codigo_wos || "",
          codigo_pro: data.codigo_pro || "",
          codigo_ext: data.codigo_ext || "",
          categoria: data.categoria || "",
          url_slug: data.url_slug || "",
          costo: data.costo != null ? Number(data.costo) : 0,
          margen_porcentaje: data.margen_porcentaje != null ? Number(data.margen_porcentaje) : 18,
          interes_6_meses_porcentaje: data.interes_6_meses_porcentaje != null ? Number(data.interes_6_meses_porcentaje) : 45,
          interes_12_meses_porcentaje: data.interes_12_meses_porcentaje != null ? Number(data.interes_12_meses_porcentaje) : 65,
          interes_15_meses_porcentaje: data.interes_15_meses_porcentaje != null ? Number(data.interes_15_meses_porcentaje) : 75,
          interes_18_meses_porcentaje: data.interes_18_meses_porcentaje != null ? Number(data.interes_18_meses_porcentaje) : 85,
          stock: data.stock != null ? Number(data.stock) : 0,
          ubicacion: data.ubicacion || "En Local",
          estado: data.estado || "Activo",
          imagen_url: data.imagen_url || "",
          imagenes_extra: paddedImages,
          video_url: data.video_url || "",
          destacado: Boolean(data.destacado),
          show_in_hero: Boolean(data.show_in_hero),
        });
      } else {
        console.error("Error loading product data:", error);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (product && product.id) {
        loadProductData(product.id);
      } else {
        setFormData({
          nombre: "",
          descripcion: "",
          codigo_wos: "",
          codigo_pro: "",
          codigo_ext: "",
          categoria: "",
          url_slug: "",
          costo: 0,
          margen_porcentaje: 18,
          interes_6_meses_porcentaje: 45,
          interes_12_meses_porcentaje: 65,
          interes_15_meses_porcentaje: 75,
          interes_18_meses_porcentaje: 85,
          stock: 0,
          ubicacion: "En Local",
          estado: "Activo",
          imagen_url: "",
          imagenes_extra: ["", "", "", "", ""],
          video_url: "",
          destacado: false,
          show_in_hero: false,
        });
      }
    }
  }, [product, isOpen]);

  const handleNombreChange = (nombre: string) => {
    const newSlug = generateSlug(nombre);
    setFormData({
      ...formData,
      nombre,
      url_slug: !formData.url_slug || formData.url_slug === generateSlug(formData.nombre) ? newSlug : formData.url_slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalSlug = formData.url_slug || generateSlug(formData.nombre);
      const imagenesExtraFiltered = formData.imagenes_extra.filter((img: string) => img.trim() !== "");

      const dataToSave = {
        ...formData,
        url_slug: finalSlug,
        costo: Number(formData.costo),
        margen_porcentaje: Number(formData.margen_porcentaje),
        interes_6_meses_porcentaje: Number(formData.interes_6_meses_porcentaje),
        interes_12_meses_porcentaje: Number(formData.interes_12_meses_porcentaje),
        interes_15_meses_porcentaje: Number(formData.interes_15_meses_porcentaje),
        interes_18_meses_porcentaje: Number(formData.interes_18_meses_porcentaje),
        stock: Number(formData.stock),
        imagenes_extra: imagenesExtraFiltered,
      };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update({ ...dataToSave, updated_at: new Date().toISOString() })
          .eq("id", product.id);

        if (error) {
          console.error("Database error:", error);
          throw error;
        }
        alert("Producto actualizado exitosamente");
      } else {
        const { error } = await supabase.from("products").insert([dataToSave]);

        if (error) {
          console.error("Database error:", error);
          throw error;
        }
        alert("Producto creado exitosamente");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto. Por favor, verifica los datos e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const calculatedPrices = calculatePrices({
    costo: Number(formData.costo ?? 0),
    margen_porcentaje: Number(formData.margen_porcentaje ?? 18),
    interes_6_meses_porcentaje: Number(formData.interes_6_meses_porcentaje ?? 45),
    interes_12_meses_porcentaje: Number(formData.interes_12_meses_porcentaje ?? 65),
    interes_15_meses_porcentaje: Number(formData.interes_15_meses_porcentaje ?? 75),
    interes_18_meses_porcentaje: Number(formData.interes_18_meses_porcentaje ?? 85),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica la información del producto"
              : "Completa los datos del nuevo producto"}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Cargando datos del producto...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nombre">Nombre del Producto *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="url_slug">URL del Producto (slug)</Label>
              <Input
                id="url_slug"
                value={formData.url_slug}
                onChange={(e) => setFormData({ ...formData, url_slug: e.target.value })}
                placeholder="se-genera-automaticamente"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL completa: {process.env.NEXT_PUBLIC_SITE_URL || 'tu-sitio.com'}/productos/{formData.url_slug || 'slug'}
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="codigo_wos">Código WOS</Label>
              <Input
                id="codigo_wos"
                value={formData.codigo_wos}
                onChange={(e) => setFormData({ ...formData, codigo_wos: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="codigo_pro">Código PRO</Label>
              <Input
                id="codigo_pro"
                value={formData.codigo_pro}
                onChange={(e) => setFormData({ ...formData, codigo_pro: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="codigo_ext">Código EXT</Label>
              <Input
                id="codigo_ext"
                value={formData.codigo_ext}
                onChange={(e) => setFormData({ ...formData, codigo_ext: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="categoria">Categoría *</Label>
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCategoryModal(true)}
                  title="Agregar nueva categoría"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="col-span-2">
              <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">Costos y Márgenes</h3>
            </div>

            <div>
              <Label htmlFor="costo">Costo (₲) *</Label>
              <Input
                id="costo"
                type="number"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="margen_porcentaje">Margen (%)</Label>
              <Input
                id="margen_porcentaje"
                type="number"
                step="0.01"
                value={formData.margen_porcentaje}
                onChange={(e) => setFormData({ ...formData, margen_porcentaje: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-2">
              <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">Intereses a Crédito (%)</h3>
            </div>

            <div>
              <Label htmlFor="interes_6_meses_porcentaje">6 Meses (%)</Label>
              <Input
                id="interes_6_meses_porcentaje"
                type="number"
                step="0.01"
                value={formData.interes_6_meses_porcentaje}
                onChange={(e) => setFormData({ ...formData, interes_6_meses_porcentaje: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="interes_12_meses_porcentaje">12 Meses (%)</Label>
              <Input
                id="interes_12_meses_porcentaje"
                type="number"
                step="0.01"
                value={formData.interes_12_meses_porcentaje}
                onChange={(e) => setFormData({ ...formData, interes_12_meses_porcentaje: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="interes_15_meses_porcentaje">15 Meses (%)</Label>
              <Input
                id="interes_15_meses_porcentaje"
                type="number"
                step="0.01"
                value={formData.interes_15_meses_porcentaje}
                onChange={(e) => setFormData({ ...formData, interes_15_meses_porcentaje: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="interes_18_meses_porcentaje">18 Meses (%)</Label>
              <Input
                id="interes_18_meses_porcentaje"
                type="number"
                step="0.01"
                value={formData.interes_18_meses_porcentaje}
                onChange={(e) => setFormData({ ...formData, interes_18_meses_porcentaje: Number(e.target.value) })}
              />
            </div>

            {formData.costo > 0 && (
              <div className="col-span-2">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-lg mb-3 text-blue-900">Precios Calculados</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Precio Contado</p>
                        <p className="font-bold text-blue-900">{formatCurrency(calculatedPrices.precioContado)}</p>
                      </div>
                      {calculatedPrices.disponible6Meses && (
                        <div>
                          <p className="text-gray-600">6 Meses</p>
                          <p className="font-bold text-blue-900">{formatCurrency(calculatedPrices.cuota6Meses)} x 6</p>
                          <p className="text-xs text-gray-500">Total: {formatCurrency(calculatedPrices.total6Meses)}</p>
                        </div>
                      )}
                      {calculatedPrices.disponible12Meses && (
                        <div>
                          <p className="text-gray-600">12 Meses</p>
                          <p className="font-bold text-blue-900">{formatCurrency(calculatedPrices.cuota12Meses)} x 12</p>
                          <p className="text-xs text-gray-500">Total: {formatCurrency(calculatedPrices.total12Meses)}</p>
                        </div>
                      )}
                      {calculatedPrices.disponible15Meses && (
                        <div>
                          <p className="text-gray-600">15 Meses</p>
                          <p className="font-bold text-blue-900">{formatCurrency(calculatedPrices.cuota15Meses)} x 15</p>
                          <p className="text-xs text-gray-500">Total: {formatCurrency(calculatedPrices.total15Meses)}</p>
                        </div>
                      )}
                      {calculatedPrices.disponible18Meses && (
                        <div>
                          <p className="text-gray-600">18 Meses</p>
                          <p className="font-bold text-blue-900">{formatCurrency(calculatedPrices.cuota18Meses)} x 18</p>
                          <p className="text-xs text-gray-500">Total: {formatCurrency(calculatedPrices.total18Meses)}</p>
                        </div>
                      )}
                    </div>
                    {!calculatedPrices.disponible6Meses && !calculatedPrices.disponible12Meses && !calculatedPrices.disponible15Meses && !calculatedPrices.disponible18Meses && (
                      <p className="text-sm text-gray-600 mt-3">
                        No hay opciones de financiamiento disponibles. Configura al menos un plan con interés mayor a 0%.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Select
                value={formData.ubicacion}
                onValueChange={(value) => setFormData({ ...formData, ubicacion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En Local">En Local</SelectItem>
                  <SelectItem value="Depósito">Depósito</SelectItem>
                  <SelectItem value="Show Room">Show Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="imagen_url">URL de Imagen Principal</Label>
              <Input
                id="imagen_url"
                value={formData.imagen_url}
                onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="col-span-2">
              <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">Imágenes Adicionales (Máximo 5)</h3>
              <div className="space-y-2">
                {formData.imagenes_extra.map((img, index) => (
                  <div key={index}>
                    <Label htmlFor={`imagen_extra_${index}`}>Imagen Extra {index + 1}</Label>
                    <Input
                      id={`imagen_extra_${index}`}
                      value={img}
                      onChange={(e) => {
                        const newImages = [...formData.imagenes_extra];
                        newImages[index] = e.target.value;
                        setFormData({ ...formData, imagenes_extra: newImages });
                      }}
                      placeholder={`https://ejemplo.com/imagen${index + 1}.jpg`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <Label htmlFor="video_url">URL de Video (YouTube)</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingresa una URL de YouTube. El video aparecerá en la galería del producto.
              </p>
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="destacado"
                  checked={formData.destacado}
                  onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                />
                <Label htmlFor="destacado" className="cursor-pointer">
                  Producto Destacado (aparece en grilla de destacados)
                </Label>
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show_in_hero"
                  checked={formData.show_in_hero}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_in_hero: checked })}
                />
                <Label htmlFor="show_in_hero" className="cursor-pointer">
                  Mostrar en sección Hero (aparece en slider principal)
                </Label>
              </div>
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
              {loading ? "Guardando..." : product ? "Actualizar" : "Crear Producto"}
            </Button>
          </div>
        </form>
        )}

        {showCategoryModal && (
          <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Categoría</DialogTitle>
                <DialogDescription>
                  Ingresa el nombre de la nueva categoría. Se creará automáticamente un slug basado en el nombre.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="newCategoryName">Nombre de la Categoría *</Label>
                  <Input
                    id="newCategoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej: Electrónica"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName("");
                  }}
                  disabled={savingCategory}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={savingCategory || !newCategoryName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingCategory ? "Guardando..." : "Crear Categoría"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
