import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, "verify-registrations");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pendingUsers = await listPendingRegistrations();

    return NextResponse.json({ data: pendingUsers });
  } catch (error: any) {
    console.error("Error in GET /api/approvals/registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
