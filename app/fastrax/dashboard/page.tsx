"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, CheckCircle2, Clock, AlertTriangle, Play, Settings, ExternalLink, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface OpStatus {
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
    const { data } = await supabase
      .from('fastrax_operations_status')
      .select('*')
      .order('ope_number', { ascending: true });
    
    if (data) setOps(data);
    setLoading(false);
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
    errors: ops.filter(o => o.status === 'error').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard de Operaciones</h2>
          <p className="text-slate-400 mt-1">Estado de integración de los endpoints de Fastrax.</p>
        </div>
        <div className="flex gap-4">
           <Card className="bg-slate-900 border-slate-800 px-6 py-2 flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500">Endpoints</p>
                <p className="text-xl font-black text-white">{stats.total}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-500">Listos</p>
                <p className="text-xl font-black text-emerald-400">{stats.active}</p>
              </div>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))
        ) : (
          ops.map((op) => {
            const Config = statusMap[op.status];
            const StatusIcon = Config.icon;
            return (
              <Link key={op.ope_number} href={`/fastrax/${op.path}`}>
                <Card className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-all group cursor-pointer h-full relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${Config.color}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono bg-slate-950 text-[10px] border-slate-800">
                        OPE_{op.ope_number}
                      </Badge>
                      <Config.icon className={`w-4 h-4 ${Config.text}`} />
                    </div>
                    <CardTitle className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mt-2">
                      {op.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${Config.bg} ${Config.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${Config.color} animate-pulse`} />
                      {Config.label}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {op.last_execution ? new Date(op.last_execution).toLocaleDateString() : "Sin ejecuciones"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
