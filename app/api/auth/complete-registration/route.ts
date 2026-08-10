import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nik, familyNumber, dwellingId } = body;

    if (!nik || !familyNumber || !dwellingId) {
      return NextResponse.json({ error: "Data kependudukan tidak lengkap" }, { status: 400 });
    }

    // Periksa apakah NIK atau No KK sudah ada
    const existingFamily = await db
      .select({ id: schema.families.id })
      .from(schema.families)
      .where(eq(schema.families.familyNumber, familyNumber))
      .limit(1);

    if (existingFamily.length > 0) {
      return NextResponse.json({ error: "Nomor Kartu Keluarga sudah terdaftar" }, { status: 400 });
    }

    const existingMember = await db
      .select({ id: schema.familyMembers.id })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.nik, nik))
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
    }

    // Insert data kependudukan dengan status draft
    await db.transaction(async (tx) => {
      // 1. Insert ke tabel families
      const [insertResult] = await tx.insert(schema.families).values({
        dwellingId: dwellingId,
        headUserId: session.user.id,
        familyNumber: familyNumber,
        verificationStatus: "draft",
        isActive: true,
      });

      const familyId = insertResult.insertId;

      // 2. Insert ke tabel family_members
      await tx.insert(schema.familyMembers).values({
        familyId: familyId,
        userId: session.user.id,
        name: session.user.name,
        nik: nik,
        gender: "L", // Default gender, will be updated by user later
        relationship: "Kepala_Keluarga",
        isActive: true,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in complete-registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
