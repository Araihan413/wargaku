import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { listPendingRegistrations } from "@/db/queries/system/approval.queries";

/**
 * @openapi
 * /api/approvals/registration:
 *   get:
 *     summary: Mendapatkan daftar registrasi pengguna yang menunggu persetujuan
 *     description: Mengambil daftar akun pengguna (yang mendaftar melalui aplikasi) yang masih berstatus pending dan menunggu verifikasi RT. Hanya dapat diakses oleh pengguna dengan izin verify-registrations.
 *     tags:
 *       - Verifikasi & Persetujuan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar registrasi pending
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses (Forbidden)
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateApiAuth("verify-registrations");
    if (errorResponse || !session) return errorResponse;

    const pendingUsers = await listPendingRegistrations();

    return NextResponse.json({ data: pendingUsers });
  } catch (error: any) {
    console.error("Error in GET /api/approvals/registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
