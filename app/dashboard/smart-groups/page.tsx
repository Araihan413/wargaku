"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Play,
  Save,
  FileSpreadsheet,
  Printer,
  Loader2,
  Users,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  X
} from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/CustomSelect";
import { EnrichedCitizen, QueryRule } from "@/db/queries/smart-groups";
import { ConfirmModal } from "@/components/ConfirmModal";

const fieldOptions = [
  { value: "name", label: "Nama Warga" },
  { value: "nik", label: "NIK (KTP)" },
  { value: "age", label: "Usia (Tahun)" },
  { value: "gender", label: "Jenis Kelamin (L/P)" },
  { value: "relationship", label: "Hubungan Keluarga" },
  { value: "occupation", label: "Pekerjaan" },
  { value: "educationLevel", label: "Pendidikan Terakhir" },
  { value: "religion", label: "Agama" },
  { value: "headOccupation", label: "Pekerjaan Kepala Keluarga" },
  { value: "feeStatus", label: "Status Iuran Keluarga" },
  { value: "kkMembersCount", label: "Jumlah Anggota Keluarga" }
];

const operatorOptions = [
  { value: "==", label: "Sama Dengan (==)" },
  { value: "!=", label: "Tidak Sama Dengan (!=)" },
  { value: ">", label: "Lebih Besar (>)" },
  { value: ">=", label: "Lebih Besar Sama Dengan (>=)" },
  { value: "<", label: "Kurang Dari (<)" },
  { value: "<=", label: "Kurang Dari Sama Dengan (<=)" },
  { value: "IN", label: "Di Dalam Daftar (IN)" },
  { value: "NOT IN", label: "Tidak Di Dalam Daftar (NOT IN)" }
];

const genderOptions = [
  { value: "L", label: "Laki-laki (L)" },
  { value: "P", label: "Perempuan (P)" }
];

const relationshipOptions = [
  { value: "Kepala_Keluarga", label: "Kepala Keluarga" },
  { value: "Istri", label: "Istri" },
  { value: "Anak", label: "Anak" },
  { value: "Orang_Tua", label: "Orang Tua" },
  { value: "Lainnya", label: "Lainnya" }
];

const feeStatusOptions = [
  { value: "lancar", label: "Lancar (Lunas)" },
  { value: "menunggak", label: "Menunggak (Ada Tunggakan)" }
];

const religionOptions = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen Protestan" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Khonghucu", label: "Khonghucu" }
];

interface SavedGroup {
  id: number;
  name: string;
  queryRules: {
    globalOperator: "AND" | "OR";
    rules: QueryRule[];
  };
  createdAt: string;
}

