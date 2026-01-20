"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Trash2, Eye, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateSaleModal from "./CreateSaleModal";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  total: number;
  status: string;
  created_at: string;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSaleModalOpen, setIsCreateSaleModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
    } else {
      setOrders(data || []);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
      alert("Error al actualizar el pedido");
    } else {
      loadOrders();
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pedido?")) return;

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
      alert("Error al eliminar el pedido");
    } else {
      loadOrders();
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-900">Pedidos</h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_address}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">{order.customer_phone}</div>
                      {order.customer_email && (
                        <div className="text-gray-500">{order.customer_email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    ₲ {Number(order.total).toLocaleString("es-PY")}
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant={order.status === "completado" ? "default" : "secondary"}
                      className={
                        order.status === "completado"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {order.status === "completado" ? "Completado" : "Pendiente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {new Date(order.created_at).toLocaleDateString("es-PY")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsCreateSaleModalOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Crear Venta"
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                      {order.status === "pendiente" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "completado")}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "pendiente")}
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay pedidos registrados
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido</DialogTitle>
            <DialogDescription>Información completa del pedido</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Información del Cliente</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div><strong>Nombre:</strong> {selectedOrder.customer_name}</div>
                  <div><strong>Teléfono:</strong> {selectedOrder.customer_phone}</div>
                  {selectedOrder.customer_email && (
                    <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                  )}
                  <div><strong>Dirección:</strong> {selectedOrder.customer_address}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Productos</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between border-b pb-2">
                      <div>
                        <div className="font-medium">{item.nombre}</div>
                        <div className="text-sm text-gray-600">
                          Cantidad: {item.cantidad} x ₲ {Number(item.precio).toLocaleString("es-PY")}
                        </div>
                      </div>
                      <div className="font-medium">
                        ₲ {(Number(item.precio) * item.cantidad).toLocaleString("es-PY")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-pink-600">
                    ₲ {Number(selectedOrder.total).toLocaleString("es-PY")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateSaleModal
        isOpen={isCreateSaleModalOpen}
        onClose={() => {
          setIsCreateSaleModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSuccess={() => {
          loadOrders();
        }}
      />
    </div>
  );
}
