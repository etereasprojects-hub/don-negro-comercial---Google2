"use client";

import { useRouter } from "next/navigation";
import { Package, ShoppingCart, TrendingUp, CreditCard, MessageSquare, Calendar, MessageCircle, Brain, Receipt, Settings, Image, Plug, FolderTree, Beaker, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminTabsProps {
  activeTab: string;
}

const tabs = [
  { id: "productos", label: "Local", icon: Package, count: null },
  { id: "productos-fastrax", label: "Fastrax", icon: Database, count: null },
  { id: "categorias", label: "Categorías", icon: FolderTree, count: null },
  { id: "pedidos", label: "Pedidos", icon: ShoppingCart, count: null },
  { id: "ventas", label: "Ventas", icon: TrendingUp, count: null },
  { id: "creditos", label: "Pagos a Crédito", icon: CreditCard, count: null },
  { id: "test-pago", label: "Test Pago", icon: Beaker, count: null },
  { id: "banners", label: "Banners", icon: Image, count: null },
  { id: "conexion-api", label: "Conexión API", icon: Plug, count: null },
  { id: "configuracion", label: "Configuración", icon: Settings, count: null },
  { id: "mensajes", label: "Mensajes", icon: MessageSquare, count: null },
  { id: "citas", label: "Citas", icon: Calendar, count: null },
  { id: "chats", label: "Chats", icon: MessageCircle, count: null },
  { id: "ia", label: "IA", icon: Brain, count: null },
  { id: "facturacion", label: "Facturación", icon: Receipt, count: null },
];

export default function AdminTabs({ activeTab }: AdminTabsProps) {
  const router = useRouter();

  const handleTabClick = (tabId: string) => {
    const routes: Record<string, string> = {
      "productos": "/owner/dashboard",
      "productos-fastrax": "/owner/fastrax",
      "categorias": "/owner/categorias",
      "pedidos": "/owner/pedidos",
      "ventas": "/owner/ventas",
      "creditos": "/owner/creditos",
      "test-pago": "/owner/test-pago",
      "banners": "/owner/banners",
      "conexion-api": "/owner/conexion-api",
      "configuracion": "/owner/configuracion",
      "mensajes": "/owner/mensajes",
      "citas": "/owner/citas",
      "chats": "/owner/chats",
      "ia": "/owner/ia",
      "facturacion": "/owner/facturacion"
    };

    if (routes[tabId]) {
      router.push(routes[tabId]);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
                {tab.label && <span>{tab.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
