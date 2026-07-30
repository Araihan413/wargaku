import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDetailedScanDwelling } from "@/db/queries/public-portal";

/**
 * GET /api/public/scan/detail?token=xxx
 *
 * Mengambil data detail hunian untuk user yang login namun bukan pemilik/koordinator.
 * Data ini lebih lengkap dari mode publik — menampilkan daftar penghuni aktif.
 *
 * Auth required: harus ada session aktif.
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

    // Verifikasi session — endpoint ini hanya untuk user yang login
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
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
