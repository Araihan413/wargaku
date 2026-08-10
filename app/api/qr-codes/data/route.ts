import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getQrCodePageData } from "@/db/queries/population/dwelling.queries";

/**
 * @openapi
 * /api/qr-codes/data:
 *   get:
 *     summary: Mendapatkan data QR Code Rumah
 *     description: Mengambil data rumah dan token enkripsi untuk fitur pencetakan QR Code hunian/rumah.
 *     tags:
 *       - Modul Tambahan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data untuk QR Code
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
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const data = await getQrCodePageData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/qr-codes/data:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
