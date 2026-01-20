"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InvoiceData {
  businessName: string;
  ruc: string;
  address: string;
  phone: string;
  timbrado: string;
  codigoControl: string;
  vigenciaInicio: string;
  rucEmpresa: string;
  facturaVirtual: string;
  invoiceNumber: string;
  customerName: string;
  customerRuc: string;
  customerAddress: string;
  items: Array<{
    quantity: number;
    description: string;
    unitPrice: number;
    exempt: number;
    iva5: number;
    iva10: number;
  }>;
  saleCondition: string;
  saleDate: string;
}

interface InvoiceGeneratorProps {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
}

export default function InvoiceGenerator({
  open,
  onClose,
  invoiceData,
}: InvoiceGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoiceData) return null;

  const totals = invoiceData.items.reduce(
    (acc, item) => ({
      exempt: acc.exempt + item.exempt,
      iva5: acc.iva5 + item.iva5,
      iva10: acc.iva10 + item.iva10,
    }),
    { exempt: 0, iva5: 0, iva10: 0 }
  );

  const subtotal = totals.exempt + totals.iva5 + totals.iva10;
  const liquidacionIva5 = totals.iva5 * 0.05;
  const liquidacionIva10 = totals.iva10 * 0.1;
  const totalIva = liquidacionIva5 + liquidacionIva10;
  const totalAPagar = subtotal;

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Factura ${invoiceData.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; }
                td, th { border: 1px solid black; padding: 8px; }
                .no-border { border: none; }
                .text-right { text-align: right; }
                .text-center { text-center: center; }
                .bold { font-weight: bold; }
                .header-table td { padding: 4px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Factura {invoiceData.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>

          <div ref={printRef} className="bg-white p-8 border">
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr>
                  <td className="border border-black p-3 w-1/2">
                    <div className="text-center font-bold">
                      {invoiceData.businessName}
                    </div>
                    <div className="text-center mt-2">{invoiceData.address}</div>
                    <div className="text-center">({invoiceData.phone})</div>
                  </td>
                  <td className="border border-black p-3 w-1/2">
                    <div className="text-center">
                      <strong>TIMBRADO Nº {invoiceData.timbrado}</strong>
                    </div>
                    <div className="text-center">
                      <strong>CÓDIGO CONTROL {invoiceData.codigoControl}</strong>
                    </div>
                    <div className="text-center">
                      <strong>
                        INICIO DE VIGENCIA{" "}
                        {format(new Date(invoiceData.vigenciaInicio), "dd/MM/yyyy")}
                      </strong>
                    </div>
                    <div className="text-center">
                      <strong>RUC {invoiceData.rucEmpresa}</strong>
                    </div>
                    <div className="text-center">
                      <strong>FACTURA VIRTUAL</strong>
                    </div>
                    <div className="text-center">
                      <strong>{invoiceData.invoiceNumber}</strong>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="border border-black p-3">
                    <strong>FECHA DE EMISIÓN:</strong>{" "}
                    {format(new Date(invoiceData.saleDate), "dd/MM/yyyy")}
                  </td>
                  <td className="border border-black p-3">
                    <strong>CONDICIÓN DE VENTA:</strong> {invoiceData.saleCondition}
                  </td>
                </tr>

                <tr>
                  <td className="border border-black p-3" colSpan={2}>
                    <div>
                      <strong>RUC / CÉDULA DE IDENTIDAD:</strong> {invoiceData.customerRuc}
                    </div>
                    <div>
                      <strong>NOMBRE O RAZÓN SOCIAL:</strong> {invoiceData.customerName}
                    </div>
                    <div>
                      <strong>DIRECCIÓN:</strong> {invoiceData.customerAddress}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border border-black mt-4">
              <thead>
                <tr>
                  <th className="border border-black p-2">Cantidad</th>
                  <th className="border border-black p-2">Descripción</th>
                  <th className="border border-black p-2">Precio Unitario</th>
                  <th className="border border-black p-2" colSpan={3}>
                    Valor Venta
                  </th>
                </tr>
                <tr>
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1">Exentas</th>
                  <th className="border border-black p-1">IVA 5%</th>
                  <th className="border border-black p-1">IVA 10%</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-black p-2">{item.description}</td>
                    <td className="border border-black p-2 text-right">
                      {item.unitPrice.toLocaleString("es-PY")}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {item.exempt > 0 ? item.exempt.toLocaleString("es-PY") : "0"}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {item.iva5 > 0 ? item.iva5.toLocaleString("es-PY") : "0"}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {item.iva10 > 0 ? item.iva10.toLocaleString("es-PY") : "0"}
                    </td>
                  </tr>
                ))}
                {[...Array(Math.max(0, 5 - invoiceData.items.length))].map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td className="border border-black p-2">&nbsp;</td>
                    <td className="border border-black p-2">&nbsp;</td>
                    <td className="border border-black p-2">&nbsp;</td>
                    <td className="border border-black p-2">&nbsp;</td>
                    <td className="border border-black p-2">&nbsp;</td>
                    <td className="border border-black p-2">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="w-full border-collapse border border-black mt-4">
              <tbody>
                <tr>
                  <td className="border border-black p-3" rowSpan={3}>
                    <div className="flex items-center justify-center h-32">
                      QR Code Placeholder
                    </div>
                  </td>
                  <td className="border border-black p-2">
                    <strong>Valor Parcial</strong>
                  </td>
                  <td className="border border-black p-2 text-right">
                    {totals.exempt.toLocaleString("es-PY")}
                  </td>
                  <td className="border border-black p-2 text-right">
                    {totals.iva5.toLocaleString("es-PY")}
                  </td>
                  <td className="border border-black p-2 text-right">
                    {totals.iva10.toLocaleString("es-PY")}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2">
                    <strong>Total a Pagar</strong>
                  </td>
                  <td className="border border-black p-2 text-right" colSpan={3}>
                    <strong>{totalAPagar.toLocaleString("es-PY")}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2">
                    <strong>Liquidación del IVA:</strong>
                  </td>
                  <td className="border border-black p-2 text-right">
                    (5%) {liquidacionIva5.toLocaleString("es-PY")}
                  </td>
                  <td className="border border-black p-2 text-right">
                    (10%) {liquidacionIva10.toLocaleString("es-PY")}
                  </td>
                  <td className="border border-black p-2 text-right">
                    (Total) {totalIva.toLocaleString("es-PY")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
