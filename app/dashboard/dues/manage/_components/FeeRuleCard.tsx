"use client";

import React from "react";
import { Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { FeeRule } from "../../types";

interface FeeRuleCardProps {
  rule: FeeRule;
  onEdit: (rule: FeeRule) => void;
  onDelete: (rule: FeeRule) => void;
  onGenerate: (rule: FeeRule) => void;
  isGenerating?: boolean;
}

export const FeeRuleCard: React.FC<FeeRuleCardProps> = ({
  rule,
  onEdit,
  onDelete,
  onGenerate,
  isGenerating = false,
}) => {
  const isInactive = rule.isActive === false;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
      isInactive
        ? "border-gray-border/80 bg-gray-card/40 opacity-80"
        : "border-gray-border bg-gray-card/70 hover:bg-gray-card"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 rounded-xl ${
          isInactive
            ? "bg-gray-200 text-gray-500"
            : "bg-primary/10 text-primary"
        }`}>
          {isInactive ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold ${isInactive ? "text-gray-heading-main/70" : "text-gray-heading-main"}`}>{rule.name}</p>
            {isInactive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                Non-Aktif
              </span>
            )}
          </div>
          <p className={`text-xl font-black mt-0.5 font-mono ${isInactive ? "text-gray-heading-main/60" : "text-primary"}`}>
            Rp {rule.amount.toLocaleString("id-ID")}
            <span className="text-xs text-gray-secondary-text font-normal ml-1">/ KK / bulan</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onGenerate(rule)}
          disabled={isGenerating || isInactive}
          title={isInactive ? "Aturan iuran non-aktif tidak dapat digenerate" : "Generate tagihan bulan ini ulang"}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
            isInactive
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
              : "text-primary border border-primary/30 hover:bg-primary/10 cursor-pointer disabled:opacity-50"
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Generate</span>
        </button>
        <button
          onClick={() => onEdit(rule)}
          className="p-2 rounded-xl text-gray-secondary-text hover:text-primary hover:bg-primary/10 transition cursor-pointer"
          title="Edit aturan iuran"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(rule)}
          className="p-2 rounded-xl text-gray-secondary-text hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title="Hapus aturan iuran"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
