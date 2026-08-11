import React from "react";
import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuditLogSummaryItem } from "./types";

interface RecentAuditLogsWidgetProps {
  logs: AuditLogSummaryItem[];
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const formatIp = (ip?: string | null) => {
  if (!ip) return "127.0.0.1";
  if (ip === "::1" || ip.includes("0000:0000:0000:0000") || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }
  return ip;
};

export const RecentAuditLogsWidget: React.FC<RecentAuditLogsWidgetProps> = ({ logs }) => {
  return (
    <div className="border border-gray-border bg-gray-card rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main tracking-tight">
              Audit Trail Keamanan Terkini
            </h3>
            <p className="text-xs text-gray-secondary-text">
              Riwayat log aktivitas sistem yang tidak dapat dimanipulasi
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/audit-logs"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold"
        >
          <span>Lihat Seluruh Log</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-secondary-text">
          Belum ada riwayat aktivitas keamanan tercatat.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Waktu</th>
                <th className="py-3 px-3.5">Pelaku</th>
                <th className="py-3 px-3.5">Modul</th>
                <th className="py-3 px-3.5">Aksi</th>
                <th className="py-3 px-3.5">Deskripsi Detail</th>
                <th className="py-3 px-3.5 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                  <td className="py-3 px-3.5 font-semibold text-gray-heading-main whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-gray-heading-main whitespace-nowrap">
                    {log.actorName || "Sistem"}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 font-bold text-gray-heading-main text-[10px]">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-primary whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-3.5 text-gray-heading-main max-w-xs truncate">
                    {log.description || "-"}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-gray-secondary-text whitespace-nowrap">
                    {formatIp(log.ipAddress)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
