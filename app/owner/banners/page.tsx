"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Image as ImageIcon, Upload } from "lucide-react";
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
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("section", selectedSection)
      .order("order", { ascending: true });

    if (error) {
      console.error("Error loading banners:", error);
    } else {
      setBanners(data || []);
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
    setDesktopImageUrl("");
    setMobileImageUrl("");
    setLinkUrl("");
    setIsActive(true);
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview("");
    setMobilePreview("");
    setUploadMode("file");
  };

  // Fixed React namespace error by importing React
  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesktopPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fixed React namespace error by importing React
  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMobilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, type: "desktop" | "mobile"): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${selectedSection}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    let finalDesktopUrl = desktopImageUrl;
    let finalMobileUrl = mobileImageUrl;

    try {
      setUploading(true);

      if (uploadMode === "file") {
        if (!desktopFile || !mobileFile) {
          alert("Por favor selecciona ambas imágenes (desktop y mobile)");
          setUploading(false);
          return;
        }

        finalDesktopUrl = await uploadFile(desktopFile, "desktop");
        finalMobileUrl = await uploadFile(mobileFile, "mobile");
      } else {
        if (!desktopImageUrl || !mobileImageUrl) {
          alert("Por favor ingresa ambas URLs de imagen (desktop y mobile)");
          setUploading(false);
          return;
        }
      }

      if (editingBanner) {
        const { error } = await supabase
          .from("banners")
          .update({
            desktop_image_url: finalDesktopUrl,
            mobile_image_url: finalMobileUrl,
            link_url: linkUrl || null,
            is_active: isActive,
          })
          .eq("id", editingBanner.id);

        if (error) throw error;
      } else {
        const maxOrderResult = await supabase
          .from("banners")
          .select("order")
          .eq("section", selectedSection)
          .order("order", { ascending: false })
          .limit(1)
          .maybeSingle();

        const newOrder = maxOrderResult.data ? maxOrderResult.data.order + 1 : 0;

        const { error } = await supabase.from("banners").insert({
          section: selectedSection,
          desktop_image_url: finalDesktopUrl,
          mobile_image_url: finalMobileUrl,
          link_url: linkUrl || null,
          order: newOrder,
          is_active: isActive,
        });

        if (error) throw error;
      }

      closeModal();
      loadBanners();
    } catch (error) {
      console.error("Error saving banner:", error);
      alert("Error al guardar el banner");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este banner?")) return;

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      console.error("Error deleting banner:", error);
      alert("Error al eliminar el banner");
    } else {
      loadBanners();
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);

    if (error) {
      console.error("Error toggling banner:", error);
      alert("Error al cambiar el estado del banner");
    } else {
      loadBanners();
    }
  };

  const handleReorder = async (bannerId: string, direction: "up" | "down") => {
    const currentIndex = banners.findIndex((b) => b.id === bannerId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === banners.length - 1)
    ) {
      return;
    }

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
      alert("Error al reordenar los banners");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="banners" />
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banners Publicitarios</h1>
          <p className="text-gray-600 mt-1">Gestiona los banners publicitarios de tu tienda</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openModal()} className="gap-2 bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4" />
              Agregar Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Editar Banner" : "Agregar Banner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Archivo
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Ingresar URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="space-y-4">
                  <div>
                    <Label htmlFor="desktop-file">Imagen Desktop (1:8 - horizontal)</Label>
                    <Input
                      id="desktop-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleDesktopFileChange}
                      className="mt-1"
                    />
                    {desktopPreview && (
                      <div className="mt-2 border rounded-lg overflow-hidden">
                        <img
                          src={desktopPreview}
                          alt="Desktop preview"
                          className="w-full h-auto"
                          style={{ maxHeight: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="mobile-file">Imagen Mobile (1:2 - horizontal)</Label>
                    <Input
                      id="mobile-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleMobileFileChange}
                      className="mt-1"
                    />
                    {mobilePreview && (
                      <div className="mt-2 border rounded-lg overflow-hidden max-w-xs mx-auto">
                        <img
                          src={mobilePreview}
                          alt="Mobile preview"
                          className="w-full h-auto"
                          style={{ maxHeight: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="desktop-image">URL de Imagen Desktop (1:8 - horizontal)</Label>
                    <Input
                      id="desktop-image"
                      placeholder="https://ejemplo.com/banner-desktop.jpg"
                      value={desktopImageUrl}
                      onChange={(e) => setDesktopImageUrl(e.target.value)}
                      className="mt-1"
                    />
                    {desktopImageUrl && (
                      <div className="mt-2 border rounded-lg overflow-hidden">
                        <img
                          src={desktopImageUrl}
                          alt="Desktop preview"
                          className="w-full h-auto"
                          style={{ maxHeight: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="mobile-image">URL de Imagen Mobile (1:2 - horizontal)</Label>
                    <Input
                      id="mobile-image"
                      placeholder="https://ejemplo.com/banner-mobile.jpg"
                      value={mobileImageUrl}
                      onChange={(e) => setMobileImageUrl(e.target.value)}
                      className="mt-1"
                    />
                    {mobileImageUrl && (
                      <div className="mt-2 border rounded-lg overflow-hidden max-w-xs mx-auto">
                        <img
                          src={mobileImageUrl}
                          alt="Mobile preview"
                          className="w-full h-auto"
                          style={{ maxHeight: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <div>
                <Label htmlFor="link-url">URL de Enlace (opcional)</Label>
                <Input
                  id="link-url"
                  placeholder="https://ejemplo.com/producto"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si no hay enlace, el botón no se mostrará en el banner
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="is-active">Banner activo</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-pink-600 hover:bg-pink-700"
                  disabled={uploading}
                >
                  {uploading ? "Subiendo..." : editingBanner ? "Actualizar" : "Agregar"}
                </Button>
                <Button onClick={closeModal} variant="outline" className="flex-1" disabled={uploading}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Label>Sección</Label>
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTIONS.map((section) => (
              <SelectItem key={section.value} value={section.value}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay banners en esta sección</p>
            <p className="text-sm text-gray-500 mt-2">
              Agrega un banner para comenzar a mostrar publicidad
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(banner.id, "up")}
                      disabled={index === 0}
                      className="p-1 h-auto"
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(banner.id, "down")}
                      disabled={index === banners.length - 1}
                      className="p-1 h-auto"
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Desktop</p>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={banner.desktop_image_url}
                          alt="Desktop banner"
                          className="w-full h-auto"
                          style={{ maxHeight: "100px", objectFit: "cover" }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Mobile</p>
                      <div className="border rounded-lg overflow-hidden max-w-xs">
                        <img
                          src={banner.mobile_image_url}
                          alt="Mobile banner"
                          className="w-full h-auto"
                          style={{ maxHeight: "100px", objectFit: "cover" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          banner.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {banner.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {banner.link_url && (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate max-w-full"
                      >
                        {banner.link_url}
                      </a>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(banner)}
                        className="gap-2"
                      >
                        {banner.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal(banner)}
                        className="gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
