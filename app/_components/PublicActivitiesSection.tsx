import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { PublicActivityItem } from "@/db/queries/dashboard/public-portal.queries";
import { formatLocalDate } from "@/lib/date-format";

interface PublicActivitiesSectionProps {
  activities: PublicActivityItem[];
}

export function PublicActivitiesSection({
  activities = [],
}: PublicActivitiesSectionProps) {
  const hasData = activities && activities.length > 0;

  return (
    <section id="kegiatan" className="py-8 px-4 sm:px-6 bg-white border-t border-slate-100">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Jadwal Terbaru
          </h2>
          <Link
            href="/kegiatan"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>

        {/* Activities List or Empty State */}
        {!hasData ? (
          <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-slate-100 rounded-full text-slate-400">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Jadwal Kegiatan Belum Dibuat
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Belum ada agenda kegiatan RT mendatang yang terdaftar saat ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activities.slice(0, 2).map((item) => {
              const upcoming = item.isUpcoming !== false;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
                >
                  {/* Green Calendar Icon Circle */}
                  <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-600 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {item.title}
                    </h3>

                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border font-bold text-[10px] ${
                          upcoming
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {upcoming ? "Akan Datang" : "Selesai"}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-medium text-slate-500 pt-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">
                          {formatLocalDate(
                            item.eventDate,
                            { weekday: "long", day: "numeric", month: "long", year: "numeric" },
                            "Tanggal Belum Ditentukan"
                          )}
                        </span>
                      </div>

                      {item.eventDate && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Pukul{" "}
                            {formatLocalDate(item.eventDate, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </span>
                        </div>
                      )}

                      {item.location && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
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
}
