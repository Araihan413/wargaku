import { NextResponse } from "next/server";
import { getPublicPortalData } from "@/db/queries/public-portal";

export async function GET() {
  try {
    const data = await getPublicPortalData();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in GET /api/public/portal:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
