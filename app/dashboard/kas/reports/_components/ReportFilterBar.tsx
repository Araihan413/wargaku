import React from "react";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { RotateCcw } from "lucide-react";
import { ReportFilterState } from "../types";

interface ReportFilterBarProps {
  filter: ReportFilterState;
  onFilterChange: (newFilter: ReportFilterState) => void;
  onReset: () => void;
}

const MONTH_OPTIONS: SelectOption[] = [
  { value: "all", label: "Semua Bulan (Setahun Penuh)" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS: SelectOption[] = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - i;
  return { value: String(y), label: `Tahun ${y}` };
});

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filter,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="p-4 border border-gray-border bg-gray-card rounded-2xl shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
        {/* Filter Bulan */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Filter Bulan Periode
          </label>
          <CustomSelect
            options={MONTH_OPTIONS}
            value={filter.month}
            onChange={(val) => onFilterChange({ ...filter, month: val })}
            placeholder="Pilih Bulan"
          />
        </div>

        {/* Filter Tahun */}
        <div>
          <label className="block text-xs font-bold text-gray-heading-main mb-1.5">
            Filter Tahun Periode
          </label>
          <CustomSelect
            options={YEAR_OPTIONS}
            value={String(filter.year)}
            onChange={(val) => onFilterChange({ ...filter, year: parseInt(val, 10) })}
            placeholder="Pilih Tahun"
          />
        </div>

        {/* Action / Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            title="Reset Filter Periode"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-xs font-bold text-gray-heading-main transition cursor-pointer w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-secondary-text" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
