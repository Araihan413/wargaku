import dynamic from "next/dynamic";
import { PublicHeroSection } from "@/app/_components/PublicHeroSection";
import { PublicAnnouncementsSection } from "@/app/_components/PublicAnnouncementsSection";
import { PublicActivitiesSection } from "@/app/_components/PublicActivitiesSection";
import { PublicFinanceAndEmergencySection } from "@/app/_components/PublicFinanceAndEmergencySection";
import { PublicLocationAndAboutSection } from "@/app/_components/PublicLocationAndAboutSection";
import { getPublicPortalData } from "@/db/queries/dashboard/public-portal.queries";
import { PublicPortalData } from "@/app/_components/types";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";

const PublicDemographicsSection = dynamic(
  () =>
    import("@/app/_components/PublicDemographicsSection").then(
      (mod) => mod.PublicDemographicsSection
    ),
  {
    loading: () => (
      <div className="py-12 px-4 sm:px-6 max-w-[1920px] mx-auto space-y-4 animate-pulse">
        <div className="h-7 w-56 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    ),
  }
);

export const revalidate = 60;

export default async function Home() {
  const data = (await getPublicPortalData()) as unknown as PublicPortalData;

  return (
    <div className="max-w-[1920px] mx-auto">
      {/* 1. Hero Section */}
      <PublicHeroSection settings={data.settings || ({} as SystemSettingsData)} />

      {/* 2. Pengumuman Terbaru */}
      <PublicAnnouncementsSection announcements={data.announcements || []} />

      {/* 3. Jadwal Terbaru (Agenda Kegiatan) */}
      <PublicActivitiesSection activities={data.activities || []} />

      {/* 4. Statistik Kependudukan & Visualisasi Grafik */}
      <PublicDemographicsSection demographics={data.demographics} />

      {/* 5. Transparansi Kas & Kontak Darurat */}
      <PublicFinanceAndEmergencySection
        finance={data.financeSummary}
        emergencyContacts={data.emergencyContacts || []}
      />

      {/* 6. Lokasi Kantor RT & Tentang WargaKu */}
      <PublicLocationAndAboutSection settings={data.settings || ({} as SystemSettingsData)} />
    </div>
  );
}
