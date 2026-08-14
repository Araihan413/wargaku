import React from "react";
import { MapPin, ShieldCheck, CheckCircle2, Users, Navigation } from "lucide-react";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";

interface PublicLocationAndAboutSectionProps {
  settings: SystemSettingsData;
}

export const PublicLocationAndAboutSection: React.FC<PublicLocationAndAboutSectionProps> = ({
  settings,
}) => {
  const rtName = settings?.rtName || "RT 03";
  const fullAddress = settings?.secretariatAddress ||
    `${settings?.villageName || "Kelurahan Ambarketawang"}, ${settings?.subdistrict || "Kec. Gamping"}, ${settings?.city || "Kab. Sleman"}`;

  const hasCoordinates = Boolean(settings?.latitude && settings?.longitude);
  const lat = settings?.latitude || "";
  const lng = settings?.longitude || "";
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <section className="py-12 px-4 sm:px-6 bg-slate-50 border-t border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Lokasi Sekretariat RT */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                Sekretariat RT
              </h3>
              {hasCoordinates ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  📍 Lokasi GPS
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Koordinat Belum Set
                </span>
              )}
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-700">Alamat Sekretariat (Rumah Ketua RT)</p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {fullAddress}
              </p>
              {hasCoordinates && (
                <p className="text-[11px] text-slate-400 font-mono pt-1">
                  Koordinat: {lat}, {lng}
                </p>
              )}
            </div>
          </div>

          {/* Interactive Map Preview / Embed */}
          {hasCoordinates ? (
            <div className="w-full h-44 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner bg-slate-100">
              <iframe
                title="Peta Lokasi Sekretariat RT"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="w-full h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 bg-sky-100/60 opacity-80" />
              <div className="relative z-10 flex flex-col items-center gap-1 text-blue-600 text-center px-4">
                <MapPin className="w-8 h-8 fill-blue-600 text-white animate-bounce" />
                <span className="text-[11px] font-extrabold text-blue-900 bg-white/90 px-3 py-1 rounded-full border border-blue-200 shadow-xs">
                  Sekretariat (Rumah Ketua {rtName})
                </span>
              </div>
            </div>
          )}

          {/* Direct Google Maps Navigation Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs"
          >
            <Navigation className="w-4 h-4" />
            <span>Buka Navigasi Rute di Google Maps (GPS)</span>
          </a>
        </div>

        {/* Card 2: Tentang WargaKu */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 h-max">
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Tentang <span className="text-blue-600">Warga</span><span className="text-emerald-600">Ku</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              WargaKu merupakan Sistem Informasi RT berbasis web yang mendukung pendataan penduduk, pengelolaan rumah, properti sewa, pembayaran kas, pengaduan, pengumuman hingga digitalisasi administrasi RT. Platform ini dirancang agar seluruh warga, pengurus RT dan pengelola properti dapat terhubung dalam satu sistem yang transparan, aman dan mudah digunakan.
            </p>
          </div>

          {/* 4 Trust Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
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
