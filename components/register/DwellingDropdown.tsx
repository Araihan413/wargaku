import React, { useRef, useState, useEffect } from "react";
import { MapPin, ChevronDown, Check, PlusCircle } from "lucide-react";

interface DwellingOption {
  id: number;
  label: string;
}

interface DwellingDropdownProps {
  dwellingsList: DwellingOption[];
  dwellingId: string;
  onSelect: (id: string) => void;
  error?: string;
}

export const DwellingDropdown: React.FC<DwellingDropdownProps> = ({
  dwellingsList,
  dwellingId,
  onSelect,
  error,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-body-text-btn tracking-wider mb-2">
        Alamat Rumah Tinggal
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex w-full items-center justify-between rounded-xl border ${
            error ? "border-error" : "border-gray-border"
          } bg-gray-card py-3 pl-10 pr-4 text-left text-gray-heading-main focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm outline-none transition-all cursor-pointer`}
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MapPin className="h-4 w-4 text-gray-placeholder" />
          </span>

          <span className={!dwellingId ? "text-gray-placeholder" : ""}>
            {dwellingsList.find((d) => String(d.id) === String(dwellingId))?.label ||
                "Pilih alamat rumah terdaftar..."}
          </span>

          <ChevronDown
            className={`h-4 w-4 text-gray-placeholder transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-border bg-gray-card p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
              {dwellingsList.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-placeholder text-center">
                  Memuat daftar hunian...
                </div>
              ) : (
                dwellingsList.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelect(String(option.id));
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-left transition-all ${
                      String(dwellingId) === String(option.id)
                        ? "bg-primary text-white font-semibold"
                        : "text-gray-heading-main hover:bg-gray-sidebar-hover cursor-pointer"
                    }`}
                  >
                    <span>{option.label}</span>
                    {String(dwellingId) === String(option.id) && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))
              )}

            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
};
