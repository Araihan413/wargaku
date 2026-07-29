import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listUnpaidByFamily } from "@/db/queries/iuran";

// GET /api/iuran/tunggakan?ruleId=
// Aggregate KK with outstanding dues (unpaid or partially_paid)
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

    const result = await listUnpaidByFamily(ruleId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/iuran/tunggakan]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
