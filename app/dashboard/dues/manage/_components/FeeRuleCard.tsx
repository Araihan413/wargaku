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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-border bg-gray-card/70 hover:bg-gray-card transition-all">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 rounded-xl ${rule.isMandatory ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
          {rule.isMandatory ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-heading-main">{rule.name}</p>
          <p className="text-xl font-black text-primary mt-0.5 font-mono">
            Rp {rule.amount.toLocaleString("id-ID")}
            <span className="text-xs text-gray-secondary-text font-normal ml-1">/ KK / bulan</span>
          </p>
          <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${rule.isMandatory ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
            {rule.isMandatory ? "● Iuran Wajib" : "○ Sukarela / Donasi"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onGenerate(rule)}
          disabled={isGenerating}
          title="Generate tagihan bulan ini ulang"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/10 transition cursor-pointer disabled:opacity-50"
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
