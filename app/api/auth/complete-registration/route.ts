import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * @openapi
 * /api/auth/complete-registration:
 *   post:
 *     summary: Menyelesaikan pendaftaran data kependudukan (Warga)
 *     description: Endpoint untuk pengguna (warga) yang baru pertama kali login agar mereka bisa mengisi NIK, No. KK, dan memilih hunian mereka. Data keluarga akan masuk ke status "draft".
 *     tags:
 *       - Autentikasi
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nik
 *               - familyNumber
 *               - dwellingId
 *             properties:
 *               nik:
 *                 type: string
 *                 description: 16 digit NIK Kepala Keluarga
 *               familyNumber:
 *                 type: string
 *                 description: 16 digit Nomor KK
 *               dwellingId:
 *                 type: integer
 *                 description: ID hunian (rumah)
 *     responses:
 *       200:
 *         description: Pendaftaran data kependudukan berhasil diselesaikan
 *       400:
 *         description: Data kependudukan tidak lengkap, Nomor KK sudah terdaftar, atau NIK sudah terdaftar
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
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
