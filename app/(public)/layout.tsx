"use client";

import React, { useState, useEffect } from "react";
import { PublicHeaderNavbar } from "@/app/_components/PublicHeaderNavbar";
import { PublicContactFooter } from "@/app/_components/PublicContactFooter";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/public/portal");
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.settings) {
            setSettings(json.settings);
          }
        }
      } catch (err) {
        console.error("Failed to load public portal settings in layout:", err);
      }
    }

    loadSettings();

    return () => {
      isCancelled = true;
    };
  }, []);

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
