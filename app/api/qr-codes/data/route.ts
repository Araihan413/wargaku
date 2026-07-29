import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getQrCodePageData } from "@/db/queries/qr-codes";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const data = await getQrCodePageData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/qr-codes/data:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
