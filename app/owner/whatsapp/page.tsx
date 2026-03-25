"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Clock, Phone, Trash2, CheckSquare, Square, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface WhatsAppChat {
  id: string;
  whatsapp_number: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export default function WhatsAppChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedChat = chats.find(c => c.id === selectedChatId) || null;

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_ai_chats")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error("Error loading WhatsApp chats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("whatsapp_ai_chats")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      if (selectedChatId === id) {
        setSelectedChatId(null);
      }
      loadChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Error al eliminar la conversación. Verifica los permisos de la base de datos.");
    }
  };

  const deleteSelectedChats = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar las ${selectedIds.length} conversaciones seleccionadas?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("whatsapp_ai_chats")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      
      if (selectedChatId && selectedIds.includes(selectedChatId)) {
        setSelectedChatId(null);
      }
      setSelectedIds([]);
      setIsSelectionMode(false);
      loadChats();
    } catch (error) {
      console.error("Error deleting chats:", error);
      alert("Error al eliminar las conversaciones");
    }
  };

  const toggleSelectChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    loadChats();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("whatsapp_ai_chats_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_ai_chats" },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadChats]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="whatsapp" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Phone className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Chats de WhatsApp IA</h1>
          </div>
          <div className="flex items-center gap-2">
            {isSelectionMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={deleteSelectedChats}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar ({selectedIds.length})
                </Button>
              </>
            ) : (
              chats.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Seleccionar
                </Button>
              )
            )}
          </div>
        </div>

        {loading && chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando conversaciones...</p>
          </div>
        ) : chats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No hay conversaciones de WhatsApp para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-lg font-semibold mb-3">Números de WhatsApp</h2>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {chats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`cursor-pointer transition-all hover:shadow-md relative ${
                      selectedChatId === chat.id ? "ring-2 ring-green-500" : ""
                    } ${selectedIds.includes(chat.id) ? "bg-green-50" : ""}`}
                    onClick={() => isSelectionMode ? toggleSelectChat(chat.id, {} as any) : setSelectedChatId(chat.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isSelectionMode ? (
                            <div onClick={(e) => toggleSelectChat(chat.id, e)}>
                              {selectedIds.includes(chat.id) ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          ) : (
                            <Phone className="w-4 h-4 text-green-500" />
                          )}
                          <span className="font-medium text-sm">
                            {chat.whatsapp_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {chat.messages?.length || 0} msgs
                          </Badge>
                          {!isSelectionMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              onClick={(e) => deleteChat(chat.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
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
                <Card className="h-[calc(100vh-250px)] flex flex-col">
                  <CardHeader className="border-b flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      {selectedChat.whatsapp_number}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => window.open(`https://wa.me/${selectedChat.whatsapp_number.replace(/\D/g, "")}`, "_blank")}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Abrir en WhatsApp
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {selectedChat.messages && selectedChat.messages.length > 0 ? (
                        selectedChat.messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              msg.role === "user" ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 break-words overflow-hidden ${
                                msg.role === "user"
                                  ? "bg-gray-100 text-gray-900"
                                  : "bg-green-600 text-white"
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${msg.role === "user" ? "text-gray-500" : "text-green-100"}`}>
                                  {msg.role === "user" ? "Cliente" : "IA"}
                                </span>
                                {msg.timestamp && (
                                  <span className="text-xs opacity-75">
                                    {format(new Date(msg.timestamp), "HH:mm")}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-a:text-blue-500 prose-a:underline prose-strong:font-bold prose-ul:list-disc prose-ul:ml-4">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className={msg.role === "user" ? "text-blue-600 underline" : "text-white underline font-medium"} />,
                                    p: ({node, ...props}) => <p {...props} className="mb-1 last:mb-0" />,
                                    li: ({node, ...props}) => <li {...props} className="mb-1" />
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
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
                      Selecciona un número de WhatsApp para ver la conversación
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
