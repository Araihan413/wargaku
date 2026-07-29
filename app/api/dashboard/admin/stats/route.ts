import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSuperAdminStats } from "@/db/queries/dashboard";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const currentRoleId = session.user.roleId;
    if (currentRoleId !== 1) {
      return NextResponse.json({ error: "Akses khusus Super Admin" }, { status: 403 });
    }

    const stats = await getSuperAdminStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/admin/stats:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
