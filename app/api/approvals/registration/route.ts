import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, "verify-registrations");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil seluruh user dengan status 'pending' dan roleId 6 (Warga)
    const pendingUsers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        nik: schema.users.nik,
        phone: schema.users.phone,
        familyNumber: schema.users.familyNumber,
        unitNumber: schema.users.unitNumber,
        createdAt: schema.users.createdAt,
        dwellingId: schema.users.dwellingId,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
      })
      .from(schema.users)
      .leftJoin(schema.dwellings, eq(schema.users.dwellingId, schema.dwellings.id))
      .where(
        and(
          eq(schema.users.status, "pending"),
          eq(schema.users.roleId, 6)
        )
      )
      .orderBy(desc(schema.users.createdAt));

    return NextResponse.json({ data: pendingUsers });
  } catch (error: any) {
    console.error("Error in GET /api/approvals/registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
