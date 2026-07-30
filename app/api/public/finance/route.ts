import { NextResponse } from "next/server";
import { getPaginatedPublicFinanceTransactions } from "@/db/queries/public-portal";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const type = searchParams.get("type") || "semua";
    const month = searchParams.get("month") || "semua";
    const search = searchParams.get("search") || "";

    const result = await getPaginatedPublicFinanceTransactions({
      page,
      limit,
      type,
      month,
      search,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in GET /api/public/finance:", error);
    return NextResponse.json(
      { error: "Gagal memuat data portal publik RT" },
      { status: 500 }
    );
  }
}
