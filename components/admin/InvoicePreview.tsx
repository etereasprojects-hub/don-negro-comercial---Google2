"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Sale {
  id: string;
  order_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: any[];
  total: number;
  sale_type: string;
  payment_method: string;
  credit_months: number | null;
  status: string;
  created_at: string;
}

interface BillingInfo {
  business_name: string;
  ruc: string;
  address: string;
  phone: string | null;
  timbrado: string | null;
  codigo_control: string | null;
  vigencia_inicio: string | null;
  ruc_empresa: string | null;
  factura_virtual: string | null;
  invoice_prefix: string;
  last_invoice_number: number;
}

interface InvoicePreviewProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

export default function InvoicePreview({ sale, open, onClose }: InvoicePreviewProps) {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadBillingInfo();
    }
  }, [open]);

  const loadBillingInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("billing_information")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      setBillingInfo(data);
    } catch (error) {
      console.error("Error loading billing info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Factura ${getInvoiceNumber()}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  color: #000;
                }
                .invoice-container {
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 20px;
                  margin-bottom: 20px;
                }
                .header h1 {
                  margin: 0 0 10px 0;
                  font-size: 28px;
                  color: #000;
                }
                .header p {
                  margin: 5px 0;
                  font-size: 14px;
                }
                .invoice-details {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
                }
                .detail-section h3 {
                  font-size: 14px;
                  margin: 0 0 10px 0;
                  font-weight: bold;
                  border-bottom: 1px solid #ccc;
                  padding-bottom: 5px;
                }
                .detail-section p {
                  margin: 5px 0;
                  font-size: 13px;
                }
                .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                .items-table th {
                  background: #f5f5f5;
                  padding: 10px;
                  text-align: left;
                  font-size: 12px;
                  border: 1px solid #ddd;
                }
                .items-table td {
                  padding: 10px;
                  border: 1px solid #ddd;
                  font-size: 12px;
                }
                .total-section {
                  text-align: right;
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 2px solid #000;
                }
                .total-section p {
                  margin: 5px 0;
                  font-size: 14px;
                }
                .total-amount {
                  font-size: 24px;
                  font-weight: bold;
                  color: #000;
                  margin-top: 10px;
                }
                .footer {
                  margin-top: 40px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                  border-top: 1px solid #ccc;
                  padding-top: 20px;
                }
                @media print {
                  body {
                    padding: 0;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const getInvoiceNumber = () => {
    if (!billingInfo) return "N/A";
    const invoiceNum = (billingInfo.last_invoice_number + 1).toString().padStart(7, "0");
    return `${billingInfo.invoice_prefix}${invoiceNum}`;
  };

  const calculateTotal = () => {
    if (!sale) return 0;

    if (sale.sale_type === "credito" && sale.credit_months) {
      const monthlyPayment = sale.total;
      return monthlyPayment * sale.credit_months;
    }

    return sale.total;
  };

  const calculateSubtotal = () => {
    if (!sale) return 0;
    const total = calculateTotal();
    return total / 1.1;
  };

  const calculateIVA = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1;
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Factura - {getInvoiceNumber()}</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando información de facturación...</p>
          </div>
        ) : !billingInfo ? (
          <div className="text-center py-8">
            <p className="text-red-600">
              No hay información de facturación configurada.
              Por favor, configure los datos de facturación primero.
            </p>
          </div>
        ) : (
          <div ref={printRef} className="invoice-container">
            <div className="header">
              <h1>{billingInfo.business_name}</h1>
              <p>RUC: {billingInfo.ruc}</p>
              <p>{billingInfo.address}</p>
              {billingInfo.phone && <p>Tel: {billingInfo.phone}</p>}
              {billingInfo.timbrado && <p>Timbrado N°: {billingInfo.timbrado}</p>}
              {billingInfo.vigencia_inicio && (
                <p>Vigencia: {format(new Date(billingInfo.vigencia_inicio), "dd/MM/yyyy")}</p>
              )}
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: "10px 0" }}>FACTURA</h2>
              <p style={{ fontSize: "16px", fontWeight: "bold" }}>{getInvoiceNumber()}</p>
              <p style={{ fontSize: "14px" }}>
                Fecha: {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>

            <div className="invoice-details">
              <div className="detail-section">
                <h3>Datos del Cliente</h3>
                <p><strong>Nombre:</strong> {sale.customer_name}</p>
                {sale.customer_phone && <p><strong>Teléfono:</strong> {sale.customer_phone}</p>}
                {sale.customer_address && <p><strong>Dirección:</strong> {sale.customer_address}</p>}
              </div>

              <div className="detail-section">
                <h3>Datos de la Venta</h3>
                <p><strong>Tipo:</strong> {sale.sale_type === "credito" ? "CRÉDITO" : "CONTADO"}</p>
                <p><strong>Método de Pago:</strong> {sale.payment_method.toUpperCase()}</p>
                {sale.sale_type === "credito" && sale.credit_months && (
                  <>
                    <p><strong>Cuotas:</strong> {sale.credit_months} meses</p>
                    <p><strong>Cuota Mensual:</strong> {formatCurrency(sale.total)}</p>
                  </>
                )}
                <p><strong>Estado:</strong> {sale.status.toUpperCase()}</p>
              </div>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: "center" }}>Cantidad</th>
                  <th style={{ textAlign: "right" }}>Precio Unit.</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td>{item.nombre}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(item.precio)}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(item.precio * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="total-section">
              <p><strong>Subtotal (Gravado 10%):</strong> {formatCurrency(calculateSubtotal())}</p>
              <p><strong>IVA (10%):</strong> {formatCurrency(calculateIVA())}</p>
              {sale.sale_type === "credito" && sale.credit_months && (
                <p style={{ color: "#0066cc", fontSize: "16px", marginTop: "10px" }}>
                  <strong>
                    Total a Crédito ({sale.credit_months} cuotas de {formatCurrency(sale.total)}):
                  </strong>
                </p>
              )}
              <p className="total-amount">TOTAL: {formatCurrency(calculateTotal())}</p>
            </div>

            <div className="footer">
              <p>¡Gracias por su compra!</p>
              <p>Este documento es válido como comprobante de venta</p>
              {billingInfo.codigo_control && (
                <p style={{ fontSize: "10px", marginTop: "10px" }}>
                  Código de Control: {billingInfo.codigo_control}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
