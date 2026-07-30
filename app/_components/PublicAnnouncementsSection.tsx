import React from "react";
import Link from "next/link";
import { Megaphone, Clock } from "lucide-react";
import { PublicAnnouncementItem } from "@/db/queries/public-portal";

interface PublicAnnouncementsSectionProps {
  announcements: PublicAnnouncementItem[];
}

const categoryStyles: Record<string, { label: string; textClass: string; bgClass: string; iconBg: string; iconColor: string }> = {
  umum: {
    label: "Umum",
    textClass: "text-blue-600",
    bgClass: "bg-blue-50 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  penting: {
    label: "Penting",
    textClass: "text-amber-600",
    bgClass: "bg-amber-50 text-amber-700",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  mendesak: {
    label: "Mendesak",
    textClass: "text-rose-600",
    bgClass: "bg-rose-50 text-rose-700",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
};

const getRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return "1 jam yang lalu";
  try {
    const d = new Date(dateStr);
    const diffHours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Baru saja";
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari yang lalu`;
  } catch {
    return "1 jam yang lalu";
  }
};

export const PublicAnnouncementsSection: React.FC<PublicAnnouncementsSectionProps> = ({
  announcements = [],
}) => {
  const hasData = announcements && announcements.length > 0;

  return (
    <section id="pengumuman" className="py-12 px-4 sm:px-6 bg-white">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengumuman Terbaru
          </h2>
          <Link
            href="/pengumuman"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>

        {/* Announcements List or Empty State */}
        {!hasData ? (
          <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-slate-100 rounded-full text-slate-400">
              <Megaphone className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Pengumuman Belum Dibuat
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Belum ada pengumuman resmi yang diterbitkan oleh pengurus RT saat ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {announcements.slice(0, 3).map((item) => {
              const cat = categoryStyles[item.category] || categoryStyles.umum;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-start gap-4"
                >
                  {/* Icon Circle */}
                  <div className={`p-3 rounded-full shrink-0 ${cat.iconBg} ${cat.iconColor}`}>
                    <Megaphone className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <span>Pengumuman</span>
                      <span>|</span>
                      <span className={cat.textClass}>{cat.label}</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug truncate">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getRelativeTime(item.publishedAt || item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
