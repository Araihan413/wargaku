import { NextResponse } from "next/server";
import { getPublicPortalData } from "@/db/queries/dashboard/public-portal.queries";

export async function GET() {
  try {
    const data = await getPublicPortalData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/portal:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
