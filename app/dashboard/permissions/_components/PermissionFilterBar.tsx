import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

interface PermissionFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedModule: string;
  onModuleChange: (mod: string) => void;
  moduleOptions: { value: string; label: string }[];
  totalPermissions: number;
  hasChanges: boolean;
  onResetChanges: () => void;
}

export const PermissionFilterBar: React.FC<PermissionFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedModule,
  onModuleChange,
  moduleOptions,
  totalPermissions,
  hasChanges,
  onResetChanges,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* Search & Module filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {/* Search */}
        <div className="relative">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Cari Izin Fitur / Slug
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari 'view-residents' atau 'Kelola'..."
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Filter Modul */}
        <div>
          <CustomSelect
            label="Filter Berdasarkan Modul"
            value={selectedModule}
            onChange={onModuleChange}
            options={[
              { value: "all", label: `Semua Modul (${totalPermissions} Permission)` },
              ...moduleOptions,
            ]}
          />
        </div>
      </div>

      {/* Reset button if changes exist */}
      {hasChanges && (
        <button
          type="button"
          onClick={onResetChanges}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer self-stretch md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Batalkan Perubahan</span>
        </button>
      )}
    </div>
  );
};
