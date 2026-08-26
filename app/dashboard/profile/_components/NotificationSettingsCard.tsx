"use client";

import React, { useState, useEffect } from "react";
import { Bell, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

export const NotificationSettingsCard: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    async function fetchPreference() {
      try {
        const res = await fetch("/api/user/notification-preference");
        if (res.ok) {
          const data = await res.json();
          setPushEnabled(data.pushNotificationsEnabled ?? true);
        }
      } catch (err) {
        console.error("Gagal memuat preferensi notifikasi:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPreference();
  }, []);

  const handleToggle = async () => {
    const nextState = !pushEnabled;
    setIsUpdating(true);

    try {
      const res = await fetch("/api/user/notification-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushNotificationsEnabled: nextState }),
      });

      if (res.ok) {
        setPushEnabled(nextState);
        toast.success(
          nextState
            ? "Notifikasi push (OneSignal) telah diaktifkan"
            : "Notifikasi push (OneSignal) telah dinonaktifkan"
        );
      } else {
        toast.error("Gagal memperbarui preferensi notifikasi");
      }
    } catch (err) {
      console.error("Error updating notification preference:", err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="border-b border-gray-border pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-gray-heading-main tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Pengaturan Notifikasi Push
          </h2>
          <p className="text-xs text-gray-secondary-text mt-0.5">
            Atur apakah Anda ingin menerima pemberitahuan di layar perangkat HP / Browser Anda.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between p-4 bg-gray-card border border-gray-border rounded-xl">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-gray-heading-main block">
                Notifikasi Push
              </span>
              <p className="text-xs text-gray-secondary-text">
                Terima pemberitahuan penting secara real-time di layar HP atau browser komputer Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={isUpdating}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                pushEnabled ? "bg-primary" : "bg-gray-divider"
              } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  pushEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Catatan:</strong> Mematikan notifikasi push hanya menghentikan pesan berdering dari browser/HP. Notifikasi di dalam sistem (ikon lonceng di navbar) tetap berjalan normal.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
