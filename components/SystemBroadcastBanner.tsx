"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Wrench,
  AlertTriangle,
  Sparkles,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface BroadcastItem {
  id: number;
  title: string;
  message: string;
  type: "info" | "maintenance" | "feature" | "warning";
  createdAt: string;
}

export function SystemBroadcastBanner() {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActiveBroadcasts = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcasts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBroadcasts(data);
        }
      }
    } catch (err) {
      console.error("Gagal memuat broadcast sistem:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActiveBroadcasts();
  }, [fetchActiveBroadcasts]);

  // Derived safe index
  const safeCurrentIndex = currentIndex >= broadcasts.length ? 0 : currentIndex;

  // Auto-slide carousel setiap 6 detik jika > 1 item & tidak di-hover
  useEffect(() => {
    if (broadcasts.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % broadcasts.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [broadcasts.length, isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % broadcasts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + broadcasts.length) % broadcasts.length);
  };

  const handleDismiss = async (id: number) => {
    // Hapus lokal dulu agar UI responsif seketika
    const updated = broadcasts.filter((b) => b.id !== id);
    setBroadcasts(updated);

    try {
      await fetch(`/api/broadcasts/${id}/dismiss`, { method: "POST" });
    } catch (err) {
      console.error("Failed to dismiss broadcast:", err);
    }
  };

  if (isLoading || broadcasts.length === 0) {
    return null;
  }

  const currentItem = broadcasts[safeCurrentIndex] || broadcasts[0];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "maintenance":
        return {
          bg: "bg-amber-500/10 dark:bg-amber-950/40",
          border: "border-amber-500/30",
          textTitle: "text-amber-900 dark:text-amber-200",
          textBody: "text-amber-800/90 dark:text-amber-300/90",
          badge: "bg-amber-500 text-white",
          icon: <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
          label: "Maintenance",
        };
      case "warning":
        return {
          bg: "bg-rose-500/10 dark:bg-rose-950/40",
          border: "border-rose-500/30",
          textTitle: "text-rose-900 dark:text-rose-200",
          textBody: "text-rose-800/90 dark:text-rose-300/90",
          badge: "bg-rose-600 text-white",
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
          label: "Peringatan",
        };
      case "feature":
        return {
          bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
          border: "border-emerald-500/30",
          textTitle: "text-emerald-900 dark:text-emerald-200",
          textBody: "text-emerald-800/90 dark:text-emerald-300/90",
          badge: "bg-emerald-600 text-white",
          icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          label: "Fitur Baru",
        };
      default:
        return {
          bg: "bg-blue-500/10 dark:bg-blue-950/40",
          border: "border-blue-500/30",
          textTitle: "text-blue-900 dark:text-blue-200",
          textBody: "text-blue-800/90 dark:text-blue-300/90",
          badge: "bg-blue-600 text-white",
          icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
          label: "Informasi",
        };
    }
  };

  const style = getTypeStyles(currentItem.type);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} p-4 transition-all duration-300 shadow-xs`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Main Content Area */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5 shrink-0">{style.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md shrink-0 ${style.badge}`}>
                  {style.label}
                </span>
                <h4 className={`text-xs font-bold ${style.textTitle} truncate`}>
                  {currentItem.title}
                </h4>
              </div>

              {/* Close Button on Mobile (Top Right) */}
              <button
                type="button"
                onClick={() => handleDismiss(currentItem.id)}
                className="sm:hidden p-1 text-gray-placeholder hover:text-rose-600 rounded-lg transition-all cursor-pointer shrink-0 -mr-1 -mt-1"
                title="Tutup pengumuman ini"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${style.textBody} mt-1.5 leading-relaxed`}>
              {currentItem.message}
            </p>

            {/* Mobile Carousel Controls (Below Message) */}
            {broadcasts.length > 1 && (
              <div className="flex sm:hidden items-center justify-between gap-2 mt-3 pt-2.5 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] text-gray-secondary-text font-medium">
                  Siaran Sistem
                </span>
                <div className="flex items-center gap-1.5 bg-white/80 dark:bg-black/40 backdrop-blur-xs rounded-lg px-2 py-0.5 border border-gray-border/50 text-[11px] font-bold text-gray-heading-main">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-1 hover:text-primary transition-colors cursor-pointer"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 text-[10px]">
                    {safeCurrentIndex + 1} / {broadcasts.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-1 hover:text-primary transition-colors cursor-pointer"
                    title="Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Controls: Nav Carousel & Dismiss Button */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 self-center">
          {broadcasts.length > 1 && (
            <div className="flex items-center gap-1 bg-white/70 dark:bg-black/30 backdrop-blur-xs rounded-xl px-2 py-1 border border-gray-border/50 text-[11px] font-bold text-gray-heading-main mr-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[10px]">
                {safeCurrentIndex + 1}/{broadcasts.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                title="Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleDismiss(currentItem.id)}
            className="p-1.5 text-gray-placeholder hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
            title="Tutup pengumuman ini"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
