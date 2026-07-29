import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAuditLogs } from "@/db/queries/audit-logs";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (session.user.roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get("module") || "all";
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "all";

    // Ambil log aktivitas hingga 1000 item untuk ekspor CSV
    const result = await getAuditLogs({
      page: 1,
      limit: 1000,
      module: moduleName,
      search,
      dateRange,
    });

    // Generate CSV Header
    const csvHeader = [
      "ID",
      "Timestamp Waktu",
      "Nama Pelaku",
      "Email Pelaku",
      "NIK Pelaku",
      "Role Pelaku",
      "Modul Sistem",
      "Tipe Aksi",
      "Deskripsi Detail",
      "IP Address",
    ].join(",");

    // Escape CSV Cell Value
    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      const cleanStr = String(val).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const csvRows = result.logs.map((log) => {
      const formattedDate = new Date(log.createdAt).toLocaleString("id-ID");
      return [
        log.id,
        escapeCsv(formattedDate),
        escapeCsv(log.actorName || "Sistem"),
        escapeCsv(log.actorEmail || "-"),
        escapeCsv(log.actorNik || "-"),
        escapeCsv(log.actorRoleName || "Pengguna"),
        escapeCsv(log.module),
        escapeCsv(log.action),
        escapeCsv(log.description || "-"),
        escapeCsv(log.ipAddress || "127.0.0.1"),
      ].join(",");
    });

    const csvContent = [csvHeader, ...csvRows].join("\n");
    const timestampStr = new Date().toISOString().slice(0, 10);
    const filename = `audit-logs-wargaku-${timestampStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/audit-logs/export:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunduh file ekspor CSV" },
      { status: 500 }
    );
  }
}
