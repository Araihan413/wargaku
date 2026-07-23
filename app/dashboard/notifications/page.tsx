"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  Info,
  Trash2,
  Check,
  Eye,
  Loader2,
  Inbox,
  AlertCircle,
} from "lucide-react";
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

// Relative time formatter helper
const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  // Strip 'Z' to force parsing in local time, solving local database timezone offset bugs
  const cleanDateStr = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
  const past = new Date(cleanDateStr);
  const diffMs = Math.max(0, now.getTime() - past.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  return past.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function NotificationsPage() {
  const router = useRouter();
  const { activeRoleId } = useRoleStore();

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "personal" | "dinas">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 15;

  const isWarga = activeRoleId === 6;

  // Retrieve notifications
  const fetchNotifications = useCallback(
    async (currentOffset: number, append = false, categoryOverride?: string) => {
      if (!activeRoleId) return;
      if (currentOffset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const categoryFilter = categoryOverride || activeTab;
        
        // Build url
        let url = `/api/notifications?paginated=true&limit=${limit}&offset=${currentOffset}`;
        
        if (categoryFilter === "unread") {
          // Fetch all and filter locally or query all
          url += `&category=all`;
        } else {
          url += `&category=${categoryFilter}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const result = await res.json();
          let fetchedData: NotificationItem[] = result.data || [];
          
          if (categoryFilter === "unread") {
            fetchedData = fetchedData.filter((n) => !n.isRead);
          }

          if (append) {
            setNotifications((prev) => [...prev, ...fetchedData]);
          } else {
            setNotifications(fetchedData);
          }
          setHasMore(result.hasMore && fetchedData.length === limit);
        } else {
          toast.error("Gagal memuat notifikasi");
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, activeRoleId]
  );

  const handleTabChange = (tab: "all" | "unread" | "personal" | "dinas") => {
    setActiveTab(tab);
    setOffset(0);
  };

  // Reload when tab changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications(0, false);
  }, [activeTab, fetchNotifications]);

  // Load more trigger
  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    fetchNotifications(nextOffset, true);
  };

  // Mark specific notification as read
  const handleMarkAsRead = async (notif: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notif.isRead) {
      if (notif.redirectLink) router.push(notif.redirectLink);
      return;
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        if (notif.redirectLink) {
          router.push(notif.redirectLink);
        }
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  // Delete specific notification
  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success("Notifikasi berhasil dihapus");
      } else {
        toast.error("Gagal menghapus notifikasi");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const categoryParam = activeTab === "unread" ? "all" : activeTab;
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryParam }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("Semua notifikasi ditandai dibaca");
        if (activeTab === "unread") {
          setNotifications([]);
        }
      } else {
        toast.error("Gagal memperbarui notifikasi");
      }
    } catch (err) {
      console.error("Error marking all read:", err);
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  // Clear all notifications in current tab view
  const handleClearAll = async () => {
    const confirmClear = window.confirm(
      "Apakah Anda yakin ingin menghapus seluruh riwayat notifikasi pada kategori ini?"
    );
    if (!confirmClear) return;

    try {
      const categoryParam = activeTab === "unread" ? "all" : activeTab;
      const res = await fetch(`/api/notifications?category=${categoryParam}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications([]);
        toast.success("Riwayat notifikasi berhasil dibersihkan");
      } else {
        toast.error("Gagal menghapus notifikasi");
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
      toast.error("Terjadi kesalahan koneksi");
    }
  };

  // Render notification helper icon
  const getNotificationIcon = (title: string, category: string) => {
    const lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.includes("ditolak") || lowercaseTitle.includes("tolak")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertCircle className="h-5 w-5" />
        </div>
      );
    }
    if (
      lowercaseTitle.includes("terverifikasi") ||
      lowercaseTitle.includes("disetujui") ||
      lowercaseTitle.includes("berhasil")
    ) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5" />
        </div>
      );
    }
    if (category === "dinas") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
          <Bell className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
        <Info className="h-5 w-5" />
      </div>
    );
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header Workspace */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-card p-6 rounded-2xl border border-gray-border/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-heading-main flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Pusat Notifikasi
          </h1>
          <p className="text-xs text-gray-secondary-text mt-1">
            Kelola dan tinjau semua pemberitahuan sistem dan aktivitas kependudukan Anda.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                Tandai dibaca
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bersihkan
            </button>
          </div>
        )}
      </div>

      {/* 2. Tab Filter */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-gray-border/60">
        <button
          onClick={() => handleTabChange("all")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => handleTabChange("unread")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === "unread"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
          }`}
        >
          Belum Dibaca
        </button>
        {!isWarga && (
          <button
            onClick={() => handleTabChange("dinas")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "dinas"
                ? "border-primary text-primary"
                : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
            }`}
          >
            Dinas
          </button>
        )}
        <button
          onClick={() => handleTabChange("personal")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === "personal"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main"
          }`}
        >
          Personal
        </button>
      </div>

      {/* 3. Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-card rounded-2xl border border-gray-border/60 shadow-sm space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-gray-placeholder">Memuat notifikasi...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-card rounded-2xl border border-gray-border/60 shadow-sm text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-divider text-gray-placeholder mb-3">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-heading-main">Semua beres!</h3>
            <p className="text-xs text-gray-placeholder mt-1 max-w-xs">
              Tidak ada notifikasi dalam kategori ini untuk ditampilkan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif)}
                className={`group flex items-start gap-4 p-4 bg-gray-card hover:bg-gray-sidebar-hover/60 border rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.005] ${
                  notif.isRead
                    ? "border-gray-border/60"
                    : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                {/* Status Indicator Icon */}
                <div className="shrink-0">
                  {getNotificationIcon(notif.title, notif.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-xs font-bold leading-tight ${notif.isRead ? "text-gray-heading-main" : "text-primary-900"}`}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                    <span className="text-[10px] text-gray-placeholder">
                      • {formatRelativeTime(notif.createdAt)}
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 font-bold rounded-md tracking-wider ${
                      notif.category === "dinas"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/20"
                    }`}>
                      {notif.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-body-text-btn mt-1.5 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-65 group-hover:opacity-100 transition-opacity">
                  {notif.redirectLink && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif, e)}
                      title="Lihat detail"
                      className="p-1.5 text-gray-secondary-text hover:text-primary hover:bg-gray-divider rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    title="Hapus"
                    className="p-1.5 text-gray-secondary-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* 4. Lazy Load Button (Muat Lebih Banyak) */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-gray-heading-main bg-gray-card hover:bg-gray-sidebar-hover border border-gray-border/60 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    "Muat Lebih Banyak"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
