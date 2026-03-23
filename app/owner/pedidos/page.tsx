"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import OrdersTable from "@/components/admin/OrdersTable";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="pedidos" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <OrdersTable />
      </div>
    </div>
  );
}
