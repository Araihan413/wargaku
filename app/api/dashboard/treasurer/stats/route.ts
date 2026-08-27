import { NextResponse } from "next/server";
import { validateApiAuth, hasPermission } from "@/lib/rbac";
import { getTreasurerDashboardStats } from "@/db/queries";

/**
 * @openapi
 * /api/dashboard/treasurer/stats:
 *   get:
 *     summary: Mendapatkan statistik dashboard Bendahara
 *     description: Mengambil data keuangan untuk dashboard Bendahara (misal saldo kas, total iuran bulan ini). Dapat diakses oleh Admin, Ketua RT, Bendahara, atau role dengan izin keuangan.
 *     tags:
 *       - Dashboard & Statistik
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan statistik bendahara
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses keuangan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, roleId: currentRoleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const isAllowed =
      currentRoleId === 1 ||
      currentRoleId === 2 ||
      currentRoleId === 4 ||
      (await hasPermission(currentRoleId, "view-finance")) ||
      (await hasPermission(currentRoleId, "manage-income")) ||
      (await hasPermission(currentRoleId, "manage-expense"));

    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const stats = await getTreasurerDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/treasurer/stats:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
