"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Pin,
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { PublicPageHeroBanner } from "@/app/_components/PublicPageHeroBanner";
import { PublicFilterSearchBar } from "@/app/_components/PublicFilterSearchBar";
import { PublicLoadMoreButton } from "@/app/_components/PublicLoadMoreButton";
import { PublicDetailModal } from "@/app/_components/PublicDetailModal";
import { PublicGridSkeleton } from "@/app/_components/PublicGridSkeleton";
import { PublicErrorState } from "@/app/_components/PublicErrorState";
import { PublicActivityItem } from "@/db/queries/public-portal";
import { getCachedData, setCachedData } from "@/lib/public-cache";

const FILTERS = [
  { key: "semua", label: "Semua Agenda" },
  { key: "mendatang", label: "Mendatang (Upcoming)" },
  { key: "selesai", label: "Kegiatan Selesai" },
];

export default function ActivitiesPublicPage() {
  const [activities, setActivities] = useState<PublicActivityItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<PublicActivityItem | null>(null);

  const [nowTimestamp] = useState<number>(() => (typeof window !== "undefined" ? Date.now() : 0));

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load system settings with cache
  useEffect(() => {
    (async () => {
      const cacheKey = "public_portal_settings";
      try {
        const res = await fetch("/api/public/portal");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) {
            setCachedData(cacheKey, json.settings);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    })();
  }, []);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Activities (Page 1 or Filter / Search Reset) with Client Caching
  useEffect(() => {
    let isCancelled = false;

    async function fetchActivities() {
      const cacheKey = `activities_${selectedFilter}_${debouncedSearch}_p1`;
      const cached = getCachedData<{
        data: PublicActivityItem[];
        hasMore: boolean;
        totalItems: number;
      }>(cacheKey);

      if (cached && reloadTrigger === 0) {
        setActivities(cached.data);
        setHasMore(cached.hasMore);
        setTotalItems(cached.totalItems);
        setPage(1);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "6",
          filter: selectedFilter,
          search: debouncedSearch,
        });

        const res = await fetch(`/api/public/activities?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            const fetchedData = json.data || [];
            const fetchedHasMore = json.pagination?.hasMore || false;
            const fetchedTotal = json.pagination?.totalItems || 0;

            setActivities(fetchedData);
            setHasMore(fetchedHasMore);
            setTotalItems(fetchedTotal);
            setPage(1);
            setErrorMessage(null);

            // Save to Cache
            setCachedData(cacheKey, {
              data: fetchedData,
              hasMore: fetchedHasMore,
              totalItems: fetchedTotal,
            });
          }
        } else {
          const err = await res.json();
          if (!isCancelled) setErrorMessage(err.error || "Gagal mengambil agenda kegiatan.");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching activities:", err);
          setErrorMessage("Terjadi kesalahan koneksi jaringan. Silakan coba lagi.");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchActivities();

    return () => {
      isCancelled = true;
    };
  }, [selectedFilter, debouncedSearch, reloadTrigger]);

  // Handle Load More (Auto-Load on Scroll + Manual Click)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: "6",
        filter: selectedFilter,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/public/activities?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setActivities((prev) => {
          const updated = [...prev, ...(json.data || [])];
          return updated;
        });
        setHasMore(json.pagination?.hasMore || false);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Error loading more activities:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, selectedFilter, debouncedSearch]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Tanggal Belum Ditentukan";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return "";
    }
  };

  const isUpcoming = (dateStr: string | null) => {
    if (!dateStr) return true;
    if (!nowTimestamp) return true;
    return new Date(dateStr).getTime() >= nowTimestamp;
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = (item: PublicActivityItem) => {
    if (!item.eventDate) return "#";
    try {
      const startDate = new Date(item.eventDate);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // default +2 jam
      const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      
      const title = encodeURIComponent(item.title);
      const details = encodeURIComponent(item.description || "Agenda Kegiatan Warga");
      const location = encodeURIComponent(item.location || "Wilayah RT");
      const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
    } catch {
      return "#";
    }
  };

  return (
    <>
      {/* Hero Header Section */}
      <PublicPageHeroBanner
        icon={Calendar}
        title={`Agenda & Kegiatan`}
        subtitle="Jadwal kerja bakti, posyandu, siskamling, dan berbagai kegiatan kemasyarakatan."
      />

      {/* Filter & Search Bar */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 -mt-7 relative z-20 space-y-6">
        <PublicFilterSearchBar
          filters={FILTERS}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cari nama agenda atau lokasi..."
        />

        {/* Results Summary & Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-500">
              Menampilkan <span className="font-bold text-slate-900">{activities.length}</span> dari{" "}
              <span className="font-bold text-slate-900">{totalItems}</span> agenda kegiatan
            </p>
          </div>

          {/* Loading / Error / Empty State */}
          {isLoading ? (
            <PublicGridSkeleton count={6} />
          ) : errorMessage ? (
            <PublicErrorState
              title="Gagal Memuat Agenda Kegiatan"
              message={errorMessage}
              onRetry={() => setReloadTrigger((prev) => prev + 1)}
              isLoading={isLoading}
            />
          ) : activities.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 mb-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Agenda Kegiatan Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada jadwal kegiatan yang sesuai dengan pencarian atau filter yang Anda pilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter("semua");
                  setSearchTerm("");
                }}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filter & Pencarian
              </button>
            </div>
          ) : (
            /* Activities Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {activities.map((item) => {
                const upcoming = isUpcoming(item.eventDate);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${
                            upcoming
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {upcoming ? "Akan Datang" : "Selesai"}
                        </span>
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Pin className="w-3 h-3 fill-amber-500" />
                            Disematkan
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{formatDate(item.eventDate)}</span>
                        </div>

                        {item.eventDate && (
                          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Pukul {formatTime(item.eventDate)}</span>
                          </div>
                        )}

                        {item.location && (
                          <div className="flex items-center gap-2 text-slate-500 text-[11px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedActivity(item)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all border border-slate-200/80 cursor-pointer"
                      >
                        <span>Detail & Simpan Kalender</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lazy Load Button with Auto-Load on Scroll */}
          <PublicLoadMoreButton
            hasMore={hasMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            autoLoadOnScroll={true}
            label="Muat Lebih Banyak Agenda ↓"
            loadingLabel="Memuat Agenda Lainnya..."
          />
        </div>
      </section>

      {/* Modal Detail Pop-Up */}
      <PublicDetailModal
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity?.title || ""}
        badges={
          selectedActivity ? (
            <>
              <span
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold ${
                  isUpcoming(selectedActivity.eventDate)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isUpcoming(selectedActivity.eventDate) ? "Akan Datang" : "Selesai"}
              </span>
              {selectedActivity.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Pin className="w-3 h-3 fill-amber-500" />
                  Disematkan
                </span>
              )}
            </>
          ) : null
        }
        metadata={
          selectedActivity ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Hari/Tanggal: {formatDate(selectedActivity.eventDate)}</span>
              </div>

              {selectedActivity.eventDate && (
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Waktu: Pukul {formatTime(selectedActivity.eventDate)}</span>
                </div>
              )}

              {selectedActivity.location && (
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Lokasi: {selectedActivity.location}</span>
                </div>
              )}
            </div>
          ) : null
        }
        footerActions={
          selectedActivity && isUpcoming(selectedActivity.eventDate) ? (
            <a
              href={getGoogleCalendarUrl(selectedActivity)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Simpan Pengingat ke Google Calendar</span>
            </a>
          ) : (
            <div />
          )
        }
      >
        {selectedActivity?.description || "Tidak ada rincian deskripsi tambahan untuk kegiatan ini."}
      </PublicDetailModal>
    </>
  );
}
