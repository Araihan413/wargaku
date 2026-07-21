import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { getSmartGroupsByRt, createSmartGroup } from "@/db/queries/smart-groups";

export async function GET(request: Request) {
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

    const data = await getSmartGroupsByRt(session.user.id);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error in GET /api/smart-groups:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, "manage-residents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const body = await request.json();
    const { name, queryRules } = body;

    if (!name || !queryRules) {
      return NextResponse.json({ error: "Nama kelompok dan kriteria aturan wajib diisi" }, { status: 400 });
    }

    const smartGroupId = await createSmartGroup(session.user.id, name, queryRules, session.user.id);

    return NextResponse.json({ id: smartGroupId, message: "Kelompok warga berhasil disimpan" });
  } catch (error: any) {
    console.error("Error in POST /api/smart-groups:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
