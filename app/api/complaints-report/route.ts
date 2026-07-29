import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getComplaintsReportOverview,
  getComplaintsReportList,
  getAnnouncementsReportList,
  getActivitiesReportList,
} from "@/db/queries/complaints-report";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (session.user.roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "complaints"; // complaints | announcements | activities
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";
    const filter = searchParams.get("filter") || "all"; // for activities: all | upcoming | past

    // Always return overview stats
    const overview = await getComplaintsReportOverview();

    let listResult;

    if (type === "announcements") {
      listResult = await getAnnouncementsReportList({ page, limit, category, search });
    } else if (type === "activities") {
      listResult = await getActivitiesReportList({ page, limit, filter, search });
    } else {
      // default: complaints
      listResult = await getComplaintsReportList({ page, limit, status, category, search });
    }

    return NextResponse.json({
      overview,
      type,
      data: listResult.data,
      pagination: listResult.pagination,
    });
  } catch (error: any) {
    console.error("Error in GET /api/complaints-report:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
