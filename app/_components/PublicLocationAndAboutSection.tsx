import React from "react";
import { MapPin, ShieldCheck, CheckCircle2, Users } from "lucide-react";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";

interface PublicLocationAndAboutSectionProps {
  settings: SystemSettingsData;
}

export const PublicLocationAndAboutSection: React.FC<PublicLocationAndAboutSectionProps> = ({
  settings,
}) => {
  const rtName = settings?.rtName || "RT 03";
  const fullAddress = settings?.secretariatAddress ||
    `${settings?.villageName || "Kelurahan Ambarketawang"}, ${settings?.subdistrict || "Kec. Gamping"}, ${settings?.city || "Kab. Sleman"}, Daerah Istimewa Yogyakarta 51291`;

  return (
    <section className="py-12 px-4 sm:px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Lokasi Kantor RT 03 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
          {/* Map Preview Graphic */}
          <div className="w-full sm:w-48 h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-sky-100/60 opacity-80" />
            <div className="relative z-10 flex flex-col items-center gap-1 text-blue-600">
              <MapPin className="w-8 h-8 fill-blue-600 text-white animate-bounce" />
              <span className="text-[10px] font-extrabold text-blue-900 bg-white/90 px-2 py-0.5 rounded-full border border-blue-200">
                Kantor {rtName}
              </span>
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-2 text-left flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Lokasi Kantor {rtName}
            </h3>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Alamat Kantor {rtName}</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {fullAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Tentang WargaKu */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Tentang <span className="text-blue-600">Warga</span><span className="text-emerald-600">Ku</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              WargaKu merupakan Sistem Informasi RT berbasis web yang mendukung pendataan penduduk, pengelolaan rumah, properti sewa, pembayaran kas, pengaduan, pengumuman hingga digitalisasi administrasi RT. Platform ini dirancang agar seluruh warga, pengurus RT dan pengelola properti dapat terhubung dalam satu sistem yang transparan, aman dan mudah digunakan.
            </p>
          </div>

          {/* 4 Trust Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Aman</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Transparan</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Andal</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Terintegrasi</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
