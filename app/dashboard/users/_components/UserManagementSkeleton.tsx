import { TableSkeleton } from "@/components/TableSkeleton";

export function UserManagementSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat manajemen pengguna">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-60 sm:w-72 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-lg bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Bar Pencarian & Filter Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs">
        <div className="md:col-span-2 h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
      </div>

      {/* 3. Tabel Pengguna Skeleton */}
      <div className="border border-gray-border rounded-2xl bg-gray-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Nama & Email</th>
                <th className="py-4 px-5">Telepon</th>
                <th className="py-4 px-5 text-center">Peran</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={5} colCount={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
