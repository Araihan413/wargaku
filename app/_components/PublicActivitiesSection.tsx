import React from "react";
import { Calendar, MapPin } from "lucide-react";
import { PublicActivityItem } from "@/db/queries/public-portal";

interface PublicActivitiesSectionProps {
  activities: PublicActivityItem[];
}

export const PublicActivitiesSection: React.FC<PublicActivitiesSectionProps> = ({
  activities,
}) => {
  const displayItems = activities.length > 0 ? activities : [
    {
      id: 1,
      title: "Imunisasi Balita >3 Tahun",
      description: "Pemeriksaan kesehatan dan imunisasi berkala balita.",
      eventDate: new Date().toISOString(),
      location: "Pos Kamling RT 03",
      isPinned: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Imunisasi Balita >3 Tahun",
      description: "Pemeriksaan kesehatan dan imunisasi berkala balita.",
      eventDate: new Date().toISOString(),
      location: "Pos Kamling RT 03",
      isPinned: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <section id="kegiatan" className="py-8 px-4 sm:px-6 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Jadwal Terbaru
          </h2>
          <a
            href="#kegiatan"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Lihat Semua
          </a>
        </div>

        {/* 2 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayItems.slice(0, 2).map((item) => (
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
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                    Sedang Berlangsung
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span className="truncate">{item.location || "Pos Kamling RT 03"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
