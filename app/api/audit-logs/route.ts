import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAuditLogs, getAuditLogStats } from "@/db/queries/audit-logs";

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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const moduleName = searchParams.get("module") || "all";
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "all";

    const [auditLogsResult, stats] = await Promise.all([
      getAuditLogs({ page, limit, module: moduleName, search, dateRange }),
      getAuditLogStats(),
    ]);

    return NextResponse.json({
      logs: auditLogsResult.logs,
      pagination: auditLogsResult.pagination,
      stats,
    });
  } catch (error: any) {
    console.error("Error in GET /api/audit-logs:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
