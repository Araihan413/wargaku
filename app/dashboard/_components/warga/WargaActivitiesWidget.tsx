"use client";

import React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Clock, ChevronRight } from "lucide-react";

export interface ActivityItem {
  id: number;
  title: string;
  description?: string | null;
  eventDate: string;
  location?: string | null;
  isPinned?: boolean;
}

interface WargaActivitiesWidgetProps {
  activities: ActivityItem[];
}

export function WargaActivitiesWidget({ activities }: WargaActivitiesWidgetProps) {
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("id-ID", { month: "short" });
    const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return { dayName, day, month, time };
  };

  return (
    <div className="rounded-3xl border border-gray-border bg-gray-card p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">Kegiatan RT Mendatang</h3>
            <p className="text-xs text-gray-secondary-text">Agenda & kegiatan bersama</p>
          </div>
        </div>
        <Link
          href="/activities"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-700 transition-colors"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-heading-main">Belum Ada Agenda Mendatang</p>
          <p className="text-xs text-gray-secondary-text">Jadwal kegiatan RT terbaru akan diinformasikan di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => {
            const { dayName, day, month, time } = formatEventDate(item.eventDate);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3.5 rounded-2xl border border-gray-border/60 bg-gray-sidebar-hover p-3.5 transition-all hover:border-gray-border hover:bg-gray-card"
              >
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary px-3 py-2 shrink-0 min-w-[54px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{month}</span>
                  <span className="text-lg font-black leading-tight">{day}</span>
                  <span className="text-[10px] font-medium text-primary-700 dark:text-primary-300">{dayName}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-heading-main truncate">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-gray-secondary-text mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-secondary-text">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>Pukul {time} WIB</span>
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
