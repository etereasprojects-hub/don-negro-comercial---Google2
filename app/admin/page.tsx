'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Save, Upload } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin settings
  const [chatWebhookUrl, setChatWebhookUrl] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [creatorLogoUrl, setCreatorLogoUrl] = useState('');
  const [settingsId, setSettingsId] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setChatWebhookUrl(data.chat_webhook_url || '');
        setChatEnabled(data.chat_enabled ?? true);
        setCreatorLogoUrl(data.creator_logo_url || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones',
        variant: 'destructive',
      });
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('admin_password')
        .single();

      if (error) throw error;

      if (data && data.admin_password === password) {
        setIsAuthenticated(true);
        toast({
          title: 'Acceso concedido',
          description: 'Bienvenido al panel de administración',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Contraseña incorrecta',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: 'Error',
        description: 'Error al verificar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          chat_webhook_url: chatWebhookUrl,
          chat_enabled: chatEnabled,
          creator_logo_url: creatorLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settingsId);

      if (error) throw error;

      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han guardado correctamente',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar las configuraciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen válido',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo debe ser menor a 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `creator-logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setCreatorLogoUrl(urlData.publicUrl);

      toast({
        title: 'Logo cargado',
        description: 'El logo se ha subido correctamente',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el logo: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Panel de Administración</CardTitle>
            <CardDescription className="text-center">
              Ingresa la contraseña para acceder a la configuración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ingresa la contraseña"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading || !password}
                className="w-full"
              >
                {loading ? 'Verificando...' : 'Ingresar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Configura el chat y la apariencia del sitio</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
            }}
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Chat Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Chat</CardTitle>
            <CardDescription>
              Configura el webhook de n8n y controla la visibilidad del chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook">URL del Webhook de n8n</Label>
              <Input
                id="webhook"
                type="url"
                value={chatWebhookUrl}
                onChange={(e) => setChatWebhookUrl(e.target.value)}
                placeholder="https://tu-instancia.n8n.cloud/webhook/..."
              />
              <p className="text-sm text-gray-500">
                Esta URL será utilizada por el chat para enviar mensajes al flujo de IA
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chat-enabled">Chat Widget Activo</Label>
                <p className="text-sm text-gray-500">
                  Activa o desactiva la visibilidad del chat en el sitio
                </p>
              </div>
              <Switch
                id="chat-enabled"
                checked={chatEnabled}
                onCheckedChange={setChatEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Creator Logo Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Logo del Creador</CardTitle>
            <CardDescription>
              Sube un logo desde tu computadora o ingresa una URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Subir Logo desde Computadora</Label>
              <div className="flex gap-2">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="flex-1"
                />
                {uploadingLogo && (
                  <div className="flex items-center px-4">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Formatos aceptados: JPG, PNG, GIF, WebP, SVG. Tamaño máximo: 5MB
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">O</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">URL del Logo</Label>
              <Input
                id="logo-url"
                type="url"
                value={creatorLogoUrl}
                onChange={(e) => setCreatorLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
              />
              <p className="text-sm text-gray-500">
                O ingresa una URL directa de un logo ya hospedado
              </p>
            </div>

            {creatorLogoUrl && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Esta web fue creada por:</span>
                  <img
                    src={creatorLogoUrl}
                    alt="Creator Logo"
                    className="h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            size="lg"
            className="min-w-[200px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
