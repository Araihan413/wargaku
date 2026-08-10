import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkDwellingOwnership } from "@/db/queries/dashboard/public-portal.queries";

/**
 * @openapi
 * /api/public/scan/ownership:
 *   get:
 *     summary: Mengecek hak kepemilikan atau akses hunian
 *     description: Mengecek apakah pengguna yang sedang login adalah pemilik, kepala keluarga, atau koordinator dari hunian yang di-scan. Mengembalikan status kepemilikan dan target redirect yang sesuai. Parameter `roleId` digunakan untuk membedakan apakah pengguna sedang dalam mode officer (bertugas) atau warga biasa.
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
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID Role aktif dari pengguna saat ini (dari frontend store)
 *     responses:
 *       200:
 *         description: Berhasil mengecek status kepemilikan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ownershipStatus:
 *                   type: string
 *                   enum: [pemilik-permanen, pemilik-kos, kepala-keluarga-permanen, kepala-keluarga-kos, koordinator-kos, officer, tamu-login, non-owner]
 *                 redirectTarget:
 *                   type: string
 *                   nullable: true
 *                 propertyId:
 *                   type: integer
 *                   nullable: true
 *                 dwellingId:
 *                   type: integer
 *                   nullable: true
 *       400:
 *         description: Token tidak diberikan
 *       500:
 *         description: Kesalahan internal server
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("code") || "";
    const roleIdParam = searchParams.get("roleId");
    const activeRoleId = roleIdParam ? parseInt(roleIdParam, 10) : null;

    if (!token.trim()) {
      return NextResponse.json(
        { error: "Token QR atau Nomor Rumah diperlukan" },
        { status: 400 }
      );
    }

    // Ambil session user jika ada
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      // Tidak ada session → kembalikan non-owner (aman, tidak throw error)
      return NextResponse.json({
        ownershipStatus: "non-owner",
        redirectTarget: null,
        propertyId: null,
        dwellingId: null,
      });
    }

    const result = await checkDwellingOwnership(
      token.trim(),
      session.user.id,
      isNaN(activeRoleId as number) ? null : activeRoleId
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in GET /api/public/scan/ownership:", error);
    return NextResponse.json(
      { error: "Gagal memeriksa kepemilikan hunian" },
      { status: 500 }
    );
  }
}

