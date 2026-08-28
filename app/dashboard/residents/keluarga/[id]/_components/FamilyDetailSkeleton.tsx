import React from "react";

export const FamilyDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Family Detail Card */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-32 bg-gray-200 rounded-md" />
              <div className="h-5 w-24 bg-emerald-100/60 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-72 bg-gray-300 rounded-lg" />
              <div className="h-4 w-48 bg-gray-200 rounded-md" />
              <div className="h-3.5 w-60 bg-gray-100 rounded-md" />
            </div>
          </div>
          <div className="h-9 w-40 bg-gray-200 rounded-xl self-start shrink-0" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-2xl bg-gray-sidebar-hover/60 space-y-1.5">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
