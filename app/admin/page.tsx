"use client";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <AdminGate>
        <AdminDashboard />
      </AdminGate>
    </div>
  );
}
