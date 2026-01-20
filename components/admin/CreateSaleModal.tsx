"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  total: number;
}

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

export default function CreateSaleModal({ isOpen, onClose, order, onSuccess }: CreateSaleModalProps) {
  const [saleType, setSaleType] = useState<"contado" | "credito">("contado");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [creditMonths, setCreditMonths] = useState(6);
  const [firstPaymentDate, setFirstPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!order) return;

    setSaving(true);
    try {
      // Crear la venta
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          order_id: order.id,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          items: order.items,
          total: order.total,
          sale_type: saleType,
          payment_method: paymentMethod,
          credit_months: saleType === "credito" ? creditMonths : null,
          status: "completada",
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Si es a crédito, crear las cuotas mensuales
      if (saleType === "credito" && sale) {
        const monthlyAmount = order.total / creditMonths;
        const installments = [];

        for (let i = 1; i <= creditMonths; i++) {
          const dueDate = new Date(firstPaymentDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));

          installments.push({
            sale_id: sale.id,
            installment_number: i,
            amount_due: monthlyAmount,
            amount_paid: 0,
            due_date: dueDate.toISOString().split("T")[0],
            payment_date: null,
            status: "pending",
          });
        }

        const { error: installmentsError } = await supabase
          .from("credit_payments")
          .insert(installments);

        if (installmentsError) throw installmentsError;
      }

      alert("Venta creada exitosamente");
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Error al crear la venta");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSaleType("contado");
    setPaymentMethod("efectivo");
    setCreditMonths(6);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Venta desde Pedido</DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Resumen del Pedido</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-600">Cliente:</span> {order.customer_name}
                </p>
                <p>
                  <span className="text-gray-600">Total:</span> ₲{" "}
                  {Number(order.total).toLocaleString("es-PY")}
                </p>
                <p>
                  <span className="text-gray-600">Productos:</span> {order.items.length}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Tipo de Venta</Label>
                <RadioGroup value={saleType} onValueChange={(value) => setSaleType(value as "contado" | "credito")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contado" id="contado" />
                    <Label htmlFor="contado" className="cursor-pointer">
                      Contado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credito" id="credito" />
                    <Label htmlFor="credito" className="cursor-pointer">
                      Crédito
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {saleType === "credito" && (
                <>
                  <div>
                    <Label htmlFor="credit_months">Meses de Crédito</Label>
                    <Input
                      id="credit_months"
                      type="number"
                      min="1"
                      max="36"
                      value={creditMonths}
                      onChange={(e) => setCreditMonths(Number(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cuota mensual: ₲ {(order.total / creditMonths).toLocaleString("es-PY")}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="first_payment_date">Fecha del Primer Pago</Label>
                    <Input
                      id="first_payment_date"
                      type="date"
                      value={firstPaymentDate}
                      onChange={(e) => setFirstPaymentDate(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Los pagos siguientes vencerán cada mes a partir de esta fecha
                    </p>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Creando..." : "Crear Venta"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
