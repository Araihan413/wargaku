"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, Calendar, ChevronRight, Pin, AlertCircle, Info } from "lucide-react";

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  category: "umum" | "penting" | "mendesak";
  isPinned: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

interface WargaAnnouncementsWidgetProps {
  announcements: AnnouncementItem[];
}

export function WargaAnnouncementsWidget({ announcements }: WargaAnnouncementsWidgetProps) {
  const getCategoryBadge = (category: AnnouncementItem["category"]) => {
    switch (category) {
      case "mendesak":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-3 w-3" /> Mendesak
          </span>
        );
      case "penting":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertCircle className="h-3 w-3" /> Penting
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Info className="h-3 w-3" /> Umum
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const cleanStr = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  };

  return (
    <div className="rounded-3xl border border-gray-border bg-gray-card p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary dark:bg-primary-900/40">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">Pengumuman RT</h3>
            <p className="text-xs text-gray-secondary-text">Kabar & informasi warga resmi</p>
          </div>
        </div>
        <Link
          href="/announcements"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700 transition-colors"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Megaphone className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-heading-main">Belum Ada Pengumuman</p>
          <p className="text-xs text-gray-secondary-text">Pengumuman terbaru dari pengurus RT akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-gray-border/60 bg-gray-sidebar-hover p-3.5 transition-all hover:border-gray-border hover:bg-gray-card"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <span className="text-primary" title="Disematkan">
                      <Pin className="h-3.5 w-3.5 fill-current" />
                    </span>
                  )}
                  {getCategoryBadge(item.category)}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-placeholder">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-heading-main group-hover:text-primary transition-colors line-clamp-1">
                {item.title}
              </h4>
              <p className="text-xs text-gray-secondary-text mt-1 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
