import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/rbac";
import { getSystemSettings, updateSystemSettings } from "@/db/queries/system/system-setting.queries";
import { getClientIp } from "@/lib/audit-logger";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { updateSystemConfigSchema } from "@/lib/validations/system";
import { ZodError } from "zod";

/**
 * @openapi
 * /api/system-config:
 *   get:
 *     summary: Mendapatkan konfigurasi sistem
 *     description: Mengambil data pengaturan sistem saat ini (nama RT, RW, Kelurahan, Kecamatan, Kota, dll). Akses khusus Admin dengan izin manage-system-config.
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan konfigurasi sistem
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses khusus Super Admin atau Admin yang berwenang
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, errorResponse } = await validateApiAuth("manage-system-config");
    if (errorResponse || !session) return errorResponse;

    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("Error in GET /api/system-config:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/system-config:
 *   put:
 *     summary: Memperbarui konfigurasi sistem
 *     description: Mengubah data pengaturan lingkungan RT (nama RT/RW, nama kelurahan/kecamatan/kabupaten, kode pos, dll).
 *     tags:
 *       - Sistem & Admin
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rtName
 *               - rwName
 *               - villageName
 *               - subdistrictName
 *               - cityName
 *               - provinceName
 *               - postalCode
 *             properties:
 *               rtName:
 *                 type: string
 *               rwName:
 *                 type: string
 *               villageName:
 *                 type: string
 *               subdistrictName:
 *                 type: string
 *               cityName:
 *                 type: string
 *               provinceName:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               addressNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Konfigurasi sistem berhasil diperbarui
 *       400:
 *         description: Validasi input gagal
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Akses khusus Super Admin atau Admin yang berwenang
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(req: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth("manage-system-config");
    if (errorResponse || !session) return errorResponse;

    const body = await req.json();
    const validated = updateSystemConfigSchema.parse(body);

    const ipAddress = await getClientIp(req);
    const updatedSettings = await updateSystemSettings(validated, session.user.id, ipAddress || undefined);

    createAuditLog({
      userId: session.user.id,
      action: "UPDATE_SYSTEM_CONFIG",
      module: "sistem",
      description: `Memperbarui konfigurasi sistem RT: ${validated.rtName}, RW: ${validated.rwName}, Kelurahan: ${validated.villageName}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      message: "Konfigurasi sistem berhasil diperbarui",
      settings: updatedSettings,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data konfigurasi tidak valid", issues: error.issues }, { status: 400 });
    }
    console.error("Error in PUT /api/system-config:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

