import React from "react";
import { Search } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { ComplaintsReportFilterState } from "../types";

interface ComplaintsReportFilterBarProps {
  filter: ComplaintsReportFilterState;
  onFilterChange: (newFilter: Partial<ComplaintsReportFilterState>) => void;
}

// ─── Option Lists ──────────────────────────────────────────────────

const complaintStatusOptions = [
  { value: "all", label: "Semua Status Aduan" },
  { value: "menunggu", label: "Menunggu Tindakan" },
  { value: "proses", label: "Sedang Diproses" },
  { value: "selesai", label: "Selesai Ditangani" },
  { value: "ditolak", label: "Ditolak" },
];

const complaintCategoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "Infrastruktur", label: "Infrastruktur" },
  { value: "Kebersihan", label: "Kebersihan Lingkungan" },
  { value: "Keamanan", label: "Keamanan Wilayah" },
  { value: "Sosial", label: "Permasalahan Sosial" },
  { value: "Lainnya", label: "Lainnya" },
];

const announcementCategoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "umum", label: "Pengumuman Umum" },
  { value: "penting", label: "Informasi Penting" },
  { value: "mendesak", label: "Mendesak / Darurat" },
];

const activityFilterOptions = [
  { value: "all", label: "Semua Kegiatan" },
  { value: "upcoming", label: "Kegiatan Mendatang" },
  { value: "past", label: "Kegiatan Telah Selesai" },
];

export const ComplaintsReportFilterBar: React.FC<ComplaintsReportFilterBarProps> = ({
  filter,
  onFilterChange,
}) => {
  const isComplaints = filter.tab === "complaints";
  const isAnnouncements = filter.tab === "announcements";
  const isActivities = filter.tab === "activities";

  const searchPlaceholder = isComplaints
    ? "Cari kode, nama, deskripsi aduan..."
    : isAnnouncements
    ? "Cari judul atau isi pengumuman..."
    : "Cari nama, lokasi kegiatan...";

  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-end gap-3">
      {/* Search Box */}
      <div className="flex-1">
        <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
          Kata Kunci Pencarian
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder={searchPlaceholder}
            className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Complaints: Status & Category Filter */}
      {isComplaints && (
        <>
          <div className="w-full sm:w-56">
            <CustomSelect
              label="Filter Status Aduan"
              value={filter.status}
              onChange={(val) => onFilterChange({ status: val, page: 1 })}
              options={complaintStatusOptions}
            />
          </div>
          <div className="w-full sm:w-56">
            <CustomSelect
              label="Filter Kategori Aduan"
              value={filter.category}
              onChange={(val) => onFilterChange({ category: val, page: 1 })}
              options={complaintCategoryOptions}
            />
          </div>
        </>
      )}

      {/* Announcements: Category Filter */}
      {isAnnouncements && (
        <div className="w-full sm:w-64">
          <CustomSelect
            label="Filter Kategori Pengumuman"
            value={filter.category}
            onChange={(val) => onFilterChange({ category: val, page: 1 })}
            options={announcementCategoryOptions}
          />
        </div>
      )}

      {/* Activities: Time Filter */}
      {isActivities && (
        <div className="w-full sm:w-64">
          <CustomSelect
            label="Filter Waktu Kegiatan"
            value={filter.filter}
            onChange={(val) => onFilterChange({ filter: val, page: 1 })}
            options={activityFilterOptions}
          />
        </div>
      )}
    </div>
  );
};
