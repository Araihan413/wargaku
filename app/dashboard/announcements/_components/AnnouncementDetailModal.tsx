"use client";

import React from "react";
import { X, Megaphone, Calendar, User, Pin } from "lucide-react";
import { AnnouncementItem } from "../types";

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementItem | null;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  isOpen,
  onClose,
  announcement,
}) => {
  if (!isOpen || !announcement) return null;

  const getCategoryBadge = (category: AnnouncementItem["category"]) => {
    switch (category) {
      case "mendesak":
        return <span className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-600">Mendesak</span>;
      case "penting":
        return <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600">Penting</span>;
      default:
        return <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-600">Umum</span>;
    }
  };

  const publishDate = announcement.publishedAt
    ? new Date(announcement.publishedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date(announcement.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-gray-border bg-gray-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-heading-main">
                Detail Pengumuman Warga
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Pratinjau pengumuman sebagaimana dilihat oleh warga RT.
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
              {getCategoryBadge(announcement.category)}
              {announcement.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-600">
                  <Pin className="h-3 w-3 fill-current" />
                  <span>Disematkan</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-secondary-text">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {publishDate}
              </span>
              {announcement.creatorName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-gray-placeholder" />
                  {announcement.creatorName}
                </span>
              )}
            </div>
          </div>

          <h2 className="text-lg font-black text-gray-heading-main leading-snug">
            {announcement.title}
          </h2>

          <div className="text-sm text-black/80 whitespace-pre-line leading-relaxed bg-gray-sidebar-hover/30 p-4 rounded-xl border border-gray-border/60">
            {announcement.content}
          </div>
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
