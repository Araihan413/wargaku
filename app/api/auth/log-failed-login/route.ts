import { NextResponse } from "next/server";
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from "@/lib/audit-logger";

/**
 * @openapi
 * /api/auth/log-failed-login:
 *   post:
 *     summary: Mencatat log percobaan login yang gagal
 *     description: Dipanggil dari sisi klien saat login (lewat better-auth) gagal untuk mencatat ke dalam audit log (mencegah brute force atau memantau percobaan masuk).
 *     tags:
 *       - Autentikasi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email atau NIK yang mencoba login
 *               reason:
 *                 type: string
 *                 description: Alasan kegagalan (contoh "Password Salah")
 *     responses:
 *       200:
 *         description: Berhasil mencatat log
 *       400:
 *         description: Email/NIK wajib diisi
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json({ error: "Email/NIK wajib diisi" }, { status: 400 });
    }

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      action: "LOGIN_FAILED",
      module: "auth",
      description: `Percobaan login gagal untuk identifier "${email}" (Alasan: ${reason || "Password/Kredensial Salah"})`,
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gagal mencatat log failed login:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