export default function SmartGroupsPage() {
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);
  const [activeGroupRules, setActiveGroupRules] = useState<QueryRule[]>([
    { field: "age", operator: ">=", value: "60", weight: null }
  ]);
  const [globalOperator, setGlobalOperator] = useState<"AND" | "OR">("AND");
  const [citizens, setCitizens] = useState<EnrichedCitizen[]>([]);
  
  // Loading & Action states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedSavedGroupId, setSelectedSavedGroupId] = useState<string>("");

  // Delete saved group confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupIdToDelete, setGroupIdToDelete] = useState<number | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Load Saved Groups
  const fetchSavedGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/smart-groups");
      if (res.ok) {
        const result = await res.json();
        setSavedGroups(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat daftar kelompok warga yang disimpan");
    }
  }, []);

  // Run dynamic evaluation
  const handleEvaluate = useCallback(async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/smart-groups/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: activeGroupRules,
          globalOperator
        })
      });

      if (res.ok) {
        const result = await res.json();
        setCitizens(result.data || []);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyaring data warga");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi saat menyaring data");
    } finally {
      setIsEvaluating(false);
    }
  }, [activeGroupRules, globalOperator]);

  useEffect(() => {
    const init = async () => {
      await fetchSavedGroups();
      await handleEvaluate();
    };
    init();
  }, [fetchSavedGroups, handleEvaluate]);

  // Add a new empty rule row
  const addRule = () => {
    setActiveGroupRules((prev) => [
      ...prev,
      { field: "name", operator: "==", value: "", weight: null }
    ]);
  };

  // Remove a rule row
  const removeRule = (index: number) => {
    if (activeGroupRules.length === 1) {
      toast.warning("Wajib memiliki minimal 1 aturan saringan");
      return;
    }
    setActiveGroupRules((prev) => prev.filter((_, i) => i !== index));
  };

  // Update rule field values
  const updateRuleField = (index: number, key: keyof QueryRule, val: any) => {
    setActiveGroupRules((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const updated = { ...r, [key]: val };
        
        // Reset operator & value if field changed to avoid type mismatches
        if (key === "field") {
          updated.operator = "==";
          updated.value = "";
        }
        return updated;
      })
    );
  };

  // Save the rule builder as a named template
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Nama kelompok wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/smart-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          queryRules: {
            globalOperator,
            rules: activeGroupRules
          }
        })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Kelompok warga berhasil disimpan!");
        setNewGroupName("");
        setIsSaveModalOpen(false);
        fetchSavedGroups();
        setSelectedSavedGroupId(String(result.id));
      } else {
        throw new Error(result.error || "Gagal menyimpan kelompok");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = (id: number) => {
    setGroupIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteGroup = async () => {
    if (groupIdToDelete === null) return;
    setIsDeletingGroup(true);
    try {
      const res = await fetch(`/api/smart-groups/${groupIdToDelete}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Kelompok warga berhasil dihapus");
        fetchSavedGroups();
        if (selectedSavedGroupId === String(groupIdToDelete)) {
          setSelectedSavedGroupId("");
        }
        setIsDeleteConfirmOpen(false);
        setGroupIdToDelete(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus kelompok");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // Apply a loaded template
  const handleLoadSavedGroup = (groupIdStr: string) => {
    setSelectedSavedGroupId(groupIdStr);
    if (!groupIdStr) return;

    const group = savedGroups.find((g) => String(g.id) === groupIdStr);
    if (group) {
      setGlobalOperator(group.queryRules.globalOperator || "AND");
      setActiveGroupRules(group.queryRules.rules || []);
      toast.info(`Berhasil memuat template: ${group.name}`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (citizens.length === 0) {
      toast.warning("Tidak ada data warga untuk diekspor");
      return;
    }

    const headers = [
      "Nama Lengkap",
      "NIK",
      "Usia",
      "Hubungan Keluarga",
      "Alamat Blok",
      "No Rumah",
      "Jenis Hunian",
      "Pekerjaan",
      "Pekerjaan Kepala Keluarga",
      "Status Iuran",
      "Jumlah Tanggungan KK",
      "Skor Kelayakan"
    ];

    const rows = citizens.map((c) => [
      `"${c.name}"`,
      `'${c.nik}`, // Prefix with single quote to prevent Excel from scientific notation
      c.age,
      c.relationship,
      `"${c.blockNumber}"`,
      `"${c.houseNumber}"`,
      c.dwellingType,
      `"${c.occupation || '-'}"`,
      `"${c.headOccupation || '-'}"`,
      c.feeStatus,
      c.kkMembersCount,
      c._score ?? 0
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `kelompok_warga_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengekspor data ke file CSV/Excel!");
  };

  const hasWeightScore = activeGroupRules.some(
    (r) => r.weight !== undefined && r.weight !== null && Number(r.weight) > 0
  );

  return (
    <div className="space-y-6 pb-12 print:bg-white print:pb-0 print:space-y-4">
      {/* Header (Hidden in Print) */}
      <div className="space-y-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Kelompok Warga (Smart Grouping)
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Pengelompokan warga dinamis berbasis kriteria kustom (Visual Rule Builder) & skor prioritas penerima bantuan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-2 bg-gray-card hover:bg-gray-sidebar-hover text-gray-heading-main px-4 py-2 border border-gray-border rounded-xl text-sm font-semibold cursor-pointer shadow-xs transition-all"
          >
            <Save className="h-4 w-4" />
            Simpan
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary hover:bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-xs transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-xs transition-all"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Print Only Header (Visible only when printing) */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-4">
        <h1 className="text-2xl font-bold text-center text-gray-900 uppercase">
          LAPORAN PENGELOMPOKAN DATA WARGA RT
        </h1>
        <p className="text-sm text-center text-gray-700 mt-1">
          Dibuat secara otomatis oleh sistem administrasi Wargaku
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-gray-700">
          <div>
            <span className="block font-semibold">Tipe Aturan Filter:</span>
            <span className="block">
              Global Operator: <strong className="text-gray-950">{globalOperator}</strong>
            </span>
            <div className="mt-1 space-y-0.5">
              {activeGroupRules.map((r, i) => (
                <div key={i} className="text-[10px]">
                  - {fieldOptions.find(f => f.value === r.field)?.label} {r.operator} {String(r.value)} {r.weight ? `(Bobot: +${r.weight})` : ""}
                </div>
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className="block">Tanggal Cetak: {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="block font-semibold mt-1">Total Hasil Saringan: {citizens.length} Warga</span>
          </div>
        </div>
      </div>

      {/* Visual Rule Builder Dashboard (Hidden in Print) */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-6 shadow-sm print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-border pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Visual Rule Builder</h3>
              <p className="text-[10px] text-gray-secondary-text">Tentukan aturan logika dan parameter penyaringan</p>
            </div>
          </div>

          {/* Load saved template dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FolderOpen className="h-4.5 w-4.5 text-gray-placeholder shrink-0" />
            <select
              value={selectedSavedGroupId}
              onChange={(e) => handleLoadSavedGroup(e.target.value)}
              className="text-xs bg-gray-sidebar-hover/30 border border-gray-border rounded-xl px-3 py-2 text-gray-heading-main focus:outline-none focus:border-primary transition-all cursor-pointer w-full sm:w-56"
            >
              <option value="">-- Panggil Template Kelompok --</option>
              {savedGroups.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>
            {selectedSavedGroupId && (
              <button
                type="button"
                onClick={() => handleDeleteGroup(Number(selectedSavedGroupId))}
                className="p-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                title="Hapus template terpilih"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Logic Selector */}
        <div className="bg-gray-sidebar-hover/20 p-4 rounded-xl border border-gray-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-gray-heading-main">Gerbang Logika Global (Global Operator)</span>
            <span className="block text-[10px] text-gray-secondary-text">Bagaimana hubungan logika antara baris-baris filter yang ditumpuk?</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGlobalOperator("AND")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                globalOperator === "AND"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              Mode DAN (AND) - Saringan Ketat
            </button>
            <button
              type="button"
              onClick={() => setGlobalOperator("OR")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                globalOperator === "OR"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              Mode ATAU (OR) - Saringan Longgar
            </button>
          </div>
        </div>

        {/* Dynamic Rules Rows */}
        <div className="space-y-4">
          {activeGroupRules.map((rule, idx) => {
            const isNumericField = ["age", "kkMembersCount"].includes(rule.field);
            const isSelectField = ["gender", "relationship", "feeStatus", "religion"].includes(rule.field);

            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border border-gray-border/80 rounded-2xl bg-gray-sidebar-hover/10"
              >
                {/* 1. Field Name */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider">
                    Kolom Data (Field)
                  </label>
                  <CustomSelect
                    value={rule.field}
                    onChange={(val) => updateRuleField(idx, "field", val)}
                    options={fieldOptions}
                  />
                </div>

                {/* 2. Logical Operator */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider">
                    Operator Perbandingan
                  </label>
                  <CustomSelect
                    value={rule.operator}
                    onChange={(val) => updateRuleField(idx, "operator", val)}
                    options={operatorOptions}
                  />
                </div>

                {/* 3. Compare Value */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider">
                    Nilai Pembanding (Value)
                  </label>
                  {rule.field === "gender" ? (
                    <CustomSelect
                      value={rule.value}
                      onChange={(val) => updateRuleField(idx, "value", val)}
                      options={genderOptions}
                    />
                  ) : rule.field === "relationship" ? (
                    <CustomSelect
                      value={rule.value}
                      onChange={(val) => updateRuleField(idx, "value", val)}
                      options={relationshipOptions}
                    />
                  ) : rule.field === "feeStatus" ? (
                    <CustomSelect
                      value={rule.value}
                      onChange={(val) => updateRuleField(idx, "value", val)}
                      options={feeStatusOptions}
                    />
                  ) : rule.field === "religion" ? (
                    <CustomSelect
                      value={rule.value}
                      onChange={(val) => updateRuleField(idx, "value", val)}
                      options={religionOptions}
                    />
                  ) : (
                    <input
                      type={isNumericField ? "number" : "text"}
                      placeholder={
                        rule.operator === "IN" || rule.operator === "NOT IN"
                          ? "Pisah koma: Petani, Buruh"
                          : "Masukkan nilai..."
                      }
                      value={rule.value || ""}
                      onChange={(e) => updateRuleField(idx, "value", e.target.value)}
                      className="w-full rounded-xl border border-gray-border bg-gray-card py-2.5 px-3 text-gray-heading-main text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-placeholder"
                    />
                  )}
                </div>

                {/* 4. Weight Point Score */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-heading-main uppercase tracking-wider">
                    Bobot Poin (+Skor)
                  </label>
                  <input
                    type="number"
                    placeholder="Opsional (cth: 40)"
                    value={rule.weight || ""}
                    onChange={(e) =>
                      updateRuleField(
                        idx,
                        "weight",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full rounded-xl border border-gray-border bg-gray-card py-2.5 px-3 text-gray-heading-main text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-placeholder"
                  />
                </div>

                {/* 5. Delete Button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                    title="Hapus kriteria ini"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Builder Actions */}
        <div className="flex items-center justify-between border-t border-gray-border pt-4">
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-border rounded-xl text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Baris Kriteria
          </button>

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all"
          >
            {isEvaluating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Terapkan & Evaluasi Data
          </button>
        </div>
      </div>

      {/* Results Live Preview */}
      <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-heading-main">Live Preview Hasil Saringan</h3>
              <p className="text-[10px] text-gray-secondary-text">Menampilkan warga yang lolos kriteria saat ini</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
            {citizens.length} Warga Ditemukan
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isEvaluating ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-gray-placeholder gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              Menyaring data kependudukan wilayah RT...
            </div>
          ) : citizens.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-gray-placeholder gap-2 min-h-60">
              <AlertTriangle className="h-10 w-10 text-amber-500 animate-bounce" />
              <h4 className="font-bold text-gray-heading-main text-sm">Tidak Ada Warga yang Cocok</h4>
              <p className="max-w-xs text-[10px] leading-relaxed text-gray-secondary-text">
                Kriteria saringan yang Anda tumpuk terlalu ketat atau tidak ada data warga yang memenuhinya. Coba longgarkan atau ubah operator.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
                  <th className="py-4 px-5">Nama Warga</th>
                  <th className="py-4 px-5">NIK</th>
                  <th className="py-4 px-5 text-center">Usia</th>
                  <th className="py-4 px-5 text-center">Hubungan KK</th>
                  <th className="py-4 px-5">Alamat RT</th>
                  <th className="py-4 px-5">Pekerjaan</th>
                  <th className="py-4 px-5 text-center">Status Iuran</th>
                  {hasWeightScore && <th className="py-4 px-5 text-right text-emerald-600">Skor Kelayakan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
                {citizens.map((citizen) => (
                  <tr key={citizen.id} className="hover:bg-gray-sidebar-hover/30 transition-colors print:hover:bg-transparent">
                    <td className="py-4 px-5 font-semibold">{citizen.name}</td>
                    <td className="py-4 px-5 font-mono text-gray-secondary-text">{citizen.nik}</td>
                    <td className="py-4 px-5 text-center font-medium">{citizen.age} Thn</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        citizen.relationship === "Kepala_Keluarga"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-gray-sidebar-hover text-gray-secondary-text"
                      }`}>
                        {citizen.relationship.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      Blok {citizen.blockNumber} No. {citizen.houseNumber}
                    </td>
                    <td className="py-4 px-5 text-gray-secondary-text">{citizen.occupation || "-"}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        citizen.feeStatus === "lancar"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {citizen.feeStatus === "lancar" ? "Lancar" : "Menunggak"}
                      </span>
                    </td>
                    {hasWeightScore && (
                      <td className="py-4 px-5 text-right font-extrabold text-emerald-600 text-sm">
                        +{citizen._score} Poin
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Save Template Modal (Hidden in Print) */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-2xl shadow-xl flex flex-col z-10 mx-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Save className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-heading-main">Simpan Template Kelompok</h3>
                  <p className="text-[10px] text-gray-secondary-text">Simpan aturan agar siap dipanggil kembali</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 hover:bg-gray-sidebar-hover rounded-lg text-gray-secondary-text hover:text-gray-heading-main transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGroup}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="groupName" className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
                    Nama Kelompok Warga
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    required
                    placeholder="Contoh: Sembako Lansia Bulanan, Dhuafa RT"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full rounded-xl border border-gray-border bg-gray-card py-3 px-4 text-gray-heading-main placeholder-gray-placeholder sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-border px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-semibold text-gray-secondary-text cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Ya, Simpan Kelompok"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature block for PDF report (Visible only in Print) */}
      <div className="hidden print:block mt-16 text-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="block font-semibold">Catatan Penggunaan:</span>
            <span className="block text-gray-600 max-w-md mt-1 leading-relaxed">
              Daftar di atas disaring secara dinamis berdasarkan aturan kriteria visual yang ditentukan oleh pengurus. Laporan ini resmi untuk urusan internal RT.
            </span>
          </div>
          <div className="text-center w-60 border-t border-transparent pt-4">
            <span className="block">Mengetahui,</span>
            <span className="block font-semibold mt-0.5">Ketua RT Setempat</span>
            <div className="h-16" /> {/* Spacer for signature */}
            <span className="block font-extrabold border-b border-gray-900 pb-0.5 w-44 mx-auto">
              (......................................)
            </span>
          </div>
        </div>
      </div>

      {/* Modal Dialog: Konfirmasi Hapus Kelompok */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setGroupIdToDelete(null);
        }}
        onConfirm={executeDeleteGroup}
        title="Hapus Kelompok Warga?"
        description="Apakah Anda yakin ingin menghapus kelompok warga ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingGroup}
      />
    </div>
  );
}
