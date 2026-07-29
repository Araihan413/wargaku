import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateTagihanForRule } from "@/db/queries/iuran";

// POST /api/iuran/rules/[id]/generate
// Generate tagihan bulan ini untuk semua KK aktif & terverifikasi
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });

    const roleId = session.user.roleId;
    if (roleId !== 1 && roleId !== 4) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const { id } = await params;
    const ruleId = parseInt(id, 10);

    const { period, generated, skipped } = await generateTagihanForRule(ruleId);

    return NextResponse.json({
      message: `Tagihan bulan ${period} selesai di-generate: ${generated} baru, ${skipped} sudah ada.`,
      period,
      generated,
      skipped,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Aturan iuran tidak ditemukan" }, { status: 404 });
    }
    console.error("[POST /api/iuran/rules/[id]/generate]", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
