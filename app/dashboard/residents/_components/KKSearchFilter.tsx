import React from "react";
import { Search } from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface KKSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedActive: string;
  setSelectedActive: (active: string) => void;
  setCurrentPage: (page: number) => void;
}

export const KKSearchFilter: React.FC<KKSearchFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedActive,
  setSelectedActive,
  setCurrentPage,
}) => {
  const statusOptions: SelectOption[] = [
    { value: "", label: "Semua Status Verifikasi" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Terverifikasi" },
    { value: "rejected", label: "Ditolak" },
  ];

  const activeOptions: SelectOption[] = [
    { value: "true", label: "Hanya KK Aktif" },
    { value: "false", label: "Hanya KK Nonaktif" },
    { value: "", label: "Semua Status Keaktifan" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-card border border-gray-border rounded-2xl p-4 shadow-sm items-end">
      {/* Search Input */}
      <div className="relative md:col-span-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-placeholder" />
        </div>
        <input
          type="text"
          placeholder="Cari nomor KK atau nama Kepala Keluarga..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="block w-full rounded-xl border border-gray-border bg-gray-card py-2.5 pl-10 pr-3 text-gray-heading-main placeholder-gray-placeholder text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
      </div>

      {/* Verification Status Filter */}
      <div>
        <CustomSelect
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
          options={statusOptions}
          placeholder="Semua Status Verifikasi"
        />
      </div>

      {/* Active/Inactive Filter */}
      <div>
        <CustomSelect
          value={selectedActive}
          onChange={(val) => {
            setSelectedActive(val);
            setCurrentPage(1);
          }}
          options={activeOptions}
          placeholder="Hanya KK Aktif"
        />
      </div>
    </div>
  );
};
