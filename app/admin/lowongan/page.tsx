"use client";
import { AdminGate } from "@/components/admin/AdminGate";
import { InternshipManager } from "@/components/admin/InternshipManager";

export default function AdminInternshipPage() {
  return (
    <AdminGate>
      <InternshipManager />
    </AdminGate>
  );
}
