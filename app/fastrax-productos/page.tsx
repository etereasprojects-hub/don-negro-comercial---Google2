'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import FastraxProductsTable from "@/components/admin/FastraxProductsTable";
import { Badge } from "@/components/ui/badge";
import { Database, Terminal, Server, Code } from "lucide-react";

export default function FastraxProductosPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState({ sent: null, received: null });

  useEffect(() => {
    const auth = localStorage.getItem("ownerAuth");
    if (auth !== "true") {
      router.push("/owner");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <AdminTabs activeTab="productos-fastrax" />
      
      <div className="max-w-[1500px] mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Control de Catálogo Fastrax</h1>
            <p className="text-slate-500">Sincronización incremental y verificación de datos antes de publicación.</p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
            API Engine v2.0
          </Badge>
        </div>

        {/* Consolas de Depuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              <Code className="w-3 h-3 text-blue-500" /> Payload Outbound (Enviado)
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner h-[120px] overflow-auto custom-scrollbar">
              <pre className="text-[10px] font-mono text-blue-400 leading-tight">
                {logs.sent ? JSON.stringify(logs.sent, null, 2) : "// Esperando acción..."}
              </pre>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              <Server className="w-3 h-3 text-emerald-500" /> API Inbound (Recibido)
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-inner h-[120px] overflow-auto custom-scrollbar">
              <pre className="text-[10px] font-mono text-emerald-400 leading-tight">
                {logs.received ? JSON.stringify(logs.received, null, 2).substring(0, 2000) + "..." : "// Sin respuesta activa..."}
              </pre>
            </div>
          </div>
        </div>

        <FastraxProductsTable onLogUpdate={(s, r) => setLogs({ sent: s, received: r })} />
      </div>
      
      {/* Fix: Replaced style jsx global with dangerouslySetInnerHTML to resolve TypeScript error in App Router */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      ` }} />
    </div>
  );
}
