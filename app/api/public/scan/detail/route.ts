import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { getDetailedScanDwelling } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/scan/detail:
 *   get:
 *     summary: Mendapatkan detail data hunian (Memerlukan Login)
 *     description: Mengambil data detail hunian untuk pengguna yang sedang login (sebagai tamu, bukan pemilik). Menampilkan data informasi tambahan seperti agregat jumlah Kepala Keluarga aktif atau jumlah ketersediaan kamar, tanpa menampilkan nama individu.
 *     tags:
 *       - Publik
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token QR unik atau nomor rumah
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail data hunian
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     blockNumber:
 *                       type: string
 *                     houseNumber:
 *                       type: string
 *                     type:
 *                       type: string
 *                     ownerName:
 *                       type: string
 *                     activeKkCount:
 *                       type: integer
 *                       description: Jumlah agregat Kepala Keluarga yang aktif di hunian ini
 *                     availableRooms:
 *                       type: integer
 *                       description: Jumlah kamar kos/homestay yang masih kosong
 *       400:
 *         description: Token tidak diberikan
 *       401:
 *         description: Pengguna belum login (Tidak ada sesi aktif)
 *       404:
 *         description: Hunian tidak ditemukan
 *       500:
 *         description: Kesalahan internal server
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("code") || "";

    if (!token.trim()) {
      return NextResponse.json(
        { error: "Token QR atau Nomor Rumah diperlukan" },
        { status: 400 }
      );
    }

    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) {
      return NextResponse.json(
        { error: "Anda harus login untuk melihat data detail hunian" },
        { status: 401 }
      );
    }

    const detailData = await getDetailedScanDwelling(token.trim());

    if (!detailData) {
      return NextResponse.json(
        { error: "Data hunian tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: detailData });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/scan/detail:", error);
    return NextResponse.json(
      { error: "Gagal memuat data detail hunian" },
      { status: 500 }
    );
  }
}
