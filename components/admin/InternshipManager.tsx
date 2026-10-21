"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useReferenceData } from "@/components/ReferenceProvider";
import { categoriesFor } from "@/lib/reference";
import {
  deleteInternship,
  saveInternship,
  setInternshipActive,
  validateInternship,
  type InternshipInput,
} from "@/lib/admin";
import type { FactorType, Internship, SpecializationCode } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPEC_ID: Record<SpecializationCode, string> = { SAGE: "spec_sage", DELTA: "spec_delta" };

export function InternshipManager() {
  const { data: ref, source, reload } = useReferenceData();
  const [spec, setSpec] = useState<SpecializationCode>("SAGE");
  const [editing, setEditing] = useState<InternshipInput | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const cats = categoriesFor(ref, spec);
  const list = ref.internships.filter((i) => i.specialization_id === SPEC_ID[spec]);

  function startNew() {
    setMessage(null);
    setEditing({
      specialization_id: SPEC_ID[spec],
      position_name: "",
      company_name: "",
      description: "",
      vacancy_url: "",
      is_active: true,
      targets: cats.map((c, idx) => ({
        competency_category_id: c.id,
        target_score: 3,
        factor_type: idx < 3 ? "CORE" : "SECONDARY",
      })),
    });
  }

  function startEdit(i: Internship) {
    setMessage(null);
    const targets = ref.targets.filter((t) => t.internship_id === i.id);
    setEditing({
      id: i.id,
      specialization_id: i.specialization_id,
      position_name: i.position_name,
      company_name: i.company_name,
      description: i.description ?? "",
      vacancy_url: i.vacancy_url ?? "",
      is_active: i.is_active !== false,
      targets: categoriesFor(ref, i.specialization_id === "spec_sage" ? "SAGE" : "DELTA").map((c) => {
        const t = targets.find((x) => x.competency_category_id === c.id);
        return {
          competency_category_id: c.id,
          target_score: t?.target_score ?? 2,
          factor_type: t?.factor_type ?? "SECONDARY",
        };
      }),
    });
  }

  async function toggleActive(i: Internship) {
    setBusyId(i.id);
    const res = await setInternshipActive(i.id, i.is_active === false);
    setBusyId(null);
    if (!res.success) return setMessage({ type: "error", text: res.error ?? "Gagal mengubah status." });
    await reload();
    setMessage({
      type: "ok",
      text: i.is_active === false ? `${i.position_name} kembali ditampilkan.` : `${i.position_name} disembunyikan dari mahasiswa.`,
    });
  }

  async function remove(i: Internship) {
    if (!window.confirm(`Hapus ${i.position_name} di ${i.company_name}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(i.id);
    const res = await deleteInternship(i.id);
    setBusyId(null);
    if (!res.success) return setMessage({ type: "error", text: res.error ?? "Gagal menghapus." });
    await reload();
    setMessage({ type: "ok", text: `${i.position_name} sudah dihapus.` });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Lowongan & nilai target</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Setiap posisi butuh target 1 sampai 4 untuk keenam kompetensi. Tandai yang paling penting sebagai utama (core
            factor), sisanya pendukung. Perubahan langsung dipakai di perhitungan mahasiswa berikutnya.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus size={16} /> Tambah posisi
        </Button>
      </div>

      {source === "static" && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
          Data lowongan sedang dibaca dari cadangan lokal. Penyebabnya bisa database belum tersambung, atau nilai target di
          database masih memakai skala lama 1-5. Jalankan supabase/migration_002_admin.sql supaya data database ikut
          dipakai dan bisa diubah dari sini.
        </div>
      )}
      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl border p-4 text-sm",
            message.type === "ok" ? "border-ok/30 bg-ok-soft text-ok" : "border-brand/30 bg-brand-soft text-brand",
          )}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-1 rounded-lg bg-surface-2 p-1 sm:w-fit" role="tablist" aria-label="Peminatan">
        {(["SAGE", "DELTA"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={spec === s}
            onClick={() => setSpec(s)}
            className={cn(
              "flex-1 rounded-md px-5 py-1.5 text-sm font-semibold transition sm:flex-none",
              spec === s ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-2.5 text-left font-semibold">Posisi</th>
              {cats.map((c) => (
                <th key={c.id} className="px-2 py-2.5 text-center font-semibold" title={c.name}>
                  {c.shortName}
                </th>
              ))}
              <th className="px-5 py-2.5 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => {
              const targets = ref.targets.filter((t) => t.internship_id === i.id);
              const inactive = i.is_active === false;
              return (
                <tr key={i.id} className={cn("border-t border-line", inactive && "opacity-55")}>
                  <td className="px-5 py-3">
                    <div className="font-semibold">
                      {i.position_name}
                      {inactive && <span className="ml-2 text-[11px] font-normal text-muted">(disembunyikan)</span>}
                    </div>
                    <div className="text-xs text-muted">{i.company_name}</div>
                  </td>
                  {cats.map((c) => {
                    const t = targets.find((x) => x.competency_category_id === c.id);
                    return (
                      <td key={c.id} className="px-2 py-3 text-center font-mono text-xs">
                        {t ? (
                          <span
                            className={cn(
                              "inline-block min-w-[30px] rounded px-1.5 py-0.5",
                              t.factor_type === "CORE" ? "bg-ink text-bg" : "bg-surface-2",
                            )}
                            title={t.factor_type === "CORE" ? "Utama" : "Pendukung"}
                          >
                            {t.target_score}
                            {t.factor_type === "CORE" ? "U" : "P"}
                          </span>
                        ) : (
                          "–"
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {busyId === i.id ? (
                        <Loader2 size={16} className="animate-spin text-muted" />
                      ) : (
                        <>
                          <IconButton label={`Ubah ${i.position_name}`} onClick={() => startEdit(i)}>
                            <Pencil size={15} />
                          </IconButton>
                          <IconButton
                            label={inactive ? `Tampilkan ${i.position_name}` : `Sembunyikan ${i.position_name}`}
                            onClick={() => toggleActive(i)}
                          >
                            {inactive ? <Eye size={15} /> : <EyeOff size={15} />}
                          </IconButton>
                          <IconButton label={`Hapus ${i.position_name}`} onClick={() => remove(i)} danger>
                            <Trash2 size={15} />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">U = kompetensi utama (core factor), P = pendukung (secondary factor).</p>

      {editing && (
        <InternshipForm
          key={editing.id ?? "new"}
          initial={editing}
          categories={categoriesFor(ref, editing.specialization_id === "spec_sage" ? "SAGE" : "DELTA")}
          onCancel={() => setEditing(null)}
          onSaved={async (name) => {
            await reload();
            setEditing(null);
            setMessage({ type: "ok", text: `${name} tersimpan.` });
          }}
        />
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-md p-1.5 text-muted transition hover:bg-surface-2",
        danger ? "hover:text-brand" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function InternshipForm({
  initial,
  categories,
  onCancel,
  onSaved,
}: {
  initial: InternshipInput;
  categories: { id: string; name: string }[];
  onCancel: () => void;
  onSaved: (name: string) => Promise<void>;
}) {
  const [form, setForm] = useState<InternshipInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof InternshipInput>(key: K, value: InternshipInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setTarget = (catId: string, patch: Partial<{ target_score: number; factor_type: FactorType }>) =>
    setForm((f) => ({
      ...f,
      targets: f.targets.map((t) => (t.competency_category_id === catId ? { ...t, ...patch } : t)),
    }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateInternship(form);
    if (invalid) return setError(invalid);
    setSaving(true);
    setError(null);
    const res = await saveInternship(form);
    setSaving(false);
    if (!res.success) return setError(res.error ?? "Belum tersimpan.");
    await onSaved(form.position_name);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
    >
      <form
        onSubmit={submit}
        className="animate-rise max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-surface p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="form-title" className="font-display text-xl font-semibold">
            {initial.id ? "Ubah posisi magang" : "Tambah posisi magang"}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Tutup" className="rounded-md p-1 text-muted hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="f-pos">Nama posisi</Label>
            <Input id="f-pos" value={form.position_name} onChange={(e) => set("position_name", e.target.value)} placeholder="Data Engineer Intern" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-com">Perusahaan atau instansi</Label>
            <Input id="f-com" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="PT Contoh Digital" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="f-desc">Deskripsi singkat</Label>
            <Textarea
              id="f-desc"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Apa yang dikerjakan anak magang di posisi ini?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-url">Tautan lowongan</Label>
            <Input id="f-url" type="url" value={form.vacancy_url} onChange={(e) => set("vacancy_url", e.target.value)} placeholder="https://…" />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Tampilkan ke mahasiswa
          </label>
        </div>

        <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted">Nilai target per kompetensi</h3>
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
          {categories.map((c) => {
            const t = form.targets.find((x) => x.competency_category_id === c.id)!;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1">{c.name}</span>
                <Select
                  aria-label={`Target ${c.name}`}
                  className="h-8 w-20 py-0 text-xs"
                  value={t.target_score}
                  onChange={(e) => setTarget(c.id, { target_score: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
                <div className="flex rounded-md bg-surface-2 p-0.5 text-xs font-semibold">
                  {(["CORE", "SECONDARY"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTarget(c.id, { factor_type: f })}
                      aria-pressed={t.factor_type === f}
                      className={cn(
                        "rounded px-2.5 py-1 transition",
                        t.factor_type === f ? (f === "CORE" ? "bg-ink text-bg" : "bg-surface text-ink shadow-sm") : "text-muted",
                      )}
                    >
                      {f === "CORE" ? "Utama" : "Pendukung"}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />} Simpan posisi
          </Button>
        </div>
      </form>
    </div>
  );
}
