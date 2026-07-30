import React from "react";
import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface PublicPageHeroBannerProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  backUrl?: string;
  backText?: string;
}

export const PublicPageHeroBanner: React.FC<PublicPageHeroBannerProps> = ({
  icon: Icon,
  title,
  subtitle,
  backUrl = "/",
  backText = "Kembali ke Beranda Utama",
}) => {
  return (
    <section className="bg-linear-to-b from-blue-600 via-blue-800 to-blue-900 text-white pt-12 pb-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-[1920px] mx-auto space-y-4 relative z-10">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full border border-white/15 w-max"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backText}</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/20 border border-white/30 text-white">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
