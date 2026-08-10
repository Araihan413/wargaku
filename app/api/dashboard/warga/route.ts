import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWargaDashboard } from "@/db/queries/dashboard/internal-dashboard.queries";

/**
 * @openapi
 * /api/dashboard/warga:
 *   get:
 *     summary: Mendapatkan data dashboard Warga
 *     description: Mengambil data untuk dashboard personal warga (informasi keluarga/hunian, tagihan iuran terbaru, aktivitas dll) berdasarkan user yang sedang login.
 *     tags:
 *       - Dashboard & Statistik
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data dashboard warga
 *       401:
 *         description: Belum terautentikasi
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

    const data = await getWargaDashboard(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching warga dashboard:", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard warga" },
      { status: 500 }
    );
  }
}
