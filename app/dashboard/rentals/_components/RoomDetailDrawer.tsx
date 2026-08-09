import React, { useState, useEffect } from "react";
import { X, User, Clock, Home } from "lucide-react";
import { RoomGridItem, ActiveTenantInfo } from "../types";
import { ActiveTenantsTab } from "./ActiveTenantsTab";
import { RoomHistoryTimelineTab } from "./RoomHistoryTimelineTab";

interface RoomDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomGridItem | null;
  propertyId: number;
  onOpenCheckIn: () => void;
  onOpenEdit: (resident: ActiveTenantInfo) => void;
  onOpenCheckOut: (resident: ActiveTenantInfo) => void;
  onOpenResubmit: (resident: ActiveTenantInfo) => void;
  onOpenDelete: (item: any) => void;
}

export const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = ({
  isOpen,
  onClose,
  room,
  propertyId,
  onOpenCheckIn,
  onOpenEdit,
  onOpenCheckOut,
  onOpenResubmit,
  onOpenDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"tenants" | "history">("tenants");
  const [isVisible, setIsVisible] = useState(false);
  const [cachedRoom, setCachedRoom] = useState<RoomGridItem | null>(room);

  // Sync cached state during render to avoid cascading renders in useEffect
  if (isOpen && room && cachedRoom !== room) {
    setCachedRoom(room);
  }

  // Sync isVisible state during render when drawer closes
  if (!isOpen && isVisible) {
    setIsVisible(false);
  }

  useEffect(() => {
    if (isOpen && room) {
      const raf = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      const timer = setTimeout(() => {
        setCachedRoom(null);
      }, 300); // match 300ms transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, room]);

  const activeRoom = room || cachedRoom;

  if (!isOpen && !isVisible && !cachedRoom) return null;
  if (!activeRoom) return null;

  return (
    <>
      {/* Overlay Backdrop - Smooth Fade In & Fade Out */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ease-in-out h-full ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-Over Drawer Container - Smooth Slide In & Slide Out to Right */}
      <aside
        className={`fixed inset-y-0 right-0 z-60 flex w-full max-w-md flex-col bg-gray-card border-l border-gray-border shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-heading-main">
                Kamar {activeRoom.roomNumber}
              </h2>
              <p className="text-xs text-gray-secondary-text mt-0.5 capitalize">
                Status: <strong className="text-gray-heading-main">{activeRoom.status}</strong> ({activeRoom.residentsCount} Penghuni)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-secondary-text hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher Header */}
        <div className="flex border-b border-gray-border bg-gray-sidebar-hover/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("tenants")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tenants"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Penghuni Aktif ({activeRoom.residentsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Riwayat Kamar</span>
          </button>
        </div>

        {/* Drawer Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "tenants" ? (
            <ActiveTenantsTab
              roomNumber={activeRoom.roomNumber}
              residents={activeRoom.residents}
              onOpenCheckIn={onOpenCheckIn}
              onOpenEdit={onOpenEdit}
              onOpenCheckOut={onOpenCheckOut}
              onOpenResubmit={onOpenResubmit}
              onOpenDelete={onOpenDelete}
            />
          ) : (
            <RoomHistoryTimelineTab
              propertyId={propertyId}
              roomNumber={activeRoom.roomNumber}
            />
          )}
        </div>
      </aside>
    </>
  );
};
