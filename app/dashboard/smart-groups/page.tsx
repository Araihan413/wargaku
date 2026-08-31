"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CitizenFilterBar } from "./_components/CitizenFilterBar";
import { CitizenFilterOptions, FilteredCitizen } from "@/db/queries/residents/citizen-filter.queries";
import { SavedSmartGroup } from "@/db/queries/system/smart-group.queries";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { ConfirmModal } from "@/components/ConfirmModal";
import { SmartGroupsSkeleton } from "./_components/SmartGroupsSkeleton";
import { TableSkeleton } from "@/components/TableSkeleton";

const initialFilterState: CitizenFilterOptions = {
  searchQuery: "",
  minAge: undefined,
  maxAge: undefined,
  gender: "",
  relationships: [],
  religion: "",
  occupation: "",
  educationLevel: "",
  dwellingType: "",
  blockNumber: "",
  feeStatus: "",
};

export default function SmartGroupsPage() {
  const [filter, setFilter] = useState<CitizenFilterOptions>(initialFilterState);
  const debouncedFilter = useDebounce(filter, 400);

  const [citizens, setCitizens] = useState<FilteredCitizen[]>([]);
  const [savedGroups, setSavedGroups] = useState<SavedSmartGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch saved groups list
  const fetchSavedGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/smart-groups");
      if (res.ok) {
        const json = await res.json();
        setSavedGroups(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching saved groups:", err);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function loadGroups() {
      try {
        const res = await fetch("/api/smart-groups");
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            setSavedGroups(json.data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching saved groups:", err);
      }
    }
    loadGroups();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function loadFiltered() {
      setIsEvaluating(true);
      try {
        const res = await fetch("/api/smart-groups/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria: debouncedFilter }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Gagal memfilter data warga");
        }

        const json = await res.json();
        if (!isCancelled) {
          setCitizens(json.data || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          toast.error(err.message || "Terjadi kesalahan saat memfilter data");
        }
      } finally {
        if (!isCancelled) {
          setIsEvaluating(false);
        }
      }
    }

    loadFiltered();

    return () => {
      isCancelled = true;
    };
  }, [debouncedFilter]);

  // Handle selecting a saved preset
  const handleSelectSavedGroup = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    if (!groupId) {
      setFilter(initialFilterState);
      return;
    }

    const group = savedGroups.find((g) => g.id === groupId);
    if (group && group.criteria) {
      setFilter({
        ...initialFilterState,
        ...group.criteria,
      });
      toast.info(`Preset "${group.name}" terpasang`);
    }
  };

  const handleResetFilters = () => {
    setSelectedGroupId(null);
    setFilter(initialFilterState);
    toast.success("Filter telah di-reset ke kondisi awal");
  };

  // Save as new preset
  const handleSaveNewPreset = async () => {
    if (!newGroupName.trim()) {
      toast.error("Nama preset filter wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/smart-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          criteria: filter,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menyimpan preset filter");
      }

      const json = await res.json();
      toast.success("Preset filter berhasil disimpan!");
      setIsSaveModalOpen(false);
      setNewGroupName("");
      await fetchSavedGroups();
      if (json.data?.id) {
        setSelectedGroupId(json.data.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan preset");
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing preset
  const handleUpdatePreset = async () => {
    if (!selectedGroupId) return;

    const currentGroup = savedGroups.find((g) => g.id === selectedGroupId);
    if (!currentGroup) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/smart-groups/${selectedGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentGroup.name,
          criteria: filter,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memperbarui preset filter");
      }

      toast.success(`Preset "${currentGroup.name}" berhasil diperbarui!`);
      await fetchSavedGroups();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui preset");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved preset
  const handleDeletePreset = async () => {
    if (!deletingGroupId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/smart-groups/${deletingGroupId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus preset filter");
      }

      toast.success("Preset filter berhasil dihapus!");
      if (selectedGroupId === deletingGroupId) {
        setSelectedGroupId(null);
      }
      setDeletingGroupId(null);
      await fetchSavedGroups();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus preset");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (citizens.length === 0) {
      toast.warning("Tidak ada data warga untuk diekspor");
      return;
    }

    const headers = [
      "Nama Lengkap",
      "NIK",
      "Jenis Kelamin",
      "Usia",
      "Hubungan Keluarga",
      "No. KK",
      "Blok / No. Rumah",
      "Agama",
      "Pekerjaan",
      "Status Iuran",
    ];

    const rows = citizens.map((c) => [
      `"${c.name}"`,
      `"${c.nik}"`,
      c.gender === "L" ? "Laki-laki" : "Perempuan",
      c.age !== null ? c.age : "-",
      `"${c.relationship.replace(/_/g, " ")}"`,
      `"${c.familyNumber || "-"}"`,
      `"${c.dwellingBlock ? `Blok ${c.dwellingBlock} No. ${c.dwellingHouse || "-"}` : "-"}"`,
      `"${c.religion || "-"}"`,
      `"${c.occupation || "-"}"`,
      c.feeStatus === "paid" ? "Lunas" : "Menunggak",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daftar_warga_terfilter_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Daftar warga berhasil diekspor ke CSV/Excel!");
  };

  if (isEvaluating && citizens.length === 0) {
    return <SmartGroupsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
            <span>Kelompok Warga (Filter Terpadu)</span>
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Pencarian dan penyaringan data warga terpadu secara akurat, cepat, dan mudah disesuaikan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Citizen Filter Bar */}
      <div className="print:hidden">
        <CitizenFilterBar
          filter={filter}
          onChange={setFilter}
          onReset={handleResetFilters}
          savedGroups={savedGroups}
          selectedGroupId={selectedGroupId}
          onSelectSavedGroup={handleSelectSavedGroup}
          onSavePreset={() => setIsSaveModalOpen(true)}
          onUpdatePreset={handleUpdatePreset}
          isSaving={isSaving}
        />
      </div>

      {/* Main Results Table Section */}
      <div className="border border-gray-border bg-gray-card rounded-2xl shadow-xs overflow-hidden p-4 md:p-5 space-y-4 print:border-none print:p-0">
        {/* Table Controls / Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-border print:pb-2 print:mb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-heading-main tracking-tight print:text-lg">
              Daftar Hasil Penyaringan Warga
            </h2>
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Menampilkan <span className="font-bold text-gray-heading-main">{citizens.length}</span> warga aktif yang sesuai dengan kriteria filter
            </p>
          </div>

          {selectedGroupId && (
            <div className="flex items-center gap-2 print:hidden">
              <span className="text-xs font-semibold text-gray-secondary-text">
                Preset Aktif:{" "}
                <span className="font-bold text-primary">
                  {savedGroups.find((g) => g.id === selectedGroupId)?.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setDeletingGroupId(selectedGroupId)}
                title="Hapus Preset Filter Ini"
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Loading / Empty / Table Content */}
        {isEvaluating ? (
          <div className="overflow-x-auto rounded-xl border border-gray-border print:border-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap & NIK</th>
                  <th className="py-3.5 px-4">L/P</th>
                  <th className="py-3.5 px-4">Usia</th>
                  <th className="py-3.5 px-4">Hubungan</th>
                  <th className="py-3.5 px-4">Blok & Rumah</th>
                  <th className="py-3.5 px-4">Agama</th>
                  <th className="py-3.5 px-4">Pendidikan</th>
                  <th className="py-3.5 px-4">Pekerjaan</th>
                  <th className="py-3.5 px-4 text-center">Status Iuran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                <TableSkeleton rowCount={5} colCount={10} showActionButtons={false} cellPadding="py-3 px-4" />
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-border print:border-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap & NIK</th>
                  <th className="py-3.5 px-4">L/P</th>
                  <th className="py-3.5 px-4">Usia</th>
                  <th className="py-3.5 px-4">Hubungan</th>
                  <th className="py-3.5 px-4">Blok & Rumah</th>
                  <th className="py-3.5 px-4">Agama</th>
                  <th className="py-3.5 px-4">Pendidikan</th>
                  <th className="py-3.5 px-4">Pekerjaan</th>
                  <th className="py-3.5 px-4 text-center">Status Iuran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border/60 print:divide-black">
                {citizens.length > 0 ? (
                  citizens.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-secondary-text">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-gray-heading-main block">{c.name}</span>
                        <span className="text-[10px] text-gray-placeholder block mt-0.5">
                          NIK: {c.nik}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">{c.gender}</td>
                      <td className="py-3 px-4 font-bold">{c.age !== null ? `${c.age} th` : "-"}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-heading-main">
                          {c.relationship.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.dwellingBlock ? (
                          <span className="font-bold text-gray-heading-main">
                            Blok {c.dwellingBlock} No. {c.dwellingHouse || "-"}
                          </span>
                        ) : (
                          <span className="text-gray-placeholder">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{c.religion || "-"}</td>
                      <td className="py-3 px-4">{c.educationLevel || "-"}</td>
                      <td className="py-3 px-4">{c.occupation || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        {c.feeStatus === "paid" ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                            Lunas
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                            Menunggak
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-xs text-gray-secondary-text">
                      Tidak ada warga yang sesuai dengan kriteria filter yang Anda terapkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Preset Modal Prompt */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Simpan Sebagai Preset Filter Baru
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Berikan nama kustom untuk kombinasi filter ini agar dapat dipanggil kembali kapan saja.
            </p>

            <div>
              <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                Nama Preset Filter <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="misal: Warga Lansia Menunggak Blok A..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 border border-gray-border text-gray-heading-main rounded-xl text-xs font-bold hover:bg-gray-sidebar-hover transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewPreset}
                disabled={isSaving}
                className="px-4 py-2 bg-primary hover:bg-primary-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Preset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGroupId && (
        <ConfirmModal
          isOpen={!!deletingGroupId}
          onClose={() => setDeletingGroupId(null)}
          onConfirm={handleDeletePreset}
          title="Hapus Preset Filter"
          description="Apakah Anda yakin ingin menghapus preset filter tersimpan ini? Tindakan ini tidak dapat dibatalkan."
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
