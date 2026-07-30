import React from "react";

interface PublicGridSkeletonProps {
  count?: number;
}

export const PublicGridSkeleton: React.FC<PublicGridSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs animate-pulse space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Badge & Pin placeholder */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
              <div className="h-4 w-16 bg-slate-100 rounded-full" />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-1.5 pt-1">
              <div className="h-5 w-5/6 bg-slate-200 rounded-lg" />
              <div className="h-5 w-2/3 bg-slate-200 rounded-lg" />
            </div>

            {/* Description Lines Skeleton */}
            <div className="space-y-2 pt-2">
              <div className="h-3.5 w-full bg-slate-100 rounded-md" />
              <div className="h-3.5 w-4/5 bg-slate-100 rounded-md" />
              <div className="h-3.5 w-2/3 bg-slate-100 rounded-md" />
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-20 bg-slate-100 rounded-md" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
