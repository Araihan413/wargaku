import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { getAuditLogs } from "@/db/queries/system/audit-log.queries";

/**
 * @openapi
 * /api/audit-logs/export:
 *   get:
 *     summary: Mengekspor audit log ke format CSV
 *     description: Mengunduh data audit log dalam format CSV. Hanya bisa diakses oleh Super Admin.
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [all, today, week, month]
 *     responses:
 *       200:
 *         description: Berhasil mengunduh file CSV
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses ditolak (bukan Super Admin)
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(req: Request) {
  try {
    const { session, roleId: effectiveRoleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

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
