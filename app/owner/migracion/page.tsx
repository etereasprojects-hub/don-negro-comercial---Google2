
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
import { Database, ArrowRight, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
      // Auto-fill old credentials for convenience
      setOldDb({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      });
    }
  }, [router]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{msg, type}, ...prev.slice(0, 49)]);
  };

  const startMigration = async () => {
    if (!oldDb.url || !oldDb.key || !newDb.url || !newDb.key) {
      alert("Por favor completa todas las credenciales.");
      return;
    }

    if (oldDb.url === newDb.url) {
      alert("La base de datos origen y destino no pueden ser la misma.");
      return;
    }

    if (!confirm("¿Seguro que deseas iniciar la migración? Asegúrate de haber corrido el SQL Maestro en la nueva base de datos.")) {
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
          // 2. Insertar en destino por lotes (upsert para evitar duplicados si se re-corre)
          const batchSize = 50;
          for (let j = 0; j < rows.length; j += batchSize) {
            const batch = rows.slice(j, j + batchSize);
            const { error: insertError } = await targetClient
              .from(table)
              .upsert(batch);

            if (insertError) {
              addLog(`Error insertando lote en ${table}: ${insertError.message}`, "error");
              break;
            }
          }
          addLog(`¡Éxito! Se migraron ${rows.length} registros de ${table}.`, "success");
        }

        setProgress(Math.round(((i + 1) / TABLES_TO_MIGRATE.length) * 100));
      }

      addLog("MIGRACIÓN FINALIZADA CON ÉXITO", "success");
      alert("Migración completada. Verifica los datos en tu nuevo dashboard de Supabase.");

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
            Utiliza esta herramienta para clonar los datos de tu base de datos actual (Fuente) a la nueva (Destino).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* SOURCE */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-amber-700">Paso 1: Base de Datos Fuente (Vieja)</CardTitle>
              <CardDescription>Solo lectura. Estos datos serán clonados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Supabase URL</Label>
                <Input 
                  value={oldDb.url} 
                  onChange={e => setOldDb({...oldDb, url: e.target.value})} 
                  placeholder="https://xxx.supabase.co"
                  disabled={isMigrating}
                />
              </div>
              <div className="space-y-2">
                <Label>Anon API Key</Label>
                <Input 
                  type="password"
                  value={oldDb.key} 
                  onChange={e => setOldDb({...oldDb, key: e.target.value})} 
                  placeholder="eyJ..."
                  disabled={isMigrating}
                />
              </div>
            </CardContent>
          </Card>

          {/* DESTINATION */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-green-700">Paso 2: Base de Datos Destino (Nueva)</CardTitle>
              <CardDescription>Escritura. Aquí se guardarán los datos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Supabase URL</Label>
                <Input 
                  value={newDb.url} 
                  onChange={e => setNewDb({...newDb, url: e.target.value})} 
                  placeholder="https://yyy.supabase.co"
                  disabled={isMigrating}
                />
              </div>
              <div className="space-y-2">
                <Label>Anon API Key</Label>
                <Input 
                  type="password"
                  value={newDb.key} 
                  onChange={e => setNewDb({...newDb, key: e.target.value})} 
                  placeholder="eyJ..."
                  disabled={isMigrating}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Control de Proceso
              {!isMigrating && (
                <Button onClick={startMigration} className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Play size={16} /> Iniciar Clonación
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMigrating && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Migrando: {currentTable || "Preparando..."}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
                  <Loader2 className="animate-spin" size={14} />
                  Procesando datos... Por favor no cierres esta pestaña.
                </div>
              </div>
            )}

            {!isMigrating && progress === 100 && (
              <div className="bg-green-100 border border-green-200 p-4 rounded-lg flex items-center gap-3 text-green-800">
                <CheckCircle2 size={20} />
                Migración terminada. Verifica los datos antes de cambiar las variables de entorno.
              </div>
            )}

            {!isMigrating && progress === 0 && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 text-blue-800 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-bold">Recordatorio importante:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Asegúrate de haber ejecutado el SQL Maestro en la base nueva.</li>
                    <li>Este proceso NO borra nada de la base vieja.</li>
                    <li>Las imágenes NO se mueven, solo sus enlaces (esto es correcto).</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LOGS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Bitácora de Operación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 && <p className="text-slate-500 italic">Esperando inicio...</p>}
              {logs.map((log, i) => (
                <div key={i} className={
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 'text-slate-300'
                }>
                  <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {log.msg}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
