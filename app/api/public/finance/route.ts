import { NextResponse } from "next/server";
import { getPaginatedPublicFinanceTransactions } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/finance:
 *   get:
 *     summary: Mendapatkan data transparansi keuangan publik
 *     description: Mengambil data ringkasan transaksi keuangan kas RT/RW yang bersifat publik, mendukung paginasi dan filter bulan.
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
 *           default: 8
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: "semua"
 *         description: Tipe transaksi (misal, pemasukan, pengeluaran)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           default: "semua"
 *         description: Filter bulan transaksi (format yyyy-mm)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian uraian transaksi
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data keuangan publik
 *       500:
 *         description: Kesalahan internal server
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const type = searchParams.get("type") || "semua";
    const month = searchParams.get("month") || "semua";
    const search = searchParams.get("search") || "";

    const result = await getPaginatedPublicFinanceTransactions({
      page,
      limit,
      type,
      month,
      search,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/finance:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
