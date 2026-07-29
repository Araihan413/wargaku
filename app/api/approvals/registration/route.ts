import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { listPendingRegistrations } from "@/db/queries/approvals";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, "verify-registrations");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pendingUsers = await listPendingRegistrations();

    return NextResponse.json({ data: pendingUsers });
  } catch (error: any) {
    console.error("Error in GET /api/approvals/registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
