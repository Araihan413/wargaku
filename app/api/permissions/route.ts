import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRolePermissionMatrix, updateRolePermissions } from "@/db/queries/permissions";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (session.user.roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const matrixData = await getRolePermissionMatrix();
    return NextResponse.json(matrixData);
  } catch (error: any) {
    console.error("Error in GET /api/permissions:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    if (session.user.roleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const body = await req.json();
    const { roleId, permissionIds } = body;

    if (typeof roleId !== "number" || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Format request tidak valid (roleId & permissionIds wajib diisi)" },
        { status: 400 }
      );
    }

    const result = await updateRolePermissions(roleId, permissionIds, session.user.id);
    return NextResponse.json({ message: "Hak akses role berhasil diperbarui", result });
  } catch (error: any) {
    console.error("Error in PUT /api/permissions:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui hak akses role" },
      { status: 500 }
    );
  }
}
