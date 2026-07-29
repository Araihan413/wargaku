import React from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { AuditLogFilterState } from "../types";

interface AuditLogFilterBarProps {
  filter: AuditLogFilterState;
  onFilterChange: (newFilter: Partial<AuditLogFilterState>) => void;
  onExportCsv: () => void;
  isExporting: boolean;
}

export const AuditLogFilterBar: React.FC<AuditLogFilterBarProps> = ({
  filter,
  onFilterChange,
  onExportCsv,
  isExporting,
}) => {
  const moduleOptions = [
    { value: "all", label: "Semua Modul" },
    { value: "pengguna", label: "Pengguna & Akun" },
    { value: "keuangan", label: "Keuangan & Kas" },
    { value: "kependudukan", label: "Kependudukan & KK" },
    { value: "verifikasi", label: "Verifikasi Berkas" },
    { value: "hunian", label: "Hunian & Alamat" },
    { value: "pengumuman", label: "Pengumuman" },
    { value: "kegiatan", label: "Kegiatan RT" },
    { value: "laporan", label: "Laporan Aduan" },
    { value: "sistem", label: "Konfigurasi Sistem" },
  ];

  const dateRangeOptions = [
    { value: "all", label: "Semua Rentang Waktu" },
    { value: "today", label: "Hari Ini (24 Jam)" },
    { value: "7days", label: "7 Hari Terakhir" },
    { value: "30days", label: "30 Hari Terakhir" },
  ];

  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Cari Pelaku / NIK / Deskripsi
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              placeholder="Cari NIK, Nama, Aksi..."
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Filter Modul */}
        <div>
          <CustomSelect
            label="Filter Modul Sistem"
            value={filter.module}
            onChange={(val) => onFilterChange({ module: val, page: 1 })}
            options={moduleOptions}
          />
        </div>

        {/* Filter Rentang Waktu */}
        <div>
          <CustomSelect
            label="Rentang Waktu"
            value={filter.dateRange}
            onChange={(val) => onFilterChange({ dateRange: val, page: 1 })}
            options={dateRangeOptions}
          />
        </div>
      </div>

      {/* Export CSV Button */}
      <button
        type="button"
        onClick={onExportCsv}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-stretch md:self-auto shrink-0"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mengekspor...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Unduh Laporan Log (CSV)</span>
          </>
        )}
      </button>
    </div>
  );
};
