import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { claimWargaForExistingUser } from "@/db/queries/auth/user.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";
import { claimWargaSchema } from "@/lib/validations/kependudukan";
import { ZodError } from "zod";

/**
 * @openapi
 * /api/user/claim-warga:
 *   post:
 *     summary: Klaim akun warga (Mendaftarkan KK)
 *     description: Mendaftarkan Kartu Keluarga (KK) bagi pengguna yang baru mendaftar atau pengguna yang belum memiliki KK. Menambahkan status Warga (Kepala Keluarga) ke akun pengguna yang sedang login.
 *     tags:
 *       - Pengguna & Profil
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dwellingId
 *               - familyNumber
 *               - nik
 *             properties:
 *               dwellingId:
 *                 type: integer
 *               familyNumber:
 *                 type: string
 *               nik:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [L, P]
 *     responses:
 *       200:
 *         description: Berhasil mendaftarkan Kartu Keluarga
 *       400:
 *         description: Data tidak lengkap atau validasi (NIK terdaftar, dsb) gagal
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validated = claimWargaSchema.parse(body);

    const result = await claimWargaForExistingUser(session.user.id, {
      dwellingId: validated.dwellingId,
      familyNumber: validated.familyNumber,
      nik: validated.nik,
      gender: validated.gender,
    });

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      userId: session.user.id,
      action: "CLAIM_WARGA_STATUS",
      module: "pengguna",
      description: `Pengguna ${session.user.name} (${session.user.email}) melengkapi Kartu Keluarga No. ${validated.familyNumber} sebagai Kepala Keluarga`,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil melengkapi Kartu Keluarga dan menambahkan status Warga (Kepala Keluarga).",
      familyId: result.familyId,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid", issues: error.issues }, { status: 400 });
    }

    if (error?.message?.includes("FAMILY_ALREADY_EXISTS")) {
      return NextResponse.json({ error: "Akun Anda sudah terdaftar sebagai Kepala Keluarga." }, { status: 400 });
    }
    if (error?.message?.includes("NIK_ALREADY_LINKED")) {
      return NextResponse.json({ error: "NIK ini sudah terhubung dengan akun Kepala Keluarga lain." }, { status: 400 });
    }
    if (error?.message?.includes("NIK_ALREADY_EXISTS")) {
      return NextResponse.json({ error: "NIK ini sudah terdaftar sebagai Kepala Keluarga di KK lain." }, { status: 400 });
    }
    if (error?.message?.includes("FAMILY_NUMBER_EXISTS")) {
      return NextResponse.json({ error: "Nomor KK ini sudah terdaftar dengan Kepala Keluarga lain." }, { status: 400 });
    }
    if (error?.message?.includes("INVALID_DWELLING")) {
      return NextResponse.json({ error: "Alamat hunian tidak valid atau bertipe Homestay." }, { status: 400 });
    }
    console.error("POST /api/user/claim-warga error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
