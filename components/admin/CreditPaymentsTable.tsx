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
import { Search, Edit, Trash2, DollarSign, Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total: number;
  credit_months: number;
  created_at: string;
}

interface Installment {
  id: string;
  sale_id: string;
  installment_number: number;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  notes: string | null;
  sale: Sale;
}

interface Statistics {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
}

export default function CreditPaymentsTable() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    overdueCount: 0,
    paidCount: 0,
    pendingCount: 0,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [editData, setEditData] = useState({
    amount_paid: 0,
    payment_date: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    loadInstallments();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStatistics();
  }, [searchTerm, statusFilter, periodFilter, dateFrom, dateTo, installments]);

  const loadInstallments = async () => {
    setLoading(true);
    try {
      // Primero, actualizar estados de cuotas vencidas
      await updateOverdueStatuses();

      const { data, error } = await supabase
        .from("credit_payments")
        .select(`
          *,
          sale:sales!inner(
            id,
            customer_name,
            customer_phone,
            total,
            credit_months,
            created_at
          )
        `)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Transformar los datos para que tengan la estructura correcta
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        sale: Array.isArray(item.sale) ? item.sale[0] : item.sale,
      }));

      setInstallments(transformedData);
    } catch (error) {
      console.error("Error loading installments:", error);
      alert("Error al cargar las cuotas");
    } finally {
      setLoading(false);
    }
  };

  const updateOverdueStatuses = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("credit_payments")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today);

    if (error) {
      console.error("Error updating overdue statuses:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...installments];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (inst) =>
          inst.sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.sale.customer_phone?.includes(searchTerm) ||
          inst.sale.id.includes(searchTerm)
      );
    }

    // Filtro de estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((inst) => inst.status === statusFilter);
    }

    // Filtro de fecha
    if (dateFrom) {
      filtered = filtered.filter((inst) => inst.due_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((inst) => inst.due_date <= dateTo);
    }

    // Filtro de periodo
    if (periodFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (periodFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          filtered = filtered.filter(
            (inst) => inst.due_date === startDate.toISOString().split("T")[0]
          );
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          filtered = filtered.filter((inst) => inst.due_date >= startDate.toISOString().split("T")[0]);
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          filtered = filtered.filter((inst) => inst.due_date >= startDate.toISOString().split("T")[0]);
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          filtered = filtered.filter((inst) => inst.due_date >= startDate.toISOString().split("T")[0]);
          break;
      }
    }

    setFilteredInstallments(filtered);
  };

  const calculateStatistics = () => {
    const stats = filteredInstallments.reduce(
      (acc, inst) => {
        acc.totalExpected += Number(inst.amount_due);
        acc.totalCollected += Number(inst.amount_paid);
        acc.totalPending += Number(inst.amount_due) - Number(inst.amount_paid);

        if (inst.status === "overdue") {
          acc.totalOverdue += Number(inst.amount_due) - Number(inst.amount_paid);
          acc.overdueCount++;
        } else if (inst.status === "paid") {
          acc.paidCount++;
        } else if (inst.status === "pending" || inst.status === "partial") {
          acc.pendingCount++;
        }

        return acc;
      },
      {
        totalExpected: 0,
        totalCollected: 0,
        totalPending: 0,
        totalOverdue: 0,
        overdueCount: 0,
        paidCount: 0,
        pendingCount: 0,
      }
    );

    setStatistics(stats);
  };

  const handleEdit = (installment: Installment) => {
    setSelectedInstallment(installment);
    setEditData({
      amount_paid: Number(installment.amount_paid),
      payment_date: installment.payment_date || "",
      status: installment.status,
      notes: installment.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInstallment) return;

    try {
      // Determinar el nuevo estado
      let newStatus = editData.status;
      const amountPaid = Number(editData.amount_paid);
      const amountDue = Number(selectedInstallment.amount_due);

      if (amountPaid >= amountDue) {
        newStatus = "paid";
      } else if (amountPaid > 0) {
        newStatus = "partial";
      } else {
        const today = new Date().toISOString().split("T")[0];
        newStatus = selectedInstallment.due_date < today ? "overdue" : "pending";
      }

      const { error } = await supabase
        .from("credit_payments")
        .update({
          amount_paid: editData.amount_paid,
          payment_date: editData.payment_date || null,
          status: newStatus,
          notes: editData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedInstallment.id);

      if (error) throw error;
      alert("Cuota actualizada exitosamente");
      setShowEditModal(false);
      loadInstallments();
    } catch (error) {
      console.error("Error updating installment:", error);
      alert("Error al actualizar la cuota");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuota?")) return;

    try {
      const { error } = await supabase.from("credit_payments").delete().eq("id", id);

      if (error) throw error;
      alert("Cuota eliminada exitosamente");
      loadInstallments();
    } catch (error) {
      console.error("Error deleting installment:", error);
      alert("Error al eliminar la cuota");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { class: string; label: string }> = {
      paid: { class: "bg-green-100 text-green-800", label: "PAGADO" },
      pending: { class: "bg-blue-100 text-blue-800", label: "PENDIENTE" },
      partial: { class: "bg-yellow-100 text-yellow-800", label: "PARCIAL" },
      overdue: { class: "bg-red-100 text-red-800", label: "VENCIDO" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.class}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(statistics.totalExpected)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {filteredInstallments.length} cuotas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Total Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics.totalCollected)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.paidCount} cuotas pagadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(statistics.totalPending)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.pendingCount} cuotas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Vencido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(statistics.totalOverdue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.overdueCount} cuotas vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Cuotas de Pagos a Crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="date_from" className="text-xs text-gray-600">
                  Desde
                </Label>
                <Input
                  id="date_from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="date_to" className="text-xs text-gray-600">
                  Hasta
                </Label>
                <Input
                  id="date_to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              {(dateFrom || dateTo) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Limpiar Fechas
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuota #</TableHead>
                  <TableHead>Monto Debido</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Cargando cuotas...
                    </TableCell>
                  </TableRow>
                ) : filteredInstallments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron cuotas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstallments.map((installment) => {
                    const pending = Number(installment.amount_due) - Number(installment.amount_paid);
                    return (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{installment.sale.customer_name}</div>
                            {installment.sale.customer_phone && (
                              <div className="text-xs text-gray-500">
                                {installment.sale.customer_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {installment.installment_number} / {installment.sale.credit_months}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(installment.amount_due))}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(Number(installment.amount_paid))}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(pending)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(installment.due_date).toLocaleDateString("es-PY")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {installment.payment_date
                            ? new Date(installment.payment_date).toLocaleDateString("es-PY")
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(installment.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(installment)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(installment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cuota</DialogTitle>
          </DialogHeader>
          {selectedInstallment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-600">Cliente:</span>{" "}
                  <span className="font-medium">{selectedInstallment.sale.customer_name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Cuota:</span>{" "}
                  <span className="font-medium">
                    {selectedInstallment.installment_number} de {selectedInstallment.sale.credit_months}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Monto debido:</span>{" "}
                  <span className="font-medium">
                    {formatCurrency(Number(selectedInstallment.amount_due))}
                  </span>
                </p>
              </div>

              <div>
                <Label htmlFor="amount_paid">Monto Pagado</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  value={editData.amount_paid}
                  onChange={(e) =>
                    setEditData({ ...editData, amount_paid: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={editData.payment_date}
                  onChange={(e) => setEditData({ ...editData, payment_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
