"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Trash2, Edit, CreditCard, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import InvoicePreview from "./InvoicePreview";

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

export default function SalesTable() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    payment_method: "",
  });

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, typeFilter, sales]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error loading sales:", error);
      alert("Error al cargar las ventas");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sales];

    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
          sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.customer_phone?.includes(searchTerm) ||
          sale.id.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sale) => sale.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((sale) => sale.sale_type === typeFilter);
    }

    setFilteredSales(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta venta?")) return;

    try {
      const { error } = await supabase.from("sales").delete().eq("id", id);

      if (error) throw error;
      alert("Venta eliminada exitosamente");
      loadSales();
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Error al eliminar la venta");
    }
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setEditData({
      status: sale.status,
      payment_method: sale.payment_method,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSale) return;

    try {
      const { error } = await supabase
        .from("sales")
        .update({
          status: editData.status,
          payment_method: editData.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSale.id);

      if (error) throw error;
      alert("Venta actualizada exitosamente");
      setShowEditModal(false);
      loadSales();
    } catch (error) {
      console.error("Error updating sale:", error);
      alert("Error al actualizar la venta");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completada: "bg-green-100 text-green-800",
      pendiente: "bg-yellow-100 text-yellow-800",
      cancelada: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || ""}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === "credito" ? (
      <Badge className="bg-blue-100 text-blue-800">CRÉDITO</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">CONTADO</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, teléfono o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="contado">Contado</SelectItem>
                <SelectItem value="credito">Crédito</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Meses</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Cargando ventas...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron ventas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{sale.customer_name}</div>
                          {sale.customer_phone && (
                            <div className="text-xs text-gray-500">{sale.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(sale.sale_type)}</TableCell>
                      <TableCell className="capitalize">{sale.payment_method}</TableCell>
                      <TableCell>{sale.credit_months || "-"}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(Number(sale.total))}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(sale.created_at).toLocaleDateString("es-PY")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowInvoiceModal(true);
                            }}
                            title="Ver Factura"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowDetailModal(true);
                            }}
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(sale)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(sale.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalle */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Cliente</Label>
                  <p className="font-medium">{selectedSale.customer_name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Teléfono</Label>
                  <p className="font-medium">{selectedSale.customer_phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Dirección</Label>
                  <p className="font-medium">{selectedSale.customer_address || "-"}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Tipo de Venta</Label>
                  <p>{getTypeBadge(selectedSale.sale_type)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Método de Pago</Label>
                  <p className="font-medium capitalize">{selectedSale.payment_method}</p>
                </div>
                {selectedSale.credit_months && (
                  <div>
                    <Label className="text-gray-600">Meses de Crédito</Label>
                    <p className="font-medium">{selectedSale.credit_months}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <p>{getStatusBadge(selectedSale.status)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Total</Label>
                  <p className="font-bold text-green-600 text-xl">
                    {formatCurrency(Number(selectedSale.total))}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Productos</Label>
                <div className="mt-2 space-y-2">
                  {selectedSale.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.precio)}</p>
                        <p className="text-sm text-gray-600">
                          Subtotal: {formatCurrency(item.precio * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={editData.status}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select
                value={editData.payment_method}
                onValueChange={(value) => setEditData({ ...editData, payment_method: value })}
              >
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

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Factura */}
      <InvoicePreview
        sale={selectedSale}
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
}
