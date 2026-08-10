import { NextResponse } from "next/server";
import { getPublicScanDwelling } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/scan:
 *   get:
 *     summary: Mendapatkan informasi publik hunian
 *     description: Mengambil data profil publik suatu hunian berdasarkan token QR Code atau blok/nomor rumah. Data yang dikembalikan tidak memuat informasi pribadi (privasi dijaga).
 *     tags:
 *       - Publik
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token QR unik dari stiker rumah atau format manual (cth. A1-12)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data hunian publik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *                       nullable: true
 *                     propertyName:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Token tidak diberikan
 *       404:
 *         description: Hunian tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("code") || "";

    if (!token.trim()) {
      return NextResponse.json(
        { error: "Mohon masukkan Token QR atau Nomor Rumah" },
        { status: 400 }
      );
    }

    const dwelling = await getPublicScanDwelling(token);

    if (!dwelling) {
      return NextResponse.json(
        { error: "Data hunian atau QR Code tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: dwelling },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error in GET /api/public/scan:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
