import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { deleteSmartGroup } from "@/db/queries/smart-groups";

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

    const isAllowed = await hasPermission(session.user.roleId, "manage-residents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const { id } = await params;
    const smartGroupId = Number(id);

    if (isNaN(smartGroupId)) {
      return NextResponse.json({ error: "ID kelompok tidak valid" }, { status: 400 });
    }

    const success = await deleteSmartGroup(smartGroupId, session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Kelompok tidak ditemukan atau Anda tidak memiliki akses" }, { status: 404 });
    }

    return NextResponse.json({ message: "Kelompok warga berhasil dihapus" });
  } catch (error: any) {
    console.error("Error in DELETE /api/smart-groups/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
