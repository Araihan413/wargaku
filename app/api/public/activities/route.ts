import { NextResponse } from "next/server";
import { getPaginatedPublicActivities } from "@/db/queries/dashboard/public-portal.queries";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const filter = searchParams.get("filter") || "semua";
    const search = searchParams.get("search") || "";

    const result = await getPaginatedPublicActivities({
      page,
      limit,
      filter,
      search,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/public/activities:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
