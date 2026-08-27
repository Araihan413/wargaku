import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { getSuperAdminDashboardStats } from "@/db/queries";

/**
 * @openapi
 * /api/dashboard/admin/stats:
 *   get:
 *     summary: Mendapatkan statistik dashboard Super Admin
 *     description: Mengambil data ringkasan untuk dashboard Super Admin (total users, total RT, dll). Khusus untuk role Super Admin (ID 1).
 *     tags:
 *       - Dashboard & Statistik
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan statistik admin
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses khusus Super Admin
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, roleId: currentRoleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    if (currentRoleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const stats = await getSuperAdminDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/admin/stats:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
