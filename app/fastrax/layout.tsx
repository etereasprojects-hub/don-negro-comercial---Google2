"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ChevronRight, Activity, Terminal, LayoutDashboard, Database, Zap } from 'lucide-react';

const operations = [
  { id: 1, name: "Consulta de productos", path: "operacion-1-consulta-productos" },
  { id: 2, name: "Detalles de productos", path: "operacion-2-detalles-productos" },
  { id: 3, name: "Imagen del producto", path: "operacion-3-imagen-producto" },
  { id: 4, name: "Consulta por página", path: "operacion-4-consulta-paginada" },
  { id: 10, name: "Versión de la API", path: "operacion-10-version" },
  { id: 11, name: "Saldo y precio", path: "operacion-11-saldo-precio" },
  { id: 12, name: "Enviar pedido", path: "operacion-12-enviar-pedido" },
  { id: 13, name: "Consultar pedido", path: "operacion-13-consultar-pedido" },
  { id: 15, name: "Facturar pedido", path: "operacion-15-facturar-pedido" },
  { id: 16, name: "Borrar pedido", path: "operacion-16-borrar-pedido" },
  { id: 22, name: "Modificación de datos", path: "operacion-22-modificaciones" },
  { id: 31, name: "Pedidos no facturados", path: "operacion-31-pedidos-pendientes" },
  { id: 91, name: "Categorías WEB", path: "operacion-91-categorias-web" },
  { id: 92, name: "Marcas", path: "operacion-92-marcas" },
  { id: 93, name: "Categorías Sistema", path: "operacion-93-categorias-sistema" },
  { id: 94, name: "Imágenes Base64", path: "operacion-94-imagenes-base64" },
  { id: 98, name: "Saldos y activos", path: "operacion-98-saldos-activos" },
  { id: 99, name: "Productos alterados", path: "operacion-99-alterados" },
];

export default function FastraxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-blue-500 w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight">Fastrax API</h1>
          </div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Gestión Técnica Dropshipping</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <Link
            href="/fastrax/dashboard"
            className={`flex items-center gap-3 p-3 rounded-lg group transition-all text-sm border ${
              pathname === '/fastrax/dashboard' 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-900 border-transparent hover:border-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-bold">Dashboard General</span>
          </Link>

          <div className="h-4" />
          <p className="text-[10px] font-bold text-slate-600 uppercase px-3 mb-2">Operaciones Disponibles</p>

          {operations.map((op) => {
            const isActive = pathname.includes(op.path);
            return (
              <Link
                key={op.id}
                href={`/fastrax/${op.path}`}
                className={`flex items-center justify-between p-3 rounded-lg group transition-all text-sm border ${
                  isActive 
                    ? 'bg-slate-800 text-white border-slate-700 shadow-inner' 
                    : 'text-slate-400 hover:bg-slate-900 border-transparent hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'
                  }`}>
                    {op.id}
                  </span>
                  <span className={isActive ? 'font-medium' : ''}>{op.name}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all ${isActive ? 'text-blue-400 translate-x-1' : 'text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1'}`} />
              </Link>
            )
          })}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <Link href="/owner/dashboard" className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-slate-900">
            <ChevronRight className="w-3 h-3 rotate-180" />
            Cerrar Terminal Técnica
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-500" />
              <span className="font-mono text-xs">donegro@fastrax:~/production/ops$</span>
            </div>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              API Integration: <span className="text-emerald-400 font-bold uppercase">Healthy</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
               <Zap className="w-3 h-3 text-yellow-500" />
               Latency: 24ms
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Comment: Replaced styled-jsx with standard style tag and dangerouslySetInnerHTML to fix TypeScript error 'Property jsx does not exist on type DetailedHTMLProps' */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      ` }} />
    </div>
  );
}
