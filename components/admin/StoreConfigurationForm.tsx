"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Upload, Facebook, Instagram, Twitter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StoreConfig {
  id: string;
  store_name: string;
  logo_url: string | null;
  email: string | null;
  whatsapp_number: string | null;
  whatsapp_24_7: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  icon_name: string;
  display_order: number;
}

interface StoreHours {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const socialPlatforms = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter (X)', icon: Twitter },
  { value: 'tiktok', label: 'TikTok', icon: null },
  { value: 'reddit', label: 'Reddit', icon: null },
  { value: 'linkedin', label: 'LinkedIn', icon: null },
  { value: 'youtube', label: 'YouTube', icon: null },
];

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function StoreConfigurationForm() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [hours, setHours] = useState<StoreHours[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [newLocation, setNewLocation] = useState({ name: '', address: '', phone: '' });
  const [newSocial, setNewSocial] = useState({ platform: 'facebook', url: '' });

  useEffect(() => {
    loadConfiguration();
    loadLocations();
    loadSocialMedia();
    loadHours();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('store_configuration')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) setConfig(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('store_locations')
        .select('*')
        .order('created_at');

      if (error) throw error;
      if (data) setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadSocialMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('store_social_media')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setSocialMedia(data);
    } catch (error) {
      console.error('Error loading social media:', error);
    }
  };

  const loadHours = async () => {
    try {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      if (data && data.length > 0) {
        setHours(data);
      } else {
        const defaultHours = Array.from({ length: 7 }, (_, i) => ({
          id: `temp-${i}`,
          day_of_week: i,
          open_time: '09:00',
          close_time: '18:00',
          is_closed: i === 0,
        }));
        setHours(defaultHours);
      }
    } catch (error) {
      console.error('Error loading hours:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('store_configuration')
        .update({
          store_name: config.store_name,
          email: config.email,
          whatsapp_number: config.whatsapp_number,
          whatsapp_24_7: config.whatsapp_24_7,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  // Fixed React namespace error by importing React
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !config) return;

    const file = e.target.files[0];
    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('store_configuration')
        .update({ logo_url: publicUrl })
        .eq('id', config.id);

      if (updateError) throw updateError;

      setConfig({ ...config, logo_url: publicUrl });
      alert('Logo actualizado exitosamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      alert('Por favor completa el nombre y la dirección');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('store_locations')
        .insert([newLocation])
        .select()
        .single();

      if (error) throw error;
      setLocations([...locations, data]);
      setNewLocation({ name: '', address: '', phone: '' });
      alert('Ubicación agregada exitosamente');
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Error al agregar la ubicación');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ubicación?')) return;

    try {
      const { error } = await supabase
        .from('store_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLocations(locations.filter(l => l.id !== id));
      alert('Ubicación eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Error al eliminar la ubicación');
    }
  };

  const handleAddSocial = async () => {
    if (!newSocial.url) {
      alert('Por favor ingresa la URL');
      return;
    }

    try {
      const platform = socialPlatforms.find(p => p.value === newSocial.platform);
      const { data, error } = await supabase
        .from('store_social_media')
        .insert([{
          platform: newSocial.platform,
          url: newSocial.url,
          icon_name: newSocial.platform,
          display_order: socialMedia.length,
        }])
        .select()
        .single();

      if (error) throw error;
      setSocialMedia([...socialMedia, data]);
      setNewSocial({ platform: 'facebook', url: '' });
      alert('Red social agregada exitosamente');
    } catch (error) {
      console.error('Error adding social media:', error);
      alert('Error al agregar la red social');
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta red social?')) return;

    try {
      const { error } = await supabase
        .from('store_social_media')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSocialMedia(socialMedia.filter(s => s.id !== id));
      alert('Red social eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting social media:', error);
      alert('Error al eliminar la red social');
    }
  };

  const handleUpdateHour = (dayOfWeek: number, field: keyof StoreHours, value: any) => {
    setHours(hours.map(h =>
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleSaveHours = async () => {
    setLoading(true);
    try {
      for (const hour of hours) {
        if (hour.id.startsWith('temp-')) {
          await supabase
            .from('store_hours')
            .insert({
              day_of_week: hour.day_of_week,
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed,
            });
        } else {
          await supabase
            .from('store_hours')
            .update({
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed,
              updated_at: new Date().toISOString(),
            })
            .eq('id', hour.id);
        }
      }
      alert('Horarios guardados exitosamente');
      await loadHours();
    } catch (error) {
      console.error('Error saving hours:', error);
      alert('Error al guardar los horarios');
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return <div className="text-center py-12">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Comercio</label>
            <Input
              value={config.store_name}
              onChange={(e) => setConfig({ ...config, store_name: e.target.value })}
              placeholder="Nombre del comercio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={config.email || ''}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp</label>
              <Input
                type="tel"
                value={config.whatsapp_number || ''}
                onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                placeholder="+595981234567"
              />
              <p className="text-xs text-gray-500 mt-1">Incluye código de país (ej: +595)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp 24/7</label>
              <Input
                type="tel"
                value={config.whatsapp_24_7 || ''}
                onChange={(e) => setConfig({ ...config, whatsapp_24_7: e.target.value })}
                placeholder="+595987654321"
              />
              <p className="text-xs text-gray-500 mt-1">Número disponible 24/7</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Logo del Comercio</label>
            {config.logo_url && (
              <div className="mb-4">
                <img src={config.logo_url} alt="Logo" className="h-24 object-contain" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="flex-1"
              />
              {uploadingLogo && <span className="text-sm text-gray-500">Subiendo...</span>}
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {locations.map((location) => (
              <div key={location.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">{location.name}</h4>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  {location.phone && <p className="text-sm text-gray-600">Tel: {location.phone}</p>}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteLocation(location.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold">Agregar Nueva Ubicación</h4>
            <Input
              placeholder="Nombre del local"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            />
            <Input
              placeholder="Dirección"
              value={newLocation.address}
              onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
            />
            <Input
              placeholder="Teléfono (opcional)"
              value={newLocation.phone}
              onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })}
            />
            <Button onClick={handleAddLocation} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Ubicación
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes Sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {socialMedia.map((social) => {
              const platform = socialPlatforms.find(p => p.value === social.platform);
              return (
                <div key={social.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Badge>{platform?.label || social.platform}</Badge>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                  >
                    {social.url}
                  </a>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSocial(social.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold">Agregar Red Social</h4>
            <select
              value={newSocial.platform}
              onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {socialPlatforms.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="URL de la red social"
              value={newSocial.url}
              onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
            />
            <Button onClick={handleAddSocial} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Red Social
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horarios de Atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {hours.map((hour) => (
              <div key={hour.day_of_week} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-24 font-semibold">
                  {daysOfWeek[hour.day_of_week]}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hour.is_closed}
                      onChange={(e) => handleUpdateHour(hour.day_of_week, 'is_closed', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Cerrado</span>
                  </label>
                  {!hour.is_closed && (
                    <>
                      <Input
                        type="time"
                        value={hour.open_time || ''}
                        onChange={(e) => handleUpdateHour(hour.day_of_week, 'open_time', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm">a</span>
                      <Input
                        type="time"
                        value={hour.close_time || ''}
                        onChange={(e) => handleUpdateHour(hour.day_of_week, 'close_time', e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveHours} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Horarios'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
