import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PublicLoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  label?: string;
  loadingLabel?: string;
  autoLoadOnScroll?: boolean;
}

export const PublicLoadMoreButton: React.FC<PublicLoadMoreButtonProps> = ({
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  label = "Muat Lebih Banyak ↓",
  loadingLabel = "Memuat Data Lainnya...",
  autoLoadOnScroll = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoLoadOnScroll || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "250px" } // Triggers 250px before user reaches the exact bottom
    );

    const currentEl = containerRef.current;
    if (currentEl) observer.observe(currentEl);

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, [autoLoadOnScroll, hasMore, isLoading, isLoadingMore, onLoadMore]);

  if (!hasMore || isLoading) return null;

  return (
    <div ref={containerRef} className="text-center pt-4 pb-8">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
      >
        {isLoadingMore ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>
    </div>
  );
};
