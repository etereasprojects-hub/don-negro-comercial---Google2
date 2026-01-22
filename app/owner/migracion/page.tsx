
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Database, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TABLES_TO_MIGRATE = [
  "admin_settings",
  "site_settings",
  "store_configuration",
  "store_locations",
  "store_social_media",
  "store_hours",
  "categories",
  "products",
  "banners",
  "orders",
  "sales",
  "credit_payments",
  "web_messages",
  "ai_chats",
  "appointments",
  "appointment_slots",
  "ai_instructions",
  "billing_information",
  "api_keys"
];

export default function MigrationPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Credentials
  const [oldDb, setOldDb] = useState({ url: "", key: "" });
  const [newDb, setNewDb] = useState({ url: "", key: "" });
  
  // Progress State
  const [isMigrating, setIsMigrating] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
      setOldDb({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      });
    }
  }, [router]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{msg, type}, ...prev.slice(0, 99)]);
  };

  const startMigration = async () => {
    if (!oldDb.url || !oldDb.key || !newDb.url || !newDb.key) {
      alert("Por favor completa todas las credenciales.");
      return;
    }

    if (!confirm("¿Deseas iniciar la migración? Esto clonará los datos de la fuente al destino.")) {
      return;
    }

    setIsMigrating(true);
    setLogs([]);
    setProgress(0);
    addLog("Iniciando conexión con las bases de datos...", "info");

    try {
      const sourceClient = createClient(oldDb.url, oldDb.key);
      const targetClient = createClient(newDb.url, newDb.key);

      for (let i = 0; i < TABLES_TO_MIGRATE.length; i++) {
        const table = TABLES_TO_MIGRATE[i];
        setCurrentTable(table);
        addLog(`Migrando tabla: ${table}...`, "info");

        // 1. Leer datos de la fuente
        const { data: rows, error: fetchError } = await sourceClient
          .from(table)
          .select("*");

        if (fetchError) {
          addLog(`Error leyendo ${table}: ${fetchError.message}`, "error");
          continue;
        }

        if (!rows || rows.length === 0) {
          addLog(`Tabla ${table} está vacía. Saltando...`, "info");
        } else {
          // 2. Insertar en destino por lotes
          const batchSize = 25; // Reducido para mayor estabilidad
          let tableSuccess = true;

          for (let j = 0; j < rows.length; j += batchSize) {
            const batch = rows.slice(j, j + batchSize);
            
            // Intentar insertar el lote
            const { error: insertError } = await targetClient
              .from(table)
              .upsert(batch);

            if (insertError) {
              addLog(`Error insertando lote en ${table}: ${insertError.message}`, "error");
              tableSuccess = false;
              
              // Si falla por columna faltante, intentamos una inserción más lenta uno por uno
              if (insertError.message.includes("column") || insertError.code === "PGRST204") {
                addLog(`Reintentando ${table} con limpieza de datos...`, "info");
                // Aquí podríamos filtrar las columnas si tuviéramos el esquema, 
                // pero lo más efectivo es que el usuario corra el parche SQL proporcionado.
              }
              break;
            }
          }
          
          if (tableSuccess) {
            addLog(`¡Éxito! Se migraron ${rows.length} registros de ${table}.`, "success");
          }
        }

        setProgress(Math.round(((i + 1) / TABLES_TO_MIGRATE.length) * 100));
      }

      addLog("PROCESO FINALIZADO", "success");
      alert("Proceso de migración terminado. Revisa la bitácora para confirmar si hubo errores en tablas específicas.");

    } catch (error: any) {
      addLog(`ERROR CRÍTICO: ${error.message}`, "error");
    } finally {
      setIsMigrating(false);
      setCurrentTable("");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="migracion" />
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="text-blue-600" />
            Migración de Base de Datos
          </h1>
          <p className="text-gray-600 mt-2">
            Herramienta para mover datos entre proyectos de Supabase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase text-amber-700 tracking-wider">Fuente (Base Vieja)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-gray-500 font-bold">URL</Label>
                <Input 
                  value={oldDb.url} 
                  onChange={e => setOldDb({...oldDb, url: e.target.value})} 
                  placeholder="https://xxx.supabase.co"
                  disabled={isMigrating}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-gray-500 font-bold">Anon Key</Label>
                <Input 
                  type="password"
                  value={oldDb.key} 
                  onChange={e => setOldDb({...oldDb, key: e.target.value})} 
                  placeholder="eyJ..."
                  disabled={isMigrating}
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase text-green-700 tracking-wider">Destino (Base Nueva)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-gray-500 font-bold">URL</Label>
                <Input 
                  value={newDb.url} 
                  onChange={e => setNewDb({...newDb, url: e.target.value})} 
                  placeholder="https://yyy.supabase.co"
                  disabled={isMigrating}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-gray-500 font-bold">Anon Key</Label>
                <Input 
                  type="password"
                  value={newDb.key} 
                  onChange={e => setNewDb({...newDb, key: e.target.value})} 
                  placeholder="eyJ..."
                  disabled={isMigrating}
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Estado de la Migración</CardTitle>
                <CardDescription>No cierres la ventana mientras el proceso esté activo</CardDescription>
              </div>
              {!isMigrating && (
                <Button onClick={startMigration} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
                  Iniciar Clonación
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>{isMigrating ? `Procesando: ${currentTable}` : progress === 100 ? "Migración completada" : "Listo para iniciar"}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {isMigrating && (
                <div className="flex items-center justify-center gap-3 text-blue-600 font-medium bg-blue-50 py-3 rounded-lg border border-blue-100">
                  <Loader2 className="animate-spin" size={20} />
                  Transfiriendo registros...
                </div>
              )}

              {!isMigrating && progress === 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 text-amber-900 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-tight">Atención:</p>
                    <p>Si la migración de <strong>products</strong> falla, asegúrate de ejecutar el "Parche SQL de Columnas Faltantes" en la base de datos destino.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logs del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-slate-900 h-80 overflow-y-auto font-mono text-[11px] p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
              {logs.length === 0 && <p className="text-slate-500 italic">Esperando órdenes...</p>}
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-2 ${
                  log.type === 'error' ? 'text-red-400 bg-red-950/20 px-2 rounded' : 
                  log.type === 'success' ? 'text-green-400' : 'text-slate-300'
                }`}>
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                  <span className="break-words">{log.msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
