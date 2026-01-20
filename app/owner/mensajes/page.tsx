"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Clock, CheckCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WebMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<WebMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadMessages();
    }
  }, [router]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("web_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("web_messages")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      loadMessages();
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "all") return true;
    return msg.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      read: "bg-blue-100 text-blue-800",
      replied: "bg-green-100 text-green-800",
    };
    const labels = {
      pending: "Pendiente",
      read: "Leído",
      replied: "Respondido",
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
      <AdminTabs activeTab="mensajes" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mensajes Recibidos</h1>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              Todos ({messages.length})
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
            >
              Pendientes ({messages.filter((m) => m.status === "pending").length})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              onClick={() => setFilter("read")}
            >
              Leídos ({messages.filter((m) => m.status === "read").length})
            </Button>
            <Button
              variant={filter === "replied" ? "default" : "outline"}
              onClick={() => setFilter("replied")}
            >
              Respondidos ({messages.filter((m) => m.status === "replied").length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando mensajes...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No hay mensajes para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card key={message.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{message.name}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${message.email}`} className="hover:text-blue-600">
                            {message.email}
                          </a>
                        </div>
                        {message.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${message.phone}`} className="hover:text-blue-600">
                              {message.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(message.created_at), "PPp", { locale: es })}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">{getStatusBadge(message.status)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{message.message}</p>
                  <div className="flex gap-2">
                    {message.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMessageStatus(message.id, "read")}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Marcar como leído
                      </Button>
                    )}
                    {message.status === "read" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMessageStatus(message.id, "replied")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marcar como respondido
                      </Button>
                    )}
                    {message.status === "replied" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMessageStatus(message.id, "pending")}
                      >
                        Marcar como pendiente
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
