"use client";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminGate } from "@/components/admin/AdminGate";
import { InternshipManager } from "@/components/admin/InternshipManager";

export default function AdminInternshipPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <AdminGate>
        <InternshipManager />
      </AdminGate>
    </div>
  );
}
