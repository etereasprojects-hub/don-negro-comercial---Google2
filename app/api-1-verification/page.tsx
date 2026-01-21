"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft, Lock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SyncLog {
  id: string;
  operation_type: string;
  direction: "incoming" | "outgoing";
  status: "success" | "error" | "pending";
  request_data: any;
  response_data: any;
  error_message: string | null;
  ip_address: string;
  api_key_used: string;
  processing_time_ms: number;
  created_at: string;
}

export default function ApiVerificationPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const auth = localStorage.getItem("apiVerificationAuth");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadLogs();
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = supabase
      .channel("api_verification_logs")
      .on("postgres_changes", { event: "*", schema: "public", table: "api_sync_logs" }, () => {
        loadLogs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "donegro2025apiverification") {
      localStorage.setItem("apiVerificationAuth", "true");
      setIsAuthenticated(true);
      loadLogs();
    } else {
      setError("Contraseña incorreta");
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
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

  const getDirectionIcon = (direction: string) => {
    return direction === "incoming" ? (
      <ArrowDownLeft className="w-4 h-4 text-blue-500" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-purple-500" />
    );
  };

  const getOperationLabel = (operation: string) => {
    const labels: Record<string, string> = {
      product_sync: "Sincronización de Productos",
      sale_notification: "Consulta de Ventas",
      stock_update: "Actualización de Stock",
      mark_synced: "Marcar como Sincronizado",
    };
    return labels[operation] || operation;
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verificación de API</CardTitle>
            <CardDescription>Panel de Monitoreo para Desarrolladores</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña de Verificación
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Acceder
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Esta página es solo para desarrolladores con acceso autorizado.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Logs de Sincronización API
              </h1>
              <p className="text-gray-600">
                Monitoreo en tiempo real de todas las operaciones de API
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("apiVerificationAuth");
                setIsAuthenticated(false);
              }}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-gray-600">Exitosas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-gray-600">Errores</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.incoming}</div>
              <div className="text-sm text-gray-600">Recibidas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{stats.outgoing}</div>
              <div className="text-sm text-gray-600">Enviadas</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Logs de Sincronización</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={filter === "success" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("success")}
              >
                Exitosas
              </Button>
              <Button
                variant={filter === "error" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("error")}
              >
                Errores
              </Button>
              <Button
                variant={filter === "incoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("incoming")}
              >
                Recibidas
              </Button>
              <Button
                variant={filter === "outgoing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("outgoing")}
              >
                Enviadas
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay logs disponibles
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(log.status)}
                          {getDirectionIcon(log.direction)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {getOperationLabel(log.operation_type)}
                            </span>
                            {log.status === "success" && (
                              <Badge className="bg-green-100 text-green-800">
                                Exitoso
                              </Badge>
                            )}
                            {log.status === "error" && (
                              <Badge className="bg-red-100 text-red-800">Error</Badge>
                            )}
                            {log.status === "pending" && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Pendiente
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {selectedLog && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    {getOperationLabel(selectedLog.operation_type)}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Información General</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <Badge
                          className={
                            selectedLog.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {selectedLog.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dirección:</span>
                        <span>{selectedLog.direction === "incoming" ? "Recibida" : "Enviada"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP:</span>
                        <span className="font-mono">{selectedLog.ip_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tiempo:</span>
                        <span>{selectedLog.processing_time_ms}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span>{new Date(selectedLog.created_at).toLocaleString("es-ES")}</span>
                      </div>
                    </div>
                  </div>

                  {selectedLog.request_data && (
                    <div>
                      <h3 className="font-semibold mb-2">Datos de Solicitud</h3>
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.request_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.response_data && (
                    <div>
                      <h3 className="font-semibold mb-2">Datos de Respuesta</h3>
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.response_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.error_message && (
                    <div>
                      <h3 className="font-semibold mb-2 text-red-600">Mensaje de Error</h3>
                      <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800">
                        {selectedLog.error_message}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
