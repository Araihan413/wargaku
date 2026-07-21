import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { evaluateSmartGroupRules } from "@/db/queries/smart-groups";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, "view-residents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const body = await request.json();
    const { rules = [], globalOperator = "AND" } = body;

    const data = await evaluateSmartGroupRules(session.user.id, rules, globalOperator);

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error in POST /api/smart-groups/evaluate:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
