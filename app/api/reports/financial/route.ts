import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { getFinancialReportData } from "@/db/queries/reports";

/**
 * @openapi
 * /api/reports/financial:
 *   get:
 *     summary: Mendapatkan Laporan Keuangan
 *     description: Mengambil data laporan keuangan (summary, pemasukan, pengeluaran) berdasarkan filter bulan dan tahun. Membutuhkan izin view-finance.
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Tahun laporan
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Bulan laporan (angka 1-12 atau "all")
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data laporan keuangan
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth("view-finance");
    if (errorResponse || !session) return errorResponse;


    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const month = monthParam && monthParam !== "all" ? parseInt(monthParam, 10) : undefined;

    const reportData = await getFinancialReportData({ year, month });

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("Error in GET /api/reports/financial:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
