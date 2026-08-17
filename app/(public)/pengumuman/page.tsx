"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Pin,
  Calendar,
  User,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { PublicPageHeroBanner } from "@/app/_components/PublicPageHeroBanner";
import { PublicFilterSearchBar } from "@/app/_components/PublicFilterSearchBar";
import { PublicLoadMoreButton } from "@/app/_components/PublicLoadMoreButton";
import { PublicDetailModal } from "@/app/_components/PublicDetailModal";
import { PublicGridSkeleton } from "@/app/_components/PublicGridSkeleton";
import { PublicErrorState } from "@/app/_components/PublicErrorState";
import { PublicAnnouncementItem } from "@/db/queries/dashboard/public-portal.queries";
import { getCachedData, setCachedData } from "@/lib/public-cache";
import { PublicAttachmentList } from "@/components/PublicAttachmentList";
import { isEdited, formatUpdatedDate } from "@/lib/date-format";

const CATEGORIES = [
  { key: "semua", label: "Semua Pengumuman" },
  { key: "penting", label: "Penting & Mendesak" },
  { key: "umum", label: "Informasi Umum" },
];

export default function AnnouncementsPublicPage() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncementItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PublicAnnouncementItem | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

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

  // Fetch Announcements (Page 1 or Filter / Search Reset) with Client Caching
  useEffect(() => {
    let isCancelled = false;

    async function fetchAnnouncements() {
      const cacheKey = `announcements_${selectedCategory}_${debouncedSearch}_p1`;
      const cached = getCachedData<{
        data: PublicAnnouncementItem[];
        hasMore: boolean;
        totalItems: number;
      }>(cacheKey);

      if (cached && reloadTrigger === 0) {
        setAnnouncements(cached.data);
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
          category: selectedCategory,
          search: debouncedSearch,
        });

        const res = await fetch(`/api/public/announcements?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            const fetchedData = json.data || [];
            const fetchedHasMore = json.pagination?.hasMore || false;
            const fetchedTotal = json.pagination?.totalItems || 0;

            setAnnouncements(fetchedData);
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
          const err = await res.json().catch(() => ({}));
          if (!isCancelled) setErrorMessage(err?.error || "Gagal mengambil daftar pengumuman.");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching announcements:", err);
          setErrorMessage("Terjadi kesalahan koneksi jaringan. Silakan coba lagi.");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchAnnouncements();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, debouncedSearch, reloadTrigger]);

  // Handle Load More (Auto-Load on Scroll + Manual Click)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: "6",
        category: selectedCategory,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/public/announcements?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAnnouncements((prev) => {
          const updated = [...prev, ...(json.data || [])];
          return updated;
        });
        setHasMore(json.pagination?.hasMore || false);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Error loading more announcements:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, selectedCategory, debouncedSearch]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "mendesak":
        return "bg-rose-100 text-rose-700 border-rose-200 font-extrabold";
      case "penting":
        return "bg-amber-100 text-amber-800 border-amber-200 font-bold";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 font-medium";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Hero Header Section */}
      <PublicPageHeroBanner
        icon={Megaphone}
        title={`Pengumuman & Informasi`}
        subtitle="Arsip pengumuman resmi, imbauan, dan pemberitahuan penting dari Pengurus RT."
      />

      {/* Filter & Search Bar */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 -mt-7 relative z-20 space-y-6">
        <PublicFilterSearchBar
          filters={CATEGORIES}
          selectedFilter={selectedCategory}
          onSelectFilter={setSelectedCategory}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cari kata kunci pengumuman..."
        />

        {/* Results Summary & Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-500">
              Menampilkan <span className="font-bold text-slate-900">{announcements.length}</span> dari{" "}
              <span className="font-bold text-slate-900">{totalItems}</span> pengumuman
            </p>
          </div>

          {/* Loading / Error / Empty State */}
          {isLoading ? (
            <PublicGridSkeleton count={6} />
          ) : errorMessage ? (
            <PublicErrorState
              title="Gagal Memuat Pengumuman"
              message={errorMessage}
              onRetry={() => setReloadTrigger((prev) => prev + 1)}
              isLoading={isLoading}
            />
          ) : announcements.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 mb-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pengumuman Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada pengumuman yang sesuai dengan kata kunci atau kategori yang Anda pilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("semua");
                  setSearchTerm("");
                }}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filter & Pencarian
              </button>
            </div>
          ) : (
            /* Announcements Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Pin className="w-3 h-3 fill-amber-500" />
                            Disematkan
                          </span>
                        )}
                        {isEdited(item.createdAt, item.updatedAt) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                            Diperbarui: {formatUpdatedDate(item.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                      {item.content}
                    </p>
                  </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(String(item.createdAt))}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-30">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.creatorName || "Pengurus RT"}
                        </span>
                      </div>

                      {/* Public Attachments List & Single Diperbarui Badge */}
                        <PublicAttachmentList
                          attachmentsStr={item.attachments}
                          createdAt={item.createdAt ? String(item.createdAt) : undefined}
                          updatedAt={item.updatedAt ? String(item.updatedAt) : undefined}
                        />

                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(item)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all border border-slate-200/80 cursor-pointer"
                      >
                      <span>Baca Selengkapnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lazy Load Button with Auto-Load on Scroll */}
          <PublicLoadMoreButton
            hasMore={hasMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            autoLoadOnScroll={true}
            label="Muat Lebih Banyak Pengumuman ↓"
            loadingLabel="Memuat Pengumuman Lainnya..."
          />
        </div>
      </section>

      {/* Modal Detail Pop-Up */}
      <PublicDetailModal
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        title={selectedAnnouncement?.title || ""}
        badges={
          selectedAnnouncement ? (
            <>
              <span
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBadge(
                  selectedAnnouncement.category
                )}`}
              >
                {selectedAnnouncement.category}
              </span>
              {selectedAnnouncement.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Pin className="w-3 h-3 fill-amber-500" />
                  Disematkan
                </span>
              )}
              {isEdited(selectedAnnouncement.createdAt, selectedAnnouncement.updatedAt) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  Diperbarui: {formatUpdatedDate(selectedAnnouncement.updatedAt)}
                </span>
              )}
            </>
          ) : null
        }
        metadata={
          selectedAnnouncement ? (
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                {formatDate(String(selectedAnnouncement.createdAt))}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                {selectedAnnouncement.creatorName || "Pengurus RT"}
              </span>
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          <p className="whitespace-pre-wrap">{selectedAnnouncement?.content}</p>
          <PublicAttachmentList
            attachmentsStr={selectedAnnouncement?.attachments}
            createdAt={selectedAnnouncement?.createdAt ? String(selectedAnnouncement.createdAt) : undefined}
            updatedAt={selectedAnnouncement?.updatedAt ? String(selectedAnnouncement.updatedAt) : undefined}
          />
        </div>
      </PublicDetailModal>
    </>
  );
}
