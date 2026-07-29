"use client";

import React from "react";
import { X, Calendar, MapPin, User, Clock, Pin } from "lucide-react";
import { ActivityItem } from "../types";

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
}) => {
  if (!isOpen || !activity) return null;

  const eventDateObj = new Date(activity.eventDate);
  const now = new Date();
  const isPast = eventDateObj < now;

  const dateStr = eventDateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = eventDateObj.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-gray-border bg-gray-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-heading-main">
                Detail Agenda Kegiatan RT
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Pratinjau jadwal kegiatan sebagaimana dilihat oleh warga.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-secondary-text hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                isPast
                  ? "bg-gray-500/10 border-gray-500/20 text-gray-600"
                  : "bg-purple-500/10 border-purple-500/20 text-purple-600"
              }`}>
                {isPast ? "Sudah Selesai / Past" : "Mendatang / Upcoming"}
              </span>

              {activity.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-600">
                  <Pin className="h-3 w-3 fill-current" />
                  <span>Disematkan</span>
                </span>
              )}
            </div>

            {activity.creatorName && (
              <span className="flex items-center gap-1 text-xs text-gray-secondary-text">
                <User className="h-3.5 w-3.5 text-gray-placeholder" />
                Penyelenggara: {activity.creatorName}
              </span>
            )}
          </div>

          <h2 className="text-lg font-black text-gray-heading-main leading-snug">
            {activity.title}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/30">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-gray-secondary-text">Waktu Pelaksanaan</span>
                <strong className="block text-xs text-gray-heading-main">{dateStr} • {timeStr} WIB</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-border bg-gray-sidebar-hover/30">
              <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-gray-secondary-text">Lokasi Kegiatan</span>
                <strong className="block text-xs text-gray-heading-main">{activity.location || "Lokasi Lingkungan RT"}</strong>
              </div>
            </div>
          </div>

          {activity.description && (
            <div className="text-sm text-black/80 whitespace-pre-line leading-relaxed bg-gray-sidebar-hover/30 p-4 rounded-xl border border-gray-border/60 mt-2">
              {activity.description}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-gray-border px-6 py-4 bg-gray-sidebar-hover/30">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-900 transition-all cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
