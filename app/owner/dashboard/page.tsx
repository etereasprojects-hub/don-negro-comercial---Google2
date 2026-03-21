"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import ProductsTable from "@/components/admin/ProductsTable";

export default function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="productos" />
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <ProductsTable />
      </div>
    </div>
  );
}
