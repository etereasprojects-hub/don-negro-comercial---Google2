"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import CreditPaymentsTable from "@/components/admin/CreditPaymentsTable";

export default function CreditosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabs activeTab="creditos" />

      <div className="max-w-[1400px] mx-auto p-6">
        <CreditPaymentsTable />
      </div>
    </div>
  );
}
