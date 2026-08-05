import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId } from "@/lib/rbac";
import { getAuditLogs } from "@/db/queries/system/audit-log.queries";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    if (effectiveRoleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get("module") || "all";
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "all";

    const result = await getAuditLogs({
      page: 1,
      limit: 1000,
      module: moduleName,
      search,
      dateRange,
    });

    const csvHeader = [
      "ID",
      "Timestamp Waktu",
      "Nama Pelaku",
      "Email Pelaku",
      "No HP Pelaku",
      "Role Pelaku",
      "Modul Sistem",
      "Tipe Aksi",
      "Deskripsi Detail",
      "IP Address",
    ].join(",");

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
        escapeCsv(log.actorRoleName || "-"),
        escapeCsv(log.module),
        escapeCsv(log.action),
        escapeCsv(log.description),
        escapeCsv(log.ipAddress || "-"),
      ].join(",");
    });

    const csvContent = [csvHeader, ...csvRows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit_logs_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/audit-logs/export:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
