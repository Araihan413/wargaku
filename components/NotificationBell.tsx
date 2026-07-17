"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useRoleStore } from "@/lib/store/use-role-store";
import { toast } from "sonner";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  category: "personal" | "dinas";
  isRead: boolean;
  redirectLink: string | null;
  createdAt: string;
}

// Helper for relative time formatting
const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  return past.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { activeRoleId } = useRoleStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch on mount or when active role changes
  useEffect(() => {
    if (!activeRoleId) return;
    let active = true;

    const fetchNotifications = async () => {
      try {
        const category = activeRoleId === 6 ? "personal" : "dinas";
        const res = await fetch(`/api/notifications?category=${category}`);
        if (res.ok && active) {
          const data = await res.json();
          setNotificationsList(data);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every 1m

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeRoleId]);

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!activeRoleId) return;
    try {
      const category = activeRoleId === 6 ? "personal" : "dinas";
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("Semua notifikasi ditandai dibaca");
      }
    } catch (error) {
      console.error("Error marking all read:", error);
      toast.error("Gagal menandai notifikasi");
    }
  };

  // Mark specific notification as read and redirect
  const handleNotificationClick = async (notif: NotificationItem) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark single notification as read:", err);
      }
    }
    if (notif.redirectLink) {
      router.push(notif.redirectLink);
    }
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={() => setIsNotifOpen(!isNotifOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-border bg-gray-card text-gray-heading-main hover:bg-gray-sidebar-hover hover:scale-[1.02] cursor-pointer transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-gray-card animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notif Dropdown Panel */}
      {isNotifOpen && (
        <div className="absolute lg:right-0 -right-29 mt-2.5 z-50 w-80 rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-4 transition-all duration-200 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-gray-divider pb-2 mb-2">
            <span className="text-xs font-bold text-gray-heading-main">
              Notifikasi ({activeRoleId === 6 ? "Warga" : "Dinas"})
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {notificationsList.length > 0 ? (
              notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                    notif.isRead
                      ? "bg-gray-card border-gray-border hover:bg-gray-sidebar-hover"
                      : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-bold leading-tight ${notif.isRead ? "text-gray-heading-main" : "text-primary-900"}`}>
                      {notif.title}
                    </span>
                    <span className="text-[9px] text-gray-secondary-text shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-body-text-btn line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <span className="text-xs text-gray-placeholder">
                  Tidak ada notifikasi baru
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
