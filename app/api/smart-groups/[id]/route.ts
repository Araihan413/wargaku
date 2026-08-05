import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { deleteSmartGroup, updateSmartGroup, getSmartGroupById } from "@/db/queries/system/smart-group.queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    const group = await getSmartGroupById(smartGroupId);
    if (!group) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: group });
  } catch (error: any) {
    console.error("Error in GET /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const { name, criteria } = body;

    await updateSmartGroup(smartGroupId, { name, criteria });

    return NextResponse.json({ message: "Preset filter berhasil diperbarui" });
  } catch (error: any) {
    console.error("Error in PUT /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    await deleteSmartGroup(smartGroupId);

    return NextResponse.json({ message: "Preset filter berhasil dihapus" });
  } catch (error: any) {
    console.error("Error in DELETE /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
