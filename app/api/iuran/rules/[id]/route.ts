import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateFeeRule, deleteFeeRule, updateFeeRuleSchema } from "@/db/queries/iuran";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 4) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const { id } = await params;
    const ruleId = parseInt(id, 10);

    const body = await request.json();
    const parsed = updateFeeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", issues: parsed.error.issues }, { status: 400 });
    }

    await updateFeeRule(ruleId, parsed.data);
    return NextResponse.json({ message: "Aturan iuran berhasil diperbarui" });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Aturan iuran tidak ditemukan" }, { status: 404 });
    }
    console.error("[PUT /api/iuran/rules/[id]]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 4) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const { id } = await params;
    const ruleId = parseInt(id, 10);

    await deleteFeeRule(ruleId);
    return NextResponse.json({ message: "Aturan iuran berhasil dihapus" });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Aturan iuran tidak ditemukan" }, { status: 404 });
    }
    console.error("[DELETE /api/iuran/rules/[id]]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
