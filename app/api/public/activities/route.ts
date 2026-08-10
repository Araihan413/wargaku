import { NextResponse } from "next/server";
import { getPaginatedPublicActivities } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/activities:
 *   get:
 *     summary: Mendapatkan daftar kegiatan publik
 *     description: Mengambil daftar kegiatan RT/RW yang dipublikasikan, mendukung paginasi dan pencarian.
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
 *         name: filter
 *         schema:
 *           type: string
 *           default: "semua"
 *         description: Filter kategori kegiatan
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian kegiatan
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar kegiatan
 *       500:
 *         description: Kesalahan internal server
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const filter = searchParams.get("filter") || "semua";
    const search = searchParams.get("search") || "";

    const result = await getPaginatedPublicActivities({
      page,
      limit,
      filter,
      search,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/activities:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
