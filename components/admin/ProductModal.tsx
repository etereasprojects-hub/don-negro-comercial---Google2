"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Eye, MapPin, Loader2, Package } from "lucide-react";

interface Product {
  id?: string;
  sku?: string;
  nombre: string;
  descripcion: string;
  codigo_wos?: string;
  codigo_pro?: string;
  codigo_ext?: string;
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
  fastrax_id_sucursal?: string;
  estado: string;
  imagen_url: string;
  imagenes_extra?: string[];
  video_url?: string;
  destacado: boolean;
  show_in_hero?: boolean;
  source?: string;
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
    id: "",
    sku: "",
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
    fastrax_id_sucursal: "",
    estado: "Activo",
    imagen_url: "",
    imagenes_extra: ["", "", "", "", ""],
    video_url: "",
    destacado: false,
    show_in_hero: false,
    source: ""
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");
  };

  const decodeText = (t: string) => {
    if (!t) return "";
    try { return decodeURIComponent(t.replace(/\+/g, ' ')); } catch (e) { return t.replace(/\+/g, ' '); }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, nombre, slug, orden")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (data) setCategories(data);
  };

  const loadProductData = async (productId: string, isFastrax: boolean) => {
    setLoadingData(true);
    try {
      const table = isFastrax ? "fastrax_products" : "products";
      const { data: dbData } = await supabase
        .from(table)
        .select("*")
        .eq(isFastrax ? "sku" : "id", productId)
        .maybeSingle();

      if (isFastrax) {
        // Para Fastrax, complementamos SIEMPRE con datos en vivo para asegurar costo y descripción
        try {
          const res2 = await fetch('/api/fastrax/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ope: 2, sku: productId })
          });
          const d2 = await res2.json();
          const liveDetails = Array.isArray(d2) ? d2[1] : null;

          const res94 = await fetch('/api/fastrax/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ope: 94, sku: productId, dat: "2018-01-01 00:00:00" })
          });
          const d94 = await res94.json();
          const liveImages = Array.isArray(d94) && d94[1] ? d94[1].base64 || [] : [];

          if (liveDetails) {
            const merged = {
              ...dbData,
              nombre: dbData?.nombre || decodeText(liveDetails.nom),
              descripcion: dbData?.descripcion || decodeText(liveDetails.des || liveDetails.bre),
              costo: Number(liveDetails.pre || dbData?.costo || 0),
              imagen_url: dbData?.imagen_url || liveImages[0] || "",
              imagenes_extra: dbData?.imagenes_extra?.length ? dbData.imagenes_extra : liveImages.slice(1),
              sku: productId
            };
            applyProductToForm(merged, true);
          } else {
            applyProductToForm(dbData, true);
          }
        } catch (e) {
          applyProductToForm(dbData, true);
        }
      } else {
        applyProductToForm(dbData, false);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const applyProductToForm = (data: any, isFastrax: boolean = false) => {
    if (!data) return;
    const imagenesExtra = Array.isArray(data.imagenes_extra) ? data.imagenes_extra : [];
    const paddedImages = [...imagenesExtra, "", "", "", "", ""].slice(0, 5);

    setFormData({
      id: data.id || "",
      sku: data.sku || data.codigo_ext || "",
      nombre: data.nombre || "",
      descripcion: data.descripcion || "",
      codigo_wos: data.codigo_wos || "",
      codigo_pro: data.codigo_pro || "",
      codigo_ext: isFastrax ? (data.sku || data.codigo_ext) : (data.codigo_ext || ""),
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
      fastrax_id_sucursal: data.fastrax_id_sucursal || "",
      estado: data.estado || "Activo",
      imagen_url: data.imagen_url || "",
      imagenes_extra: paddedImages,
      video_url: data.video_url || "",
      destacado: Boolean(data.destacado),
      show_in_hero: Boolean(data.show_in_hero),
      source: isFastrax ? "Fastrax" : (data.source || "")
    });
  };

  useEffect(() => {
    if (isOpen) {
      if (product) {
        const isFastrax = product.source === 'Fastrax' || !!product.sku;
        if (isFastrax && product.sku) {
           loadProductData(product.sku, true);
        } else if (product.id) {
          loadProductData(product.id, false);
        } else {
          applyProductToForm(product, isFastrax);
        }
      } else {
        setFormData({
          id: "", sku: "", nombre: "", descripcion: "", codigo_wos: "", codigo_pro: "", codigo_ext: "",
          categoria: "", url_slug: "", costo: 0, margen_porcentaje: 18, interes_6_meses_porcentaje: 45,
          interes_12_meses_porcentaje: 65, interes_15_meses_porcentaje: 75, interes_18_meses_porcentaje: 85,
          stock: 0, ubicacion: "En Local", fastrax_id_sucursal: "", estado: "Activo",
          imagen_url: "", imagenes_extra: ["", "", "", "", ""], video_url: "", destacado: false,
          show_in_hero: false, source: ""
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
      const isFastrax = formData.source === 'Fastrax';
      const table = isFastrax ? "fastrax_products" : "products";

      const dataToSave: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        url_slug: finalSlug,
        costo: Number(formData.costo),
        margen_porcentaje: Number(formData.margen_porcentaje),
        interes_6_meses_porcentaje: Number(formData.interes_6_meses_porcentaje),
        interes_12_meses_porcentaje: Number(formData.interes_12_meses_porcentaje),
        interes_15_meses_porcentaje: Number(formData.interes_15_meses_porcentaje),
        interes_18_meses_porcentaje: Number(formData.interes_18_meses_porcentaje),
        stock: Number(formData.stock),
        imagenes_extra: formData.imagenes_extra.filter(i => i.trim() !== ""),
        destacado: formData.destacado,
        estado: formData.estado,
        imagen_url: formData.imagen_url,
        video_url: formData.video_url
      };

      if (isFastrax && formData.sku) {
          const { error } = await supabase.from(table).update(dataToSave).eq("sku", formData.sku);
          if (error) throw error;
      } else if (formData.id) {
          const { error } = await supabase.from(table).update(dataToSave).eq("id", formData.id);
          if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert([dataToSave]);
        if (error) throw error;
      }

      alert("Producto guardado exitosamente");
      onSave();
      onClose();
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPrices = calculatePrices({
    costo: Number(formData.costo),
    margen_porcentaje: Number(formData.margen_porcentaje),
    interes_6_meses_porcentaje: Number(formData.interes_6_meses_porcentaje),
    interes_12_meses_porcentaje: Number(formData.interes_12_meses_porcentaje),
    interes_15_meses_porcentaje: Number(formData.interes_15_meses_porcentaje),
    interes_18_meses_porcentaje: Number(formData.interes_18_meses_porcentaje),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formData.sku || formData.id ? "Editar Producto Comercial" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
            <p className="text-xs font-black uppercase text-slate-400">Cargando datos extendidos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Columna Izquierda: Imagen y Ficha */}
              <div className="md:col-span-1 space-y-4">
                 <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden p-4">
                    {formData.imagen_url ? (
                      <img src={formData.imagen_url} className="w-full h-full object-contain" alt="Preview" />
                    ) : (
                      <Package className="text-slate-300 w-12 h-12" />
                    )}
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Galería Base64 (API)</Label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {formData.imagenes_extra.map((img, i) => img && (
                        <div key={i} className="w-12 h-12 rounded border bg-white shrink-0 overflow-hidden">
                           <img src={img} className="w-full h-full object-contain" alt="extra" />
                        </div>
                      ))}
                    </div>
                 </div>
                 <div className="p-4 bg-slate-900 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <LayoutGrid className="w-3 h-3 text-blue-400" /> Resumen de Precios
                    </h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Contado:</span>
                          <span className="text-emerald-400 font-bold">{formatCurrency(currentPrices.precioContado)}</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Cuota 12m:</span>
                          <span className="text-blue-400 font-bold">{formatCurrency(currentPrices.cuota12Meses)}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Columna Derecha: Formulario */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                    <Label>Nombre del Producto *</Label>
                    <Input value={formData.nombre} onChange={(e) => handleNombreChange(e.target.value)} required />
                  </div>

                  <div>
                    <Label>SKU / Código Ext</Label>
                    <Input value={formData.sku} disabled className="bg-slate-50 font-mono font-bold" />
                  </div>

                  <div>
                    <Label>Categoría *</Label>
                    <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ficha Técnica / Descripción</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={8}
                    className="font-mono text-[10px]"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-black text-xs uppercase mb-4 text-slate-500 tracking-widest">Configuración Comercial</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <Label className="text-[9px] uppercase font-bold text-slate-500">Costo (API)</Label>
                      <Input type="number" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} className="h-8 font-bold border-none bg-transparent p-0" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <Label className="text-[9px] uppercase font-bold text-slate-500">Margen (%)</Label>
                      <Input type="number" value={formData.margen_porcentaje} onChange={e => setFormData({...formData, margen_porcentaje: e.target.value})} className="h-8 font-bold border-none bg-transparent p-0" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <Label className="text-[9px] uppercase font-bold text-slate-500">Interés 12m (%)</Label>
                      <Input type="number" value={formData.interes_12_meses_porcentaje} onChange={e => setFormData({...formData, interes_12_meses_porcentaje: e.target.value})} className="h-8 font-bold border-none bg-transparent p-0" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Switch id="destacado" checked={formData.destacado} onCheckedChange={v => setFormData({...formData, destacado: v})} />
                  <Label htmlFor="destacado" className="font-bold">Marcar como Destacado en Inicio</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
