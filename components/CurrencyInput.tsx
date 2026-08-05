"use client";

import React from "react";

interface CurrencyInputProps {
  label?: string;
  required?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function formatRupiahDisplay(val: string | number): string {
  if (val === undefined || val === null || val === "") return "";
  const numStr = String(val).split(".")[0].replace(/[^0-9]/g, "");
  if (!numStr) return "";
  const num = parseInt(numStr, 10);
  return isNaN(num) ? "" : num.toLocaleString("id-ID");
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  required = false,
  value,
  onChange,
  placeholder = "500.000",
  disabled = false,
  id,
}) => {
  const formattedValue = formatRupiahDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    onChange(rawVal);
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-sm font-bold text-gray-secondary-text select-none">
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={formattedValue}
          onChange={handleChange}
          required={required}
          className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold font-mono text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
        />
      </div>
    </div>
  );
};
