"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import SalesTable from "@/components/admin/SalesTable";

export default function VentasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="ventas" />

      <div className="max-w-[1400px] mx-auto p-6">
        <SalesTable />
      </div>
    </div>
  );
}
