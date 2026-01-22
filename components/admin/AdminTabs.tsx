
"use client";

import { useRouter } from "next/navigation";
import { Package, ShoppingCart, TrendingUp, CreditCard, MessageSquare, Calendar, MessageCircle, Brain, Receipt, Settings, Image, Plug, FolderTree, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminTabsProps {
  activeTab: string;
}

const tabs = [
  { id: "productos", label: "Productos", icon: Package, count: null },
  { id: "categorias", label: "Categorías", icon: FolderTree, count: null },
  { id: "pedidos", label: "Pedidos", icon: ShoppingCart, count: null },
  { id: "ventas", label: "Ventas", icon: TrendingUp, count: null },
  { id: "creditos", label: "Pagos a Crédito", icon: CreditCard, count: null },
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
    if (tabId === "productos") {
      router.push("/owner/dashboard");
    } else if (tabId === "categorias") {
      router.push("/owner/categorias");
    } else if (tabId === "pedidos") {
      router.push("/owner/pedidos");
    } else if (tabId === "ventas") {
      router.push("/owner/ventas");
    } else if (tabId === "creditos") {
      router.push("/owner/creditos");
    } else if (tabId === "banners") {
      router.push("/owner/banners");
    } else if (tabId === "conexion-api") {
      router.push("/owner/conexion-api");
    } else if (tabId === "configuracion") {
      router.push("/owner/configuracion");
    } else if (tabId === "mensajes") {
      router.push("/owner/mensajes");
    } else if (tabId === "citas") {
      router.push("/owner/citas");
    } else if (tabId === "chats") {
      router.push("/owner/chats");
    } else if (tabId === "ia") {
      router.push("/owner/ia");
    } else if (tabId === "facturacion") {
      router.push("/owner/facturacion");
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-slate-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label && <span>{tab.label}</span>}
                {tab.count !== null && (
                  <Badge
                    variant="secondary"
                    className={isActive ? "bg-slate-500 text-white" : "bg-gray-200 text-gray-700"}
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
