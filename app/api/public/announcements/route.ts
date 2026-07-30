import { NextResponse } from "next/server";
import { getPaginatedPublicAnnouncements } from "@/db/queries/public-portal";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const category = searchParams.get("category") || "semua";
    const search = searchParams.get("search") || "";

    const result = await getPaginatedPublicAnnouncements({
      page,
      limit,
      category,
      search,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in GET /api/public/announcements:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
