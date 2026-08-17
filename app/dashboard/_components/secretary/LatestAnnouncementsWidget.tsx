"use client";

import React from "react";
import { Megaphone, Plus, ChevronRight, Clock } from "lucide-react";
import { LatestAnnouncementItem } from "./types";
import Link from "next/link";

interface LatestAnnouncementsWidgetProps {
  announcements: LatestAnnouncementItem[];
}

export const LatestAnnouncementsWidget: React.FC<LatestAnnouncementsWidgetProps> = ({
  announcements,
}) => {
  const getCategoryBadge = (category: LatestAnnouncementItem["category"]) => {
    switch (category) {
      case "mendesak":
        return <span className="rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600">Mendesak</span>;
      case "penting":
        return <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600">Penting</span>;
      default:
        return <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Umum</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 shrink-0">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Pengumuman Warga RT
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Publikasi informasi & berita penting warga.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/announcements"
          className="inline-flex items-center self-end sm:self-auto gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <span>Kelola</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-gray-secondary-text">
          <Clock className="h-7 w-7 text-gray-border mb-1.5" />
          <span>Belum ada pengumuman warga.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/30 hover:border-primary/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-extrabold text-gray-heading-main">
                    {ann.title}
                  </strong>
                  {getCategoryBadge(ann.category)}
                </div>
                <div className="text-[11px] text-gray-secondary-text">
                  Diterbitkan: {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString("id-ID") : "Draf"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/announcements"
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-border py-2 text-xs font-bold text-gray-secondary-text hover:border-primary hover:text-primary transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Buat Pengumuman Baru</span>
      </Link>
    </div>
  );
};
