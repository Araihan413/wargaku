import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId } from "@/lib/rbac";
import { getAuditLogs, getAuditLogStats } from "@/db/queries/system/audit-log.queries";

/**
 * @openapi
 * /api/audit-logs:
 *   get:
 *     summary: Mendapatkan daftar dan statistik audit log
 *     description: Mengambil catatan riwayat aktivitas (audit logs) di sistem. Hanya bisa diakses oleh Super Admin (Role ID 1).
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter nama modul (contoh "Kependudukan", "Sistem", "all")
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pencarian berdasarkan aktor atau aksi
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [all, today, week, month]
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar log
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses ditolak (bukan Super Admin)
 *       500:
 *         description: Kesalahan server internal
 */
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const moduleName = searchParams.get("module") || "all";
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "all";

    const [auditLogsResult, stats] = await Promise.all([
      getAuditLogs({ page, limit, module: moduleName, search, dateRange }),
      getAuditLogStats(),
    ]);

    return NextResponse.json({
      logs: auditLogsResult.logs,
      pagination: auditLogsResult.pagination,
      stats,
    });
  } catch (error: any) {
    console.error("Error in GET /api/audit-logs:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
