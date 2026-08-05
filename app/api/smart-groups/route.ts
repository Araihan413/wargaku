import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { listSmartGroups, createSmartGroup } from "@/db/queries/system/smart-group.queries";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, "view-residents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const data = await listSmartGroups();
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, "manage-residents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, criteria } = body;

    if (!name || !criteria) {
      return NextResponse.json({ error: "Nama kelompok dan kriteria aturan wajib diisi" }, { status: 400 });
    }

    const smartGroupId = await createSmartGroup({
      name,
      description,
      criteria,
      createdBy: session.user.id,
    });

    return NextResponse.json({ id: smartGroupId, message: "Kelompok warga berhasil disimpan" });
  } catch (error: any) {
    console.error("Error in POST /api/smart-groups:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
