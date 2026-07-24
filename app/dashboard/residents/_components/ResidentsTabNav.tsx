import React from "react";
import { Users, UserCheck, Home, UserCog } from "lucide-react";

interface ResidentsTabNavProps {
  activeTab: "kk" | "penyewa" | "hunian" | "koordinator";
  onTabChange: (tab: "kk" | "penyewa" | "hunian" | "koordinator") => void;
}

export const ResidentsTabNav: React.FC<ResidentsTabNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: "kk" as const,
      label: "Kartu Keluarga",
      icon: Users,
    },
    {
      id: "penyewa" as const,
      label: "Penyewa (Pendatang)",
      icon: UserCheck,
    },
    {
      id: "koordinator" as const,
      label: "Koordinator Kos",
      icon: UserCog,
    },
    {
      id: "hunian" as const,
      label: "Hunian & Properti",
      icon: Home,
    },
    
  ];

  return (
    <div className="flex border-b border-gray-border overflow-x-auto no-scrollbar mb-6 gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
            }`}
          >
            <Icon className={`h-4.5 w-4.5 ${isActive ? "text-primary" : "text-gray-secondary-text"}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
