import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { notifyRoles } from "@/lib/notifications";
import { sendEmail } from "@/lib/mail";
import { getWargaRegistrationEmail } from "@/lib/emails/templates";

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

    // Insert data kependudukan dengan status draft & tetapkan role Warga (6)
    await db.transaction(async (tx) => {
      // 1. Tetapkan role Warga secara eksplisit
      await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, session.user.id));
      await tx.insert(schema.userRoles).values({
        userId: session.user.id,
        roleId: 6,
        isPrimary: true,
      });

      // 2. Insert ke tabel families
      const [insertResult] = await tx.insert(schema.families).values({
        dwellingId: dwellingId,
        headUserId: session.user.id,
        familyNumber: familyNumber,
        verificationStatus: "draft",
        isActive: true,
      });

      const familyId = insertResult.insertId;

      // 3. Insert ke tabel family_members
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

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: "COMPLETE_REGISTRATION",
      module: "autentikasi",
      description: `${session.user.name} menyelesaikan pendaftaran data kependudukan (KK No. ${familyNumber}, hunian ID: ${dwellingId}).`,
      ipAddress,
    }).catch(() => null);

    // 1. Kirim notifikasi internal ke Ketua RT & Sekretaris
    notifyRoles(["ketua-rt", "sekretaris"], {
      title: "Pendaftaran Warga Baru",
      message: `Warga bernama ${session.user.name} telah menyelesaikan pendaftaran mandiri dan menunggu persetujuan Anda.`,
      category: "dinas",
      redirectLink: `/dashboard/approvals/registration`,
    }).catch((err) => {
      console.error("Gagal mengirim notifikasi ke RT:", err);
    });

    // 2. Kirim email konfirmasi ke Warga
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const loginLink = `${appUrl}/login`;

    sendEmail({
      to: { email: session.user.email, name: session.user.name },
      subject: "Pendaftaran Akun Wargaku Berhasil",
      htmlContent: getWargaRegistrationEmail(session.user.name, loginLink),
    }).catch((err) => {
      console.error("Gagal mengirim email konfirmasi warga:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in complete-registration:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
