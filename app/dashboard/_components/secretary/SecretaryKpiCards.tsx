"use client";

import React from "react";
import { UserCheck, MessageSquare, Calendar } from "lucide-react";
import { SecretaryKpiSummary } from "./types";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface SecretaryKpiCardsProps {
  summary: SecretaryKpiSummary;
}

export const SecretaryKpiCards: React.FC<SecretaryKpiCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: "Registrasi Akun Pending",
      value: summary.pendingRegistrations ?? 0,
      icon: UserCheck,
      unit: "warga",
      badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      iconBg: "bg-blue-500/15 text-blue-600",
    },
    {
      title: "Aduan Perlu Tindakan",
      value: summary.newComplaints ?? 0,
      icon: MessageSquare,
      unit: "laporan",
      badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      iconBg: "bg-rose-500/15 text-rose-600",
    },
    {
      title: "Kegiatan RT Mendatang",
      value: summary.upcomingActivities ?? 0,
      icon: Calendar,
      unit: "agenda",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      iconBg: "bg-purple-500/15 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-secondary-text">{card.title}</span>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-gray-heading-main">
                <AnimatedNumber value={card.value} />
              </div>
              <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${card.badgeColor}`}>
                {card.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
