import React from "react";
import { RotateCcw } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";
import { INCOME_CATEGORIES } from "../../types";

interface IncomeFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  startDate: string;
  onStartDateChange: (d: string) => void;
  endDate: string;
  onEndDateChange: (d: string) => void;
  onReset: () => void;
}

export const IncomeFilterBar: React.FC<IncomeFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
}) => {
  const categoryOptions = [
    { value: "", label: "Semua Kategori Pemasukan" },
    ...INCOME_CATEGORIES,
  ];

  return (
    <div className="p-4 border border-gray-border bg-gray-card rounded-2xl shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-end">
        {/* Search Query */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Cari deskripsi / kategori..."
          containerClassName="w-full"
        />

        {/* Category Select */}
        <div>
          <CustomSelect
            options={categoryOptions}
            value={selectedCategory}
            onChange={onCategoryChange}
            placeholder="Pilih Kategori"
          />
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* End Date */}
        <div className="flex gap-2">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="button"
            onClick={onReset}
            title="Reset Filter"
            className="p-2.5 border border-gray-border rounded-xl hover:bg-gray-sidebar-hover text-gray-secondary-text hover:text-gray-heading-main transition cursor-pointer shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
