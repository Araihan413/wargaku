import { NextResponse } from "next/server";
import { getPaginatedPublicAnnouncements } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/announcements:
 *   get:
 *     summary: Mendapatkan daftar pengumuman publik
 *     description: Mengambil daftar pengumuman RT/RW yang dipublikasikan, mendukung paginasi dan pencarian.
 *     tags:
 *       - Publik
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman yang ingin diambil
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           default: "semua"
 *         description: Filter berdasarkan kategori pengumuman
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian pengumuman
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pengumuman
 *       500:
 *         description: Kesalahan internal server
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const category = searchParams.get("category") || "semua";
    const search = searchParams.get("search") || "";

    const result = await getPaginatedPublicAnnouncements({
      page,
      limit,
      category,
      search,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/announcements:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
