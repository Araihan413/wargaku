"use client";

import React from "react";
import { Calendar, MapPin, Plus, ChevronRight, Clock } from "lucide-react";
import { UpcomingActivityItem } from "./types";
import Link from "next/link";

interface UpcomingActivitiesWidgetProps {
  activities: UpcomingActivityItem[];
}

export const UpcomingActivitiesWidget: React.FC<UpcomingActivitiesWidgetProps> = ({ activities }) => {
  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Agenda Kegiatan RT
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Jadwal rapat warga, kerja bakti, & posyandu mendatang.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/activities"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          <span>Kelola</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-gray-secondary-text">
          <Clock className="h-7 w-7 text-gray-border mb-1.5" />
          <span>Belum ada agenda kegiatan mendatang.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((act) => {
            const dateObj = new Date(act.eventDate);
            const dateStr = dateObj.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const timeStr = dateObj.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/30 hover:border-primary/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-extrabold text-gray-heading-main">
                      {act.title}
                    </strong>
                    {act.isPinned && (
                      <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-600">
                        Disematkan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-secondary-text">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      {dateStr} • {timeStr} WIB
                    </span>
                    {act.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-gray-placeholder" />
                        {act.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/activities"
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-border py-2 text-xs font-bold text-gray-secondary-text hover:border-primary hover:text-primary transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Kegiatan RT Baru</span>
      </Link>
    </div>
  );
};
