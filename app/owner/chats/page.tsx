"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Clock, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface AIChat {
  id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chats, setChats] = useState<AIChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<AIChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadChats();
    }
  }, [router]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_chats")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="chats" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversaciones con IA</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando conversaciones...</p>
          </div>
        ) : chats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No hay conversaciones para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-lg font-semibold mb-3">Sesiones de Chat</h2>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {chats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedChat?.id === chat.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">
                            {chat.visitor_name || "Visitante Anónimo"}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {chat.messages?.length || 0} msgs
                        </Badge>
                      </div>
                      {chat.visitor_email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Mail className="w-3 h-3" />
                          {chat.visitor_email}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(chat.updated_at), "PPp", { locale: es })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedChat ? (
                <Card className="h-[calc(100vh-250px)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {selectedChat.visitor_name || "Visitante Anónimo"}
                    </CardTitle>
                    {selectedChat.visitor_email && (
                      <p className="text-sm text-gray-600">{selectedChat.visitor_email}</p>
                    )}
                  </CardHeader>
                  <CardContent className="h-[calc(100%-100px)] overflow-y-auto">
                    <div className="space-y-4">
                      {selectedChat.messages && selectedChat.messages.length > 0 ? (
                        selectedChat.messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === "user"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {msg.role === "user" ? "Usuario" : "IA"}
                                </span>
                                {msg.timestamp && (
                                  <span className="text-xs opacity-75">
                                    {format(new Date(msg.timestamp), "HH:mm")}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500">No hay mensajes en esta conversación</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[calc(100vh-250px)] flex items-center justify-center">
                  <CardContent>
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-center">
                      Selecciona una conversación para ver los detalles
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
