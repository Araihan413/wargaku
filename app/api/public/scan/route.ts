import { NextResponse } from "next/server";
import { getPublicScanDwelling } from "@/db/queries/dashboard/public-portal.queries";

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
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
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
