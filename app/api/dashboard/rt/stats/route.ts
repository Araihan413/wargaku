import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { getRtStats } from "@/db/queries/dashboard";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(session.user.roleId, "view-residents");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getRtStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard Stats API error:", error);
    return NextResponse.json({ error: error.message || "Failed to load stats" }, { status: 500 });
  }
}
