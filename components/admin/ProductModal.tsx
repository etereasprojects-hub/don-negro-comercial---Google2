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
import { Plus, LayoutGrid, Eye, MapPin, Loader2, Package, CreditCard, Edit, DollarSign } from "lucide-react";

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
    margen_porcentaje: 20,
    interes_6_meses_porcentaje: 50,
    interes_12_meses_porcentaje: 75,
    interes_15_meses_porcentaje: 85,
    interes_18_meses_porcentaje: 0,
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

  // New Category Modal State
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const slug = generateSlug(newCategoryName);
      // Get max order
      const { data: maxData } = await supabase.from("categories").select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
      const nextOrder = (maxData?.orden || 0) + 1;

      const { error } = await supabase.from("categories").insert([
        { nombre: newCategoryName, slug, orden: nextOrder, activo: true }
      ]);
      
      if (error) throw error;
      
      await loadCategories();
      setFormData(prev => ({ ...prev, categoria: newCategoryName }));
      setNewCategoryName("");
      setIsNewCategoryOpen(false);
    } catch (e: any) {
      alert("Error al crear categoría: " + e.message);
    } finally {
      setCreatingCategory(false);
    }
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
              nombre: decodeText(liveDetails.nom),
              descripcion: decodeText(liveDetails.des || liveDetails.bre),
              costo: Number(liveDetails.pre || dbData?.costo || 0),
              imagen_url: liveImages[0] || dbData?.imagen_url || "",
              imagenes_extra: liveImages.slice(1).length ? liveImages.slice(1) : (dbData?.imagenes_extra || []),
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
      margen_porcentaje: data.margen_porcentaje != null ? Number(data.margen_porcentaje) : 20,
      interes_6_meses_porcentaje: data.interes_6_meses_porcentaje != null ? Number(data.interes_6_meses_porcentaje) : 50,
      interes_12_meses_porcentaje: data.interes_12_meses_porcentaje != null ? Number(data.interes_12_meses_porcentaje) : 75,
      interes_15_meses_porcentaje: data.interes_15_meses_porcentaje != null ? Number(data.interes_15_meses_porcentaje) : 85,
      interes_18_meses_porcentaje: data.interes_18_meses_porcentaje != null ? Number(data.interes_18_meses_porcentaje) : 0,
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
        if (isFastrax && (product.sku || product.codigo_ext)) {
           loadProductData(product.sku || product.codigo_ext, true);
        } else if (product.id) {
          loadProductData(product.id, false);
        } else {
          applyProductToForm(product, isFastrax);
        }
      } else {
        setFormData({
          id: "", sku: "", nombre: "", descripcion: "", codigo_wos: "", codigo_pro: "", codigo_ext: "",
          categoria: "", url_slug: "", costo: 0, margen_porcentaje: 20, interes_6_meses_porcentaje: 50,
          interes_12_meses_porcentaje: 75, interes_15_meses_porcentaje: 85, interes_18_meses_porcentaje: 0,
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

  const handleExtraImageChange = (index: number, value: string) => {
    const newImages = [...formData.imagenes_extra];
    newImages[index] = value;
    setFormData({ ...formData, imagenes_extra: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isFastrax = formData.source === 'Fastrax';
      const table = isFastrax ? "fastrax_products" : "products";
      
      let dataToSave: any = {};

      if (isFastrax) {
        // SOLUCIÓN: Solo guardamos los campos que tenemos en fastrax_products
        dataToSave = {
          margen_porcentaje: Number(formData.margen_porcentaje),
          interes_6_meses_porcentaje: Number(formData.interes_6_meses_porcentaje),
          interes_12_meses_porcentaje: Number(formData.interes_12_meses_porcentaje),
          interes_15_meses_porcentaje: Number(formData.interes_15_meses_porcentaje),
          interes_18_meses_porcentaje: Number(formData.interes_18_meses_porcentaje),
          destacado: formData.destacado,
          show_in_hero: formData.show_in_hero,
          updated_at: new Date().toISOString()
        };
      } else {
        const finalSlug = formData.url_slug || generateSlug(formData.nombre);
        dataToSave = {
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
          show_in_hero: formData.show_in_hero,
          estado: formData.estado,
          imagen_url: formData.imagen_url,
          video_url: formData.video_url,
          codigo_wos: formData.codigo_wos || null,
          codigo_pro: formData.codigo_pro || null,
          codigo_ext: formData.codigo_ext || null
        };
      }

      if (isFastrax && (formData.sku || formData.codigo_ext)) {
          const { error } = await supabase.from(table).update(dataToSave).eq("sku", formData.sku || formData.codigo_ext);
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formData.sku || formData.id ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              {formData.sku || formData.id ? "Edición de Producto Comercial" : "Registrar Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              Configura los precios, financiación y detalles visuales del catálogo.
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Consultando Servidor...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Columna Izquierda: Activos y Precios */}
                <div className="md:col-span-1 space-y-6">
                   <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden p-6 shadow-inner relative group">
                      {formData.imagen_url ? (
                        <img src={formData.imagen_url} className="w-full h-full object-contain transition-transform group-hover:scale-105" alt="Preview" />
                      ) : (
                        <Package className="text-slate-200 w-20 h-20" />
                      )}
                      <Badge className="absolute top-4 right-4 bg-slate-900/80 text-white font-mono">{formData.sku || 'N/A'}</Badge>
                   </div>
                   
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">URL Imagen Principal</Label>
                      <Input 
                        value={formData.imagen_url} 
                        onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })} 
                        placeholder="https://..."
                        className="text-xs"
                        disabled={formData.source === 'Fastrax'}
                      />
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                         <LayoutGrid className="w-3 h-3" /> Galería Complementaria
                      </Label>
                      <div className="space-y-2">
                        {formData.imagenes_extra.map((img, i) => (
                          <div key={i} className="flex gap-2">
                            <div className="w-10 h-10 rounded-lg border bg-white shrink-0 overflow-hidden flex items-center justify-center">
                               {img ? <img src={img} className="w-full h-full object-contain" alt="thumb" /> : <span className="text-xs text-slate-300">#{i+1}</span>}
                            </div>
                            <Input 
                              value={img} 
                              onChange={(e) => handleExtraImageChange(i, e.target.value)}
                              placeholder={`URL Imagen Extra ${i+1}`}
                              className="text-xs h-10 flex-1"
                              disabled={formData.source === 'Fastrax'}
                            />
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">URL Video (YouTube/Vimeo)</Label>
                      <Input 
                        value={formData.video_url} 
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} 
                        placeholder="https://..."
                        className="text-xs"
                        disabled={formData.source === 'Fastrax'}
                      />
                   </div>

                   {/* Card de Precios Dinámicos */}
                   <div className="bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Precio Contado (Calculado)</p>
                         <p className="text-3xl font-black">{formatCurrency(currentPrices.precioContado)}</p>
                      </div>
                      <div className="p-5 space-y-4">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-emerald-400" /> Breakdown Financiación
                         </h4>
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                               <span className="text-[9px] text-slate-500 font-bold uppercase">6 Meses</span>
                               <p className="text-sm font-black text-white">{formatCurrency(currentPrices.cuota6Meses)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                               <span className="text-[9px] text-slate-500 font-bold uppercase">12 Meses</span>
                               <p className="text-sm font-black text-white">{formatCurrency(currentPrices.cuota12Meses)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                               <span className="text-[9px] text-slate-500 font-bold uppercase">15 Meses</span>
                               <p className="text-sm font-black text-white">{formatCurrency(currentPrices.cuota15Meses)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                               <span className="text-[9px] text-slate-500 font-bold uppercase">18 Meses</span>
                               <p className="text-sm font-black text-white">{formatCurrency(currentPrices.cuota18Meses)}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Columna Derecha: Formulario Detallado */}
                <div className="md:col-span-2 space-y-8">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-bold">Nombre Comercial *</Label>
                        <Input value={formData.nombre} onChange={(e) => handleNombreChange(e.target.value)} required disabled={formData.source === 'Fastrax'} className="h-12 text-lg font-bold" />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-bold text-xs uppercase text-slate-500">URL Slug (SEO)</Label>
                        <Input 
                          value={formData.url_slug} 
                          onChange={(e) => setFormData({ ...formData, url_slug: e.target.value })} 
                          disabled={formData.source === 'Fastrax'} 
                          className="font-mono text-xs bg-slate-50" 
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <Label className="font-bold">Categoría *</Label>
                           {/* Botón para agregar nueva categoría */}
                           <Button 
                             type="button" 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 text-[10px] font-bold uppercase text-blue-600 hover:bg-blue-50"
                             onClick={() => setIsNewCategoryOpen(true)}
                             disabled={formData.source === 'Fastrax'}
                           >
                             <Plus className="w-3 h-3 mr-1" /> Nueva
                           </Button>
                        </div>
                        <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })} disabled={formData.source === 'Fastrax'}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {categories.map((cat) => <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold">Estado del Producto</Label>
                        <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Activo">Activo (Visible)</SelectItem>
                            <SelectItem value="Inactivo">Inactivo (Oculto)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Códigos Internos y Stock */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Código WOS</Label>
                        <Input value={formData.codigo_wos} onChange={(e) => setFormData({ ...formData, codigo_wos: e.target.value })} disabled={formData.source === 'Fastrax'} className="h-9 text-xs font-mono" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Código PRO</Label>
                        <Input value={formData.codigo_pro} onChange={(e) => setFormData({ ...formData, codigo_pro: e.target.value })} disabled={formData.source === 'Fastrax'} className="h-9 text-xs font-mono" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Código EXT</Label>
                        <Input value={formData.codigo_ext} onChange={(e) => setFormData({ ...formData, codigo_ext: e.target.value })} disabled={formData.source === 'Fastrax'} className="h-9 text-xs font-mono" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-slate-500">Stock</Label>
                        <Input 
                          type="number" 
                          value={formData.stock} 
                          onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} 
                          disabled={formData.source === 'Fastrax'} 
                          className="h-9 text-xs font-bold" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Descripción / Ficha Técnica</Label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        rows={10}
                        disabled={formData.source === 'Fastrax'}
                        className="font-mono text-[11px] leading-relaxed bg-slate-50 border-slate-200"
                        placeholder="Contenido HTML o texto plano de las especificaciones..."
                      />
                    </div>
                  </div>

                  {/* Configuración Comercial Expandida */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
                    <h3 className="font-black text-xs uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" /> Parámetros de Rentabilidad y Crédito
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-blue-600">Costo Base (₲)</Label>
                        <Input type="number" value={formData.costo} onChange={e => setFormData({...formData, costo: e.target.value})} disabled={formData.source === 'Fastrax'} className="h-11 font-black text-base border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500">Margen Contado (%)</Label>
                        <Input type="number" value={formData.margen_porcentaje} onChange={e => setFormData({...formData, margen_porcentaje: e.target.value})} className="h-11 font-bold border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-indigo-600">Interés 6 Meses (%)</Label>
                        <Input type="number" value={formData.interes_6_meses_porcentaje} onChange={e => setFormData({...formData, interes_6_meses_porcentaje: e.target.value})} className="h-11 font-bold border-2 border-indigo-100" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-indigo-600">Interés 12 Meses (%)</Label>
                        <Input type="number" value={formData.interes_12_meses_porcentaje} onChange={e => setFormData({...formData, interes_12_meses_porcentaje: e.target.value})} className="h-11 font-bold border-2 border-indigo-100" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-indigo-600">Interés 15 Meses (%)</Label>
                        <Input type="number" value={formData.interes_15_meses_porcentaje} onChange={e => setFormData({...formData, interes_15_meses_porcentaje: e.target.value})} className="h-11 font-bold border-2 border-indigo-100" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-indigo-600">Interés 18 Meses (%)</Label>
                        <Input type="number" value={formData.interes_18_meses_porcentaje} onChange={e => setFormData({...formData, interes_18_meses_porcentaje: e.target.value})} className="h-11 font-bold border-2 border-indigo-100" />
                      </div>
                    </div>
                  </div>

                  {/* Flags de Visibilidad */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border shadow-sm">
                      <div className="space-y-0.5">
                        <Label htmlFor="destacado" className="font-black text-slate-800">Producto Destacado</Label>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Aparecer en grilla "Top Choice"</p>
                      </div>
                      <Switch id="destacado" checked={formData.destacado} onCheckedChange={v => setFormData({...formData, destacado: v})} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border shadow-sm">
                      <div className="space-y-0.5">
                        <Label htmlFor="show_in_hero" className="font-black text-slate-800">Slider Principal (Hero)</Label>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Promocionar en encabezado</p>
                      </div>
                      <Switch id="show_in_hero" checked={formData.show_in_hero} onCheckedChange={v => setFormData({...formData, show_in_hero: v})} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-8 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-12 px-8 uppercase font-black text-xs tracking-widest">
                      Descartar
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-12 px-10 uppercase font-black text-xs tracking-widest shadow-lg shadow-blue-900/20">
                      {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                      {loading ? "Guardando..." : "Confirmar Cambios"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Category Modal */}
      <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Nueva Categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label>Nombre de la Categoría</Label>
                  <Input 
                     value={newCategoryName} 
                     onChange={e => setNewCategoryName(e.target.value)} 
                     placeholder="Ej: Televisores"
                  />
               </div>
               <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewCategoryOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}>
                     {creatingCategory ? "Guardando..." : "Crear Categoría"}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </>
  );
}
