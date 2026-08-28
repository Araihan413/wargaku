import React from "react";

export const WargaFamilySkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. KK Info Header Card */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-5">
        {/* Row 1: Identity & Badges */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-36 bg-gray-200 rounded-md" />
              <div className="h-5 w-28 bg-emerald-100/70 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-8 w-72 sm:w-80 bg-gray-300 rounded-lg" />
              <div className="h-4 w-52 bg-gray-200 rounded-md" />
              <div className="h-3.5 w-44 bg-gray-100 rounded-md" />
            </div>
          </div>

          <div className="h-9 w-44 bg-amber-100/60 rounded-xl self-start shrink-0" />
        </div>

        {/* Row 2: Scan KK Document Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3.5 border-t border-gray-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-100/60 shrink-0" />
            <div className="space-y-1">
              <div className="h-4 w-44 bg-gray-200 rounded-md" />
              <div className="h-3 w-40 bg-gray-100 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-xl" />
            <div className="h-8 w-24 bg-emerald-100/70 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 2. Status Alert Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-xs">
        <div className="h-5 w-5 rounded-full bg-emerald-200 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-5/6 bg-emerald-200/70 rounded-md" />
          <div className="h-3 w-2/3 bg-emerald-100 rounded-md" />
        </div>
      </div>
    </div>
  );
};
