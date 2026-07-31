import React from "react";
import Link from "next/link";
import { Wallet, Bell } from "lucide-react";
import Image from "next/image";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";
import BacgroundHero from '@/public/background/BackgroundHero.webp'

interface PublicHeroSectionProps {
  settings: SystemSettingsData;
}

export const PublicHeroSection: React.FC<PublicHeroSectionProps> = ({ settings }) => {
  const rtName = settings?.rtName || "RT 03";

  return (
    <section id="beranda"> 
      <div className="relative flex items-center h-130">
        <div className="bg-linear-to-l bg-white/50 sm:bg-transparent from-0% lg:from-30% to-100% to-white/90 w-full h-full absolute z-9"></div>
        <Image
          src={BacgroundHero}
          alt="WargaKu Perumahan & Keluarga RT"
          fill
          className="object-cover h-80 object-center"
          priority
          unoptimized
        />
        <div className="absolute z-10 px-10">
          <div className="lg:col-span-7 space-y-6 text-left sm:w-3/5 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 ">
              Bersama Mewujudkan{" "}
              <span className="text-blue-600">RT {rtName.replace(/RT\s*/i, "")}</span> yang Tertib, Aman dan Transparansi
            </h1>

            <p className="text-xs sm:text-base text-slate-900 sm:text-slate-600 leading-relaxed font-medium max-w-xl">
              WargaKu adalah sistem informasi RT yang membantu pengelolaan data warga, pelayanan administrasi, keuangan, dan informasi dengan mudah dan transparan.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 mt-14">
              <Link
                href="/transparansi-kas"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Lihat Transparansi Kas</span>
              </Link>

              <Link
                href="/lapor"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-600 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Lapor Pengaduan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
