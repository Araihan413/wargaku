import React from "react";
import { PublicHeaderNavbar } from "@/app/_components/PublicHeaderNavbar";
import { PublicContactFooter } from "@/app/_components/PublicContactFooter";
import { getPublicRtInfo } from "@/db/queries/dashboard/public-portal.queries";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: SystemSettingsData | null = null;

  try {
    const rawSettings = await getPublicRtInfo();
    if (rawSettings) {
      settings = rawSettings as unknown as SystemSettingsData;
    }
  } catch (err) {
    console.error("Failed to load public portal settings in layout:", err);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased font-sans">
      <div>
        <PublicHeaderNavbar settings={settings || ({} as SystemSettingsData)} />
        <main>{children}</main>
      </div>
      <PublicContactFooter settings={settings || ({} as SystemSettingsData)} />
    </div>
  );
}
