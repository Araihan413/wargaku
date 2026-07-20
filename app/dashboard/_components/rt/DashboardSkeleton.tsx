import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-12" aria-busy="true" aria-label="Loading dashboard statistics">
      <div>
        <div className="h-8 bg-gray-divider rounded w-1/3" />
        <div className="h-4 bg-gray-divider rounded w-1/2 mt-2" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-divider rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 bg-gray-divider rounded-2xl" />
        <div className="h-72 bg-gray-divider rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-64 bg-gray-divider rounded-2xl" />
        <div className="h-64 bg-gray-divider rounded-2xl" />
        <div className="h-64 bg-gray-divider rounded-2xl" />
      </div>

      <div className="h-80 bg-gray-divider rounded-2xl" />
    </div>
  );
}
