"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, CheckCircle2, Clock, AlertTriangle, Play, LayoutDashboard, Database, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Added missing Button import to fix "Cannot find name 'Button'" errors
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OpStatus {
  id: string;
  ope_number: number;
  name: string;
  path: string;
  status: 'pending' | 'processed' | 'active' | 'error';
  last_execution: string;
}

export default function FastraxDashboard() {
  const [ops, setOps] = useState<OpStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fastrax_operations_status')
      .select('*')
      .order('ope_number', { ascending: true });
    
    if (data) setOps(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('fastrax_operations_status')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setOps(prev => prev.map(op => op.id === id ? { ...op, status: newStatus as any } : op));
    }
  };

  const statusMap = {
    active: { label: "Activo", color: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    processed: { label: "Procesado", color: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10", icon: Play },
    pending: { label: "Pendiente", color: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10", icon: Clock },
    error: { label: "Error", color: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
  };

  const stats = {
    total: ops.length,
    active: ops.filter(o => o.status === 'active').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard de Operaciones</h2>
          <p className="text-slate-400 mt-1">Gestión y monitoreo de integraciones Fastrax.</p>
        </div>
        <div className="flex gap-4">
           <Card className="bg-slate-900 border-slate-800 px-6 py-2 flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500">Endpoints</p>
                <p className="text-xl font-black text-white">{stats.total}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-500">Activos</p>
                <p className="text-xl font-black text-emerald-400">{stats.active}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-slate-500 ml-2" onClick={loadStatus}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && ops.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))
        ) : (
          ops.map((op) => {
            const Config = statusMap[op.status];
            return (
              <Card key={op.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group h-full relative overflow-hidden flex flex-col">
                <div className={`absolute top-0 right-0 w-16 h-16 -mr-6 -mt-6 rounded-full blur-2xl opacity-10 ${Config.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono bg-slate-950 text-[10px] border-slate-800 text-slate-400">
                      OPE_{op.ope_number}
                    </Badge>
                    <Config.icon className={`w-4 h-4 ${Config.text}`} />
                  </div>
                  <Link href={`/fastrax/${op.path}`}>
                    <CardTitle className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mt-2 underline-offset-4 hover:underline">
                      {op.name}
                    </CardTitle>
                  </Link>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <Select value={op.status} onValueChange={(val) => handleStatusChange(op.id, val)}>
                      <SelectTrigger className={`h-7 text-[10px] font-bold uppercase tracking-wider border-none shadow-none focus:ring-0 ${Config.bg} ${Config.text}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="active" className="text-emerald-400">Activo</SelectItem>
                        <SelectItem value="processed" className="text-blue-400">Procesado</SelectItem>
                        <SelectItem value="pending" className="text-amber-400">Pendiente</SelectItem>
                        <SelectItem value="error" className="text-red-400">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {op.last_execution ? new Date(op.last_execution).toLocaleDateString() : "Sin ejecuciones"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
