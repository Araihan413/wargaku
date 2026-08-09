"use client";

import React from "react";
import {
  MessageSquare,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ComplaintKpiSummary } from "../types";

interface ComplaintKpiCardsProps {
  summary: ComplaintKpiSummary;
  activeStatus: string;
  onSelectStatus: (status: string) => void;
}

export const ComplaintKpiCards: React.FC<ComplaintKpiCardsProps> = ({
  summary,
  activeStatus,
  onSelectStatus,
}) => {
  const cards = [
    {
      key: "all",
      title: "Total Laporan",
      value: summary.total,
      icon: MessageSquare,
      unit: "aduan",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      activeBg: "ring-2 ring-blue-500/50 bg-blue-50/50",
    },
    {
      key: "menunggu",
      title: "Menunggu Respon",
      value: summary.menunggu,
      icon: Clock,
      unit: "pending",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      activeBg: "ring-2 ring-amber-500/50 bg-amber-50/50",
    },
    {
      key: "proses",
      title: "Sedang Diproses",
      value: summary.proses,
      icon: RefreshCw,
      unit: "penanganan",
      color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
      activeBg: "ring-2 ring-sky-500/50 bg-sky-50/50",
    },
    {
      key: "selesai",
      title: "Selesai Ditangani",
      value: summary.selesai,
      icon: CheckCircle2,
      unit: "tuntas",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      activeBg: "ring-2 ring-emerald-500/50 bg-emerald-50/50",
    },
    {
      key: "ditolak",
      title: "Laporan Ditolak",
      value: summary.ditolak,
      icon: XCircle,
      unit: "ditolak",
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      activeBg: "ring-2 ring-rose-500/50 bg-rose-50/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isActive = activeStatus === card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectStatus(card.key)}
            className={`flex flex-col justify-between rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm text-left transition-all hover:shadow-md cursor-pointer ${
              isActive ? card.activeBg : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-secondary-text">
                {card.title}
              </span>
              <div className={`rounded-xl p-2.5 border ${card.color}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-gray-heading-main">
                {card.value}
              </div>
              <span
                className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${card.color}`}
              >
                {card.unit}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
