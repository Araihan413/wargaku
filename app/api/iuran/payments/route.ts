import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listPayments } from "@/db/queries/iuran";

// GET /api/iuran/payments?ruleId=&period=&query=
// List payments matrix for a given fee rule and period
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 2 && roleId !== 4) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId") ? parseInt(searchParams.get("ruleId")!, 10) : null;
    const period = searchParams.get("period") || null;
    const searchQuery = searchParams.get("query") || "";

    if (!ruleId) {
      return NextResponse.json({ error: "Parameter ruleId diperlukan" }, { status: 400 });
    }

    const result = await listPayments(ruleId, period, searchQuery);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/iuran/payments]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
