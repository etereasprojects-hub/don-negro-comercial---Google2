"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Comment: Added Badge to imports to fix "Cannot find name 'Badge'" errors on lines 297, 299, 345, 347
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Banner {
  id: string;
  section: string;
  desktop_image_url: string;
  mobile_image_url: string;
  link_url: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
}

const SECTIONS = [
  { value: "hero_featured", label: "Entre Hero y Productos Destacados" },
  { value: "catalog_top", label: "Catálogo - Superior" },
  { value: "catalog_bottom", label: "Catálogo - Inferior" },
  { value: "product_bottom", label: "Página de Producto - Inferior" },
];

export default function BannersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("hero_featured");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>("");
  const [mobilePreview, setMobilePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBanners();
    }
  }, [selectedSection, isAuthenticated]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("section", selectedSection)
        .order("order", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (e) {
      console.error("Error loading banners:", e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (banner: Banner | null = null) => {
    if (banner) {
      setEditingBanner(banner);
      setDesktopImageUrl(banner.desktop_image_url);
      setMobileImageUrl(banner.mobile_image_url);
      setLinkUrl(banner.link_url || "");
      setIsActive(banner.is_active);
      setUploadMode("url");
    } else {
      setEditingBanner(null);
      setDesktopImageUrl("");
      setMobileImageUrl("");
      setLinkUrl("");
      setIsActive(true);
      setUploadMode("file");
    }
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview("");
    setMobilePreview("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setUploading(false);
  };

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setDesktopPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setMobilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, type: "desktop" | "mobile"): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${selectedSection}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let finalDesktopUrl = desktopImageUrl;
      let finalMobileUrl = mobileImageUrl;

      if (uploadMode === "file") {
        if (!editingBanner && (!desktopFile || !mobileFile)) {
          alert("Por favor selecciona ambas imágenes.");
          setUploading(false);
          return;
        }
        if (desktopFile) finalDesktopUrl = await uploadFile(desktopFile, "desktop");
        if (mobileFile) finalMobileUrl = await uploadFile(mobileFile, "mobile");
      }

      const dataToSave = {
        section: selectedSection,
        desktop_image_url: finalDesktopUrl,
        mobile_image_url: finalMobileUrl,
        link_url: linkUrl || null,
        is_active: isActive,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from("banners")
          .update(dataToSave)
          .eq("id", editingBanner.id);
        if (error) throw error;
      } else {
        const { data: maxOrder } = await supabase
          .from("banners")
          .select("order")
          .eq("section", selectedSection)
          .order("order", { ascending: false })
          .limit(1)
          .maybeSingle();

        const newOrder = maxOrder ? maxOrder.order + 1 : 0;
        const { error } = await supabase.from("banners").insert({ ...dataToSave, order: newOrder });
        if (error) throw error;
      }

      alert("Banner guardado exitosamente");
      closeModal();
      loadBanners();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este banner?")) return;
    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      loadBanners();
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      alert("Error al eliminar: " + error.message);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);
    if (!error) loadBanners();
  };

  const handleReorder = async (bannerId: string, direction: "up" | "down") => {
    const currentIndex = banners.findIndex((b) => b.id === bannerId);
    if ((direction === "up" && currentIndex === 0) || (direction === "down" && currentIndex === banners.length - 1)) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newBanners = [...banners];
    const [movedBanner] = newBanners.splice(currentIndex, 1);
    newBanners.splice(newIndex, 0, movedBanner);

    const updates = newBanners.map((banner, index) => ({
      id: banner.id,
      order: index,
    }));

    try {
      for (const update of updates) {
        await supabase.from("banners").update({ order: update.order }).eq("id", update.id);
      }
      loadBanners();
    } catch (error) {
      console.error("Error reordering banners:", error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="banners" />
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Banners Publicitarios</h1>
            <p className="text-gray-600 mt-1">Gestiona los sliders y publicidad de secciones específicas.</p>
          </div>
          <Button onClick={() => openModal()} className="gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold h-11 px-6 shadow-lg shadow-pink-900/10">
            <Plus className="w-4 h-4" />
            Nuevo Banner
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Sección del Sitio</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-11 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section.value} value={section.value}>{section.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end h-11">
               <Badge variant="outline" className="h-full px-4 border-slate-200 text-slate-400 font-bold uppercase tracking-tighter">
                  {banners.length} Banners registrados
               </Badge>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consultando base de datos...</p>
          </div>
        ) : banners.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50">
            <CardContent className="py-20 text-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No hay banners en esta sección</p>
              <Button variant="link" onClick={() => openModal()} className="text-pink-600 font-black uppercase text-[10px] mt-2">Crear mi primer banner</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-20">
            {banners.map((banner, index) => (
              <Card key={banner.id} className="group hover:shadow-md transition-shadow border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex flex-row md:flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleReorder(banner.id, "up")} disabled={index === 0} className="h-8 w-8 p-0"><GripVertical className="w-4 h-4 text-slate-400" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReorder(banner.id, "down")} disabled={index === banners.length - 1} className="h-8 w-8 p-0"><GripVertical className="w-4 h-4 text-slate-400" /></Button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Escritorio</p>
                        <div className="aspect-[8/1] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          <img src={banner.desktop_image_url} alt="Desktop" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Móvil</p>
                        <div className="aspect-[2/1] md:aspect-[4/1] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 w-full md:max-w-[200px]">
                          <img src={banner.mobile_image_url} alt="Mobile" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="flex-1 md:flex-none">
                         <Badge className={`font-black tracking-tighter ${banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                           {banner.is_active ? "VISIBLE" : "OCULTO"}
                         </Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(banner)} title="Ocultar/Mostrar">{banner.is_active ? <EyeOff size={14} /> : <Eye size={14} />}</Button>
                        <Button variant="outline" size="sm" onClick={() => openModal(banner)} className="text-blue-600"><Edit size={14} /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(banner.id)} className="text-red-600 hover:bg-red-50"><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase italic font-black">
              {editingBanner ? "Actualizar Banner" : "Registrar Banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "url")}>
              <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100">
                <TabsTrigger value="file" className="font-bold">Subir Archivos</TabsTrigger>
                <TabsTrigger value="url" className="font-bold">Usar URLs Externas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase text-slate-500">Imagen Desktop (PNG/JPG)</Label>
                     <Input type="file" accept="image/*" onChange={handleDesktopFileChange} className="cursor-pointer" />
                     {desktopPreview && <img src={desktopPreview} className="mt-2 h-20 w-full object-cover rounded border" />}
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase text-slate-500">Imagen Mobile (PNG/JPG)</Label>
                     <Input type="file" accept="image/*" onChange={handleMobileFileChange} className="cursor-pointer" />
                     {mobilePreview && <img src={mobilePreview} className="mt-2 h-20 w-full object-cover rounded border" />}
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-slate-500">URL Imagen Desktop</Label>
                    <Input placeholder="https://..." value={desktopImageUrl} onChange={(e) => setDesktopImageUrl(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-slate-500">URL Imagen Mobile</Label>
                    <Input placeholder="https://..." value={mobileImageUrl} onChange={(e) => setMobileImageUrl(e.target.value)} className="h-11" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 border-t pt-4">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Enlace de Destino (Opcional)</Label>
                <Input placeholder="https://donegro.com/categoria/ofertas" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="h-11" />
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border">
                <Switch id="is-active-modal" checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-pink-600" />
                <Label htmlFor="is-active-modal" className="font-bold cursor-pointer">Activar inmediatamente</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={uploading} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-black h-12">
                {uploading ? <Loader2 className="animate-spin mr-2" /> : null}
                {editingBanner ? "ACTUALIZAR CAMBIOS" : "GUARDAR BANNER"}
              </Button>
              <Button onClick={() => setIsModalOpen(false)} variant="outline" className="h-12 px-8 font-bold">CANCELAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
