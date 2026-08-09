import { DashboardStats } from "../../types";

interface ComplaintSectionProps {
  complaintSummary: DashboardStats["complaintSummary"];
  topComplaintCategories: DashboardStats["topComplaintCategories"];
}

export function ComplaintSection({
  complaintSummary,
  topComplaintCategories,
}: ComplaintSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-heading-main">Pengaduan Warga (Laporan)</h3>
          <p className="text-xs text-gray-secondary-text">Status pengaduan warga dan topik laporan paling sering diajukan</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <span className="text-xs text-gray-secondary-text font-medium">Total Pengaduan:</span>
          <span className="inline-flex items-center rounded-lg bg-primary-100 px-3 py-1 text-sm font-extrabold text-primary">
            {complaintSummary.reduce((sum, item) => sum + item.count, 0)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status aduan */}
        <div className="flex flex-col justify-around md:border-r border-gray-divider md:pr-8">
          <h4 className="text-xs uppercase font-bold tracking-wider text-gray-secondary-text mb-4">Status Pengaduan</h4>
          <div className="grid grid-cols-4 gap-4 text-center">
            {complaintSummary.map((item) => {
              let badgeColor = "bg-gray-100 text-gray-600";
              if (item.status === "Menunggu") badgeColor = "bg-orange-100 text-orange-600 border border-orange-200";
              if (item.status === "Proses") badgeColor = "bg-blue-100 text-blue-600 border border-blue-200";
              if (item.status === "Selesai") badgeColor = "bg-green-100 text-green-600 border border-green-200";
              if (item.status === "Ditolak") badgeColor = "bg-red-100 text-red-600 border border-red-200";

              return (
                <div key={item.status} className="p-3 rounded-xl border border-gray-border bg-gray-page-bg flex flex-col items-center justify-between">
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                    {item.status}
                  </span>
                  <h4 className="text-2xl font-black text-gray-heading-main mt-2">{item.count}</h4>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topik aduan terbanyak */}
        <div>
          <h4 className="text-xs uppercase font-bold tracking-wider text-gray-secondary-text mb-4">Kategori Pengaduan</h4>
          <div className="space-y-3.5">
            {topComplaintCategories.map((item) => {
              const total = topComplaintCategories.reduce((sum, c) => sum + c.count, 0) || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.category}>
                  <div className="flex justify-between text-xs font-medium text-gray-heading-small mb-1">
                    <span>{item.category}</span>
                    <span className="font-bold text-gray-heading-main">{item.count} Laporan ({percent}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-divider overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topComplaintCategories.length === 0 && (
              <p className="text-sm text-gray-secondary-text italic text-center py-6">Belum ada data pengaduan masuk</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
