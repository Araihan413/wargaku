import { NextResponse } from "next/server";
import { getPublicPortalData } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/portal:
 *   get:
 *     summary: Mendapatkan data ringkasan portal publik
 *     description: Mengambil data konfigurasi sistem, statistik jumlah warga, hunian, pengumuman terbaru, dan kegiatan terbaru untuk ditampilkan di halaman beranda portal warga.
 *     tags:
 *       - Publik
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data ringkasan portal publik
 *       500:
 *         description: Kesalahan internal server
 */
export async function GET() {
  try {
    const data = await getPublicPortalData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/portal:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
