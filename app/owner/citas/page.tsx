"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, User, Mail, Phone, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  service: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface AppointmentSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

const daysOfWeek = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 60,
  });

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadData();
    }
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAppointments(), loadSlots()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) throw error;
    setAppointments(data || []);
  };

  const loadSlots = async () => {
    const { data, error } = await supabase
      .from("appointment_slots")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    setSlots(data || []);
  };

  const createSlot = async () => {
    try {
      const { error } = await supabase.from("appointment_slots").insert([
        {
          ...newSlot,
          is_active: true,
        },
      ]);

      if (error) throw error;
      setShowSlotModal(false);
      setNewSlot({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration_minutes: 60,
      });
      loadSlots();
    } catch (error) {
      console.error("Error creating slot:", error);
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este horario?")) return;

    try {
      const { error } = await supabase.from("appointment_slots").delete().eq("id", id);

      if (error) throw error;
      loadSlots();
    } catch (error) {
      console.error("Error deleting slot:", error);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      loadAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return (
      <Badge className={styles[status as keyof typeof styles] || ""}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="citas" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Citas Agendadas</h1>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Cargando citas...</p>
              </div>
            ) : appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No hay citas agendadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {appointment.client_name}
                          </CardTitle>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(appointment.appointment_date), "PPP", {
                                locale: es,
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.appointment_time} ({appointment.duration_minutes} min)
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {appointment.client_email}
                            </div>
                            {appointment.client_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {appointment.client_phone}
                              </div>
                            )}
                          </div>
                          {appointment.service && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Servicio:</strong> {appointment.service}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Notas:</strong> {appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">{getStatusBadge(appointment.status)}</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {appointment.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAppointmentStatus(appointment.id, "confirmed")
                            }
                          >
                            Confirmar
                          </Button>
                        )}
                        {appointment.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAppointmentStatus(appointment.id, "completed")
                            }
                          >
                            Marcar como completada
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() =>
                            updateAppointmentStatus(appointment.id, "cancelled")
                          }
                        >
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Horarios Disponibles</CardTitle>
                  <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agregar Horario Disponible</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Día de la semana</Label>
                          <select
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            value={newSlot.day_of_week}
                            onChange={(e) =>
                              setNewSlot({
                                ...newSlot,
                                day_of_week: parseInt(e.target.value),
                              })
                            }
                          >
                            {daysOfWeek.map((day, index) => (
                              <option key={index} value={index}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Hora de inicio</Label>
                          <Input
                            type="time"
                            value={newSlot.start_time}
                            onChange={(e) =>
                              setNewSlot({ ...newSlot, start_time: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Hora de fin</Label>
                          <Input
                            type="time"
                            value={newSlot.end_time}
                            onChange={(e) =>
                              setNewSlot({ ...newSlot, end_time: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Duración de cada cita (minutos)</Label>
                          <Input
                            type="number"
                            value={newSlot.slot_duration_minutes}
                            onChange={(e) =>
                              setNewSlot({
                                ...newSlot,
                                slot_duration_minutes: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <Button onClick={createSlot} className="w-full">
                          Guardar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay horarios configurados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {daysOfWeek[slot.day_of_week]}
                          </p>
                          <p className="text-xs text-gray-600">
                            {slot.start_time} - {slot.end_time} ({slot.slot_duration_minutes} min)
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSlot(slot.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
