import React from "react";
import { MessageSquareWarning, Megaphone, CalendarDays } from "lucide-react";
import { ReportTabType } from "../types";

interface ComplaintsReportTabsProps {
  activeTab: ReportTabType;
  onTabChange: (tab: ReportTabType) => void;
}

const tabs: { key: ReportTabType; label: string; icon: React.ReactNode }[] = [
  {
    key: "complaints",
    label: "Laporan Pengaduan Warga",
    icon: <MessageSquareWarning className="w-4 h-4" />,
  },
  {
    key: "announcements",
    label: "Pengumuman RT",
    icon: <Megaphone className="w-4 h-4" />,
  },
  {
    key: "activities",
    label: "Agenda Kegiatan RT",
    icon: <CalendarDays className="w-4 h-4" />,
  },
];

export const ComplaintsReportTabs: React.FC<ComplaintsReportTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="bg-gray-card border border-gray-border rounded-2xl p-1.5 shadow-xs flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-1 justify-center ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-secondary-text hover:bg-gray-sidebar-hover/40 hover:text-gray-heading-main"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
