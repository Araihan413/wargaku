"use client";

import React from "react";
import { SearchInput } from "@/components/SearchInput";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { RotateCcw, Save, FolderOpen, RefreshCw } from "lucide-react";
import { CitizenFilterOptions } from "@/db/queries/residents/citizen-filter.queries";
import { SavedSmartGroup } from "@/db/queries/system/smart-group.queries";

interface CitizenFilterBarProps {
  filter: CitizenFilterOptions;
  onChange: (newFilter: CitizenFilterOptions) => void;
  onReset: () => void;
  savedGroups: SavedSmartGroup[];
  selectedGroupId: number | null;
  onSelectSavedGroup: (groupId: number | null) => void;
  onSavePreset: () => void;
  onUpdatePreset?: () => void;
  isSaving?: boolean;
}

const GENDER_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Jenis Kelamin" },
  { value: "L", label: "Laki-laki (L)" },
  { value: "P", label: "Perempuan (P)" },
];

const RELIGION_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Agama" },
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Khonghucu", label: "Khonghucu" },
];

const DWELLING_TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Status Tempat Tinggal" },
  { value: "permanen", label: "Warga Tetap (Permanen)" },
  { value: "kos", label: "Kos / Sewa" },
];

const BLOCK_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Blok Rumah" },
  { value: "A", label: "Blok A" },
  { value: "B", label: "Blok B" },
  { value: "C", label: "Blok C" },
  { value: "D", label: "Blok D" },
  { value: "E", label: "Blok E" },
];

const FEE_STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Status Iuran" },
  { value: "paid", label: "Lunas (Lancar)" },
  { value: "unpaid", label: "Menunggak" },
];

const RELATIONSHIP_LIST = [
  { id: "Kepala_Keluarga", label: "Kepala Keluarga" },
  { id: "Suami", label: "Suami" },
  { id: "Istri", label: "Istri" },
  { id: "Anak", label: "Anak" },
  { id: "Orang_Tua", label: "Orang Tua / Mertua" },
  { id: "Lainnya", label: "Lainnya" },
];

export const CitizenFilterBar: React.FC<CitizenFilterBarProps> = ({
  filter,
  onChange,
  onReset,
  savedGroups,
  selectedGroupId,
  onSelectSavedGroup,
  onSavePreset,
  onUpdatePreset,
  isSaving,
}) => {
  const savedGroupOptions: SelectOption[] = [
    { value: "none", label: "-- Pilih Preset Tersimpan --" },
    ...savedGroups.map((g) => ({
      value: String(g.id),
      label: g.name,
    })),
  ];

  const handleRelationshipToggle = (relId: string) => {
    const current = filter.relationships || [];
    const updated = current.includes(relId)
      ? current.filter((r) => r !== relId)
      : [...current, relId];
    onChange({ ...filter, relationships: updated });
  };

  return (
    <div className="p-5 border border-gray-border bg-gray-card rounded-2xl shadow-xs space-y-5">
      {/* Saved Preset Dropdown & Action Controls */}
      <div className="flex flex-col items-stretch sm:items-start justify-between gap-4 pb-4 border-b border-gray-border">
        <div className="flex-1 max-w-md w-full">
          <label className="text-xs font-bold text-gray-heading-main mb-1.5 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-primary" />
            <span>Buka Filter Favorit Tersimpan</span>
          </label>
          <CustomSelect
            options={savedGroupOptions}
            value={selectedGroupId ? String(selectedGroupId) : "none"}
            onChange={(val) => {
              if (val === "none") {
                onSelectSavedGroup(null);
              } else {
                onSelectSavedGroup(Number(val));
              }
            }}
            placeholder="Pilih Filter Tersimpan"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end">
          {selectedGroupId && onUpdatePreset && (
            <button
              type="button"
              onClick={onUpdatePreset}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSavePreset}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Simpan Sebagai Preset Baru</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-border hover:bg-gray-sidebar-hover text-gray-heading-main rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-secondary-text" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Main Grid Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Name/NIK */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Cari Nama Warga atau NIK
          </label>
          <SearchInput
            value={filter.searchQuery || ""}
            onChange={(val) => onChange({ ...filter, searchQuery: val })}
            placeholder="Ketik Nama atau NIK 16 Digit..."
            className="sm:w-full"
          />
        </div>

        {/* Rentang Usia */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Rentang Usia (Tahun)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="120"
              placeholder="Usia Min (misal: 17)"
              value={filter.minAge !== undefined ? filter.minAge : ""}
              onChange={(e) =>
                onChange({
                  ...filter,
                  minAge: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <span className="text-xs font-bold text-gray-secondary-text">s/d</span>
            <input
              type="number"
              min="0"
              max="120"
              placeholder="Usia Max (misal: 30)"
              value={filter.maxAge !== undefined ? filter.maxAge : ""}
              onChange={(e) =>
                onChange({
                  ...filter,
                  maxAge: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Jenis Kelamin
          </label>
          <CustomSelect
            options={GENDER_OPTIONS}
            value={filter.gender || "all"}
            onChange={(val) =>
              onChange({ ...filter, gender: val === "all" ? "" : (val as "L" | "P") })
            }
            placeholder="Pilih Jenis Kelamin"
          />
        </div>

        {/* Status Iuran */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Status Iuran RT
          </label>
          <CustomSelect
            options={FEE_STATUS_OPTIONS}
            value={filter.feeStatus || "all"}
            onChange={(val) =>
              onChange({ ...filter, feeStatus: val === "all" ? "" : (val as any) })
            }
            placeholder="Pilih Status Iuran"
          />
        </div>

        {/* Tipe Hunian */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Tipe Tempat Tinggal
          </label>
          <CustomSelect
            options={DWELLING_TYPE_OPTIONS}
            value={filter.dwellingType || "all"}
            onChange={(val) => onChange({ ...filter, dwellingType: val === "all" ? "" : val })}
            placeholder="Pilih Tipe Hunian"
          />
        </div>

        {/* Blok Rumah */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Blok Rumah
          </label>
          <CustomSelect
            options={BLOCK_OPTIONS}
            value={filter.blockNumber || "all"}
            onChange={(val) => onChange({ ...filter, blockNumber: val === "all" ? "" : val })}
            placeholder="Pilih Blok Rumah"
          />
        </div>

        {/* Agama */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Agama
          </label>
          <CustomSelect
            options={RELIGION_OPTIONS}
            value={filter.religion || "all"}
            onChange={(val) => onChange({ ...filter, religion: val === "all" ? "" : val })}
            placeholder="Pilih Agama"
          />
        </div>

        {/* Pekerjaan */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Pekerjaan
          </label>
          <input
            type="text"
            placeholder="Cari Pekerjaan (misal: Swasta, PNS)..."
            value={filter.occupation || ""}
            onChange={(e) => onChange({ ...filter, occupation: e.target.value })}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Hubungan Keluarga Multi-Select Checkboxes */}
      <div>
        <label className="block text-xs font-bold text-gray-heading-main mb-2">
          Hubungan Dalam Keluarga (Centang untuk Memfilter)
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {RELATIONSHIP_LIST.map((rel) => {
            const isChecked = (filter.relationships || []).includes(rel.id);
            return (
              <button
                type="button"
                key={rel.id}
                onClick={() => handleRelationshipToggle(rel.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-gray-100 border-gray-border text-gray-secondary-text hover:text-gray-heading-main"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // Handled by button click
                  className="rounded text-primary focus:ring-0 cursor-pointer pointer-events-none"
                />
                <span>{rel.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
