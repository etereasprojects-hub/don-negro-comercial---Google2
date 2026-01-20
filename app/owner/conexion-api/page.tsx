"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft, Copy, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiKey {
  id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface SyncLog {
  id: string;
  operation_type: string;
  direction: string;
  status: string;
  request_data: any;
  response_data: any;
  error_message: string | null;
  ip_address: string;
  api_key_used: string;
  processing_time_ms: number;
  created_at: string;
}

export default function ConexionAPIPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      loadData();
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = supabase
      .channel("api_logs_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "api_sync_logs" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);

    const { data: logsData } = await supabase
      .from("api_sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: keysData } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (logsData) setLogs(logsData);
    if (keysData) setApiKeys(keysData);

    setLoading(false);
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getOperationLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      product_sync: "Sincronización de Productos",
      get_sales: "Consulta de Ventas",
      mark_sale_synced: "Marcar Venta Sincronizada",
      stock_update: "Actualización de Stock",
    };
    return labels[type] || type;
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    if (filter === "success") return log.status === "success";
    if (filter === "error") return log.status === "error";
    if (filter === "incoming") return log.direction === "incoming";
    if (filter === "outgoing") return log.direction === "outgoing";
    return true;
  });

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    error: logs.filter((l) => l.status === "error").length,
    incoming: logs.filter((l) => l.direction === "incoming").length,
    outgoing: logs.filter((l) => l.direction === "outgoing").length,
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="conexion-api" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conexión API</h1>
          <p className="text-gray-600">
            Monitorea las sincronizaciones con el programa externo
          </p>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="logs">Logs de Sincronización</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Exitosas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-600">
                    Errores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.error}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-600">
                    Recibidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.incoming}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-600">
                    Enviadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.outgoing}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Logs de Sincronización</CardTitle>
                  <div className="flex items-center gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="success">Exitosos</option>
                      <option value="error">Errores</option>
                      <option value="incoming">Recibidos</option>
                      <option value="outgoing">Enviados</option>
                    </select>
                    <Button
                      onClick={loadData}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Cargando logs...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay logs de sincronización
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(log.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {getOperationLabel(log.operation_type)}
                                </span>
                                {log.direction === "incoming" ? (
                                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                                    Recibido
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    Enviado
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>
                                  {new Date(log.created_at).toLocaleString("es-ES")}
                                </div>
                                {log.error_message && (
                                  <div className="text-red-600">
                                    Error: {log.error_message}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  IP: {log.ip_address} | Tiempo: {log.processing_time_ms}ms
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-2">Cómo compartir la API Key con el Programador</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 mb-3">
                  <li>Copia la API Key que aparece abajo (botón "Copiar")</li>
                  <li>Envíala al programador de forma segura (WhatsApp, email, etc.)</li>
                  <li>Comparte también la contraseña de verificación: <code className="bg-blue-100 px-1 rounded font-semibold">donegro2025apiverification</code></li>
                  <li>El programador podrá ver los logs de sincronización en: <code className="bg-blue-100 px-1 rounded">/api-1-verification</code></li>
                  <li>La documentación completa está en: <a href="/api-1" target="_blank" className="font-semibold underline">/api-1</a></li>
                </ol>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Importante:</strong> Esta página es solo para propietarios. El programador NO debe acceder a /owner.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>API Keys</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/api-1', '_blank')}
                  >
                    Ver Documentación
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay API keys configuradas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{key.key_name}</h3>
                            <p className="text-sm text-gray-600">
                              Creada: {new Date(key.created_at).toLocaleDateString("es-ES")}
                            </p>
                            {key.last_used_at && (
                              <p className="text-xs text-green-700">
                                Último uso: {new Date(key.last_used_at).toLocaleString("es-ES")}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={key.is_active ? "default" : "secondary"}
                            className={key.is_active ? "bg-green-600" : ""}
                          >
                            {key.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <label className="text-xs font-medium text-gray-700 mb-1 block">
                            API Key (Comparte esto con el programador)
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white border-2 border-gray-300 px-3 py-2 rounded text-sm font-mono break-all">
                              {key.api_key}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(key.api_key, key.id)}
                              className="shrink-0"
                            >
                              {copiedKey === key.id ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                          <strong>Nota:</strong> Esta key permite al programador sincronizar productos y consultar ventas. No la compartas públicamente.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Log</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Operación</label>
                    <p className="text-sm text-gray-900">{getOperationLabel(selectedLog.operation_type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedLog.status)}
                      <span className="text-sm text-gray-900 capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Dirección</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedLog.direction === "incoming" ? "Recibido" : "Enviado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha</label>
                    <p className="text-sm text-gray-900">{new Date(selectedLog.created_at).toLocaleString("es-ES")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">IP</label>
                    <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tiempo de Procesamiento</label>
                    <p className="text-sm text-gray-900">{selectedLog.processing_time_ms}ms</p>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div>
                    <label className="text-sm font-medium text-red-700">Mensaje de Error</label>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded mt-1">{selectedLog.error_message}</p>
                  </div>
                )}

                {selectedLog.request_data && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Datos de la Solicitud</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.request_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.response_data && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Datos de la Respuesta</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.response_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
