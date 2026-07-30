import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkDwellingOwnership } from "@/db/queries/public-portal";

/**
 * GET /api/public/scan/ownership?token=xxx
 *
 * Mengecek apakah user yang sedang login adalah pemilik atau koordinator
 * dari dwelling yang di-scan. Mengembalikan status kepemilikan dan
 * target redirect yang sesuai.
 *
 * Tidak perlu session guard yang ketat — jika tidak ada session,
 * akan mengembalikan status "non-owner" (halaman client sudah handle ini).
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

    const result = await checkDwellingOwnership(token.trim(), session.user.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in GET /api/public/scan/ownership:", error);
    return NextResponse.json(
      { error: "Gagal memeriksa kepemilikan hunian" },
      { status: 500 }
    );
  }
}
