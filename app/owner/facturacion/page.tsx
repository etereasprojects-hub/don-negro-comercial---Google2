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
import { Receipt, Save } from "lucide-react";

interface BillingInfo {
  id: string;
  business_name: string;
  ruc: string;
  address: string;
  phone: string;
  timbrado: string;
  codigo_control: string;
  vigencia_inicio: string;
  ruc_empresa: string;
  factura_virtual: string;
  invoice_prefix: string;
  last_invoice_number: number;
}

export default function BillingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    ruc: "",
    address: "",
    phone: "",
    timbrado: "",
    codigo_control: "",
    vigencia_inicio: "",
    ruc_empresa: "",
    factura_virtual: "",
    invoice_prefix: "001-001-",
    last_invoice_number: 0,
  });

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadBillingInfo();
    }
  }, [router]);

  const loadBillingInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("billing_information")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBillingInfo(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error loading billing info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (billingInfo) {
        const { error } = await supabase
          .from("billing_information")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", billingInfo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("billing_information").insert([formData]);

        if (error) throw error;
      }

      alert("Información de facturación guardada exitosamente");
      loadBillingInfo();
    } catch (error) {
      console.error("Error saving billing info:", error);
      alert("Error al guardar la información");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="facturacion" />
      <div className="max-w-[1000px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7" />
            Configuración de Facturación
          </h1>
          <p className="text-gray-600 mt-1">
            Configura los datos de tu empresa para generar facturas
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando información...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Razón Social / Nombre</Label>
                    <Input
                      value={formData.business_name}
                      onChange={(e) =>
                        setFormData({ ...formData, business_name: e.target.value })
                      }
                      placeholder="Ej: LUJAN DE LEDESMA SANDRA ELVIRA"
                    />
                  </div>
                  <div>
                    <Label>RUC / Cédula de Identidad</Label>
                    <Input
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      placeholder="Ej: 3239968-5"
                    />
                  </div>
                </div>

                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ej: CALLE, ANA IRIS DE FERREIRO C/ LIONEL LARA NUMERO #9999 //CASA"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ej: (021)294233"
                    />
                  </div>
                  <div>
                    <Label>RUC Empresa</Label>
                    <Input
                      value={formData.ruc_empresa}
                      onChange={(e) =>
                        setFormData({ ...formData, ruc_empresa: e.target.value })
                      }
                      placeholder="Ej: 4735695-2"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold mb-4">Información de Timbrado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Número de Timbrado</Label>
                      <Input
                        value={formData.timbrado}
                        onChange={(e) =>
                          setFormData({ ...formData, timbrado: e.target.value })
                        }
                        placeholder="Ej: 16216612"
                      />
                    </div>
                    <div>
                      <Label>Código de Control</Label>
                      <Input
                        value={formData.codigo_control}
                        onChange={(e) =>
                          setFormData({ ...formData, codigo_control: e.target.value })
                        }
                        placeholder="Ej: 7EDA0808"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Inicio de Vigencia</Label>
                      <Input
                        type="date"
                        value={formData.vigencia_inicio}
                        onChange={(e) =>
                          setFormData({ ...formData, vigencia_inicio: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Factura Virtual</Label>
                      <Input
                        value={formData.factura_virtual}
                        onChange={(e) =>
                          setFormData({ ...formData, factura_virtual: e.target.value })
                        }
                        placeholder="Ej: 001-001-0000023"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold mb-4">Numeración de Facturas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prefijo de Factura</Label>
                      <Input
                        value={formData.invoice_prefix}
                        onChange={(e) =>
                          setFormData({ ...formData, invoice_prefix: e.target.value })
                        }
                        placeholder="Ej: 001-001-"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        El número de factura se generará automáticamente
                      </p>
                    </div>
                    <div>
                      <Label>Último Número de Factura</Label>
                      <Input
                        type="number"
                        value={formData.last_invoice_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_invoice_number: parseInt(e.target.value),
                          })
                        }
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        La próxima factura será: {formData.invoice_prefix}
                        {String(formData.last_invoice_number + 1).padStart(7, "0")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Guardando..." : "Guardar Configuración"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                1. Completa todos los datos de tu empresa para poder generar facturas.
              </p>
              <p>
                2. El número de timbrado y código de control son proporcionados por la SET
                (Subsecretaría de Estado de Tributación).
              </p>
              <p>
                3. El sistema generará automáticamente el número correlativo de cada factura.
              </p>
              <p>
                4. Una vez configurado, podrás generar facturas desde la sección de Ventas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
