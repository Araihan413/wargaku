"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

export interface DwellingOption {
  id: number;
  label: string;
  blockNumber: string;
  houseNumber: string;
  type: string;
  ownerUserId: string | null;
}

interface DwellingSearchSelectProps {
  dwellings: DwellingOption[];
  isLoading?: boolean;
  selectedDwellingId: string;
  onSelect: (dwellingId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DwellingSearchSelect: React.FC<DwellingSearchSelectProps> = ({
  dwellings,
  isLoading = false,
  selectedDwellingId,
  onSelect,
  placeholder = "-- Cari alamat hunian --",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync searchQuery with selection changes during render phase to avoid cascading renders
  const selectedDwelling = useMemo(() => {
    return dwellings.find((d) => String(d.id) === selectedDwellingId);
  }, [dwellings, selectedDwellingId]);

  const [prevSelectedDwellingId, setPrevSelectedDwellingId] = useState(selectedDwellingId);
  const [prevDwellings, setPrevDwellings] = useState(dwellings);

  if (selectedDwellingId !== prevSelectedDwellingId || dwellings !== prevDwellings) {
    setPrevSelectedDwellingId(selectedDwellingId);
    setPrevDwellings(dwellings);

    const found = dwellings.find((d) => String(d.id) === selectedDwellingId);
    if (found) {
      setSearchQuery(found.label);
    } else {
      setSearchQuery("");
    }
  }

  // Filter dwellings based on query
  const filteredDwellings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return dwellings;
    return dwellings.filter(
      (d) =>
        d.label.toLowerCase().includes(query) ||
        d.blockNumber.toLowerCase().includes(query) ||
        d.houseNumber.toLowerCase().includes(query)
    );
  }, [searchQuery, dwellings]);

  // Handle click outside to reset query
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (selectedDwelling) {
          setSearchQuery(selectedDwelling.label);
        } else {
          setSearchQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedDwelling]);

  const handleSelectOption = (dwelling: DwellingOption) => {
    onSelect(String(dwelling.id));
    setSearchQuery(dwelling.label);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect("");
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          disabled={disabled || isLoading}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value.trim()) {
              onSelect("");
            }
          }}
          onFocus={() => {
            if (!disabled && !isLoading) {
              setIsOpen(true);
            }
          }}
          placeholder={isLoading ? "Memuat alamat hunian..." : placeholder}
          className="w-full bg-gray-sidebar-hover/30 border border-gray-border rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-gray-heading-main placeholder-gray-placeholder outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          required={!selectedDwellingId}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-placeholder" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 text-gray-placeholder transition-transform duration-200 ${
                isOpen ? "transform rotate-180 text-primary" : ""
              }`}
            />
          )}
        </div>
      </div>

      {isOpen && !isLoading && (
        <div className="absolute left-0 z-50 w-full rounded-xl border border-gray-border bg-gray-card p-1.5 shadow-xl max-h-52 overflow-y-auto outline-none animate-in fade-in duration-150 mt-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {searchQuery.trim() && (
            <div
              onClick={handleClear}
              className="flex items-center rounded-lg py-2 px-2.5 cursor-pointer text-xs text-error hover:bg-gray-sidebar-hover font-medium border-b border-gray-border/40 mb-1"
            >
              -- Hapus Pilihan --
            </div>
          )}

          {filteredDwellings.length === 0 ? (
            <div className="py-3 px-2.5 text-xs text-gray-placeholder text-center">
              Tidak ada alamat hunian yang cocok
            </div>
          ) : (
            filteredDwellings.map((d) => {
              const isSelected = String(d.id) === selectedDwellingId;
              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectOption(d)}
                  className={`flex flex-col gap-0.5 rounded-lg py-2 px-2.5 cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover"
                  }`}
                >
                  <span className="font-medium text-gray-heading-main">{d.label}</span>
                  <span className="text-[10px] text-gray-placeholder capitalize">
                    Tipe: {d.type === "kos" ? "Kos / Kontrakan" : "Homestay / Penginapan"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
