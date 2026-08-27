import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { getRtDashboardStats } from "@/db/queries";

/**
 * @openapi
 * /api/dashboard/rt/stats:
 *   get:
 *     summary: Mendapatkan statistik dashboard Ketua RT
 *     description: Mengambil data statistik untuk dashboard Ketua RT. Membutuhkan izin view-residents.
 *     tags:
 *       - Dashboard & Statistik
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan statistik RT
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateApiAuth("view-residents");
    if (errorResponse || !session) return errorResponse;

    const stats = await getRtDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard Stats API error:", error);
    return NextResponse.json({ error: error.message || "Failed to load stats" }, { status: 500 });
  }
}
