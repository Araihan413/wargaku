import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listFeeRules, createFeeRule, createFeeRuleSchema } from "@/db/queries/iuran";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 2 && roleId !== 4) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const data = await listFeeRules();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/iuran/rules]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 4) {
      return NextResponse.json({ error: "Hanya Bendahara yang dapat membuat aturan iuran" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createFeeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", issues: parsed.error.issues }, { status: 400 });
    }

    const { id, period } = await createFeeRule(parsed.data, session.user.id);
    return NextResponse.json(
      { message: `Aturan iuran berhasil dibuat dan tagihan bulan ${period} telah di-generate`, id },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/iuran/rules]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
