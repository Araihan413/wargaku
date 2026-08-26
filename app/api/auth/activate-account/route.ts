import { NextResponse } from "next/server";
import {
  validateActivationToken,
  activateTenantAccount,
} from "@/db/queries/auth/activation.queries";
import { createAuditLog } from "@/db/queries/system/audit-log.queries";
import { getClientIp } from "@/lib/audit-logger";

/**
 * @openapi
 * /api/auth/activate-account:
 *   get:
 *     summary: Validasi token aktivasi akun penyewa
 *     description: Memvalidasi token aktivasi akun yang dikirimkan via email untuk penyewa kos dan mengembalikan ringkasan data penyewa.
 *     tags:
 *       - Autentikasi
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token aktivasi
 *     responses:
 *       200:
 *         description: Token valid dan mengembalikan data penyewa
 *       400:
 *         description: Token tidak ditemukan, tidak valid, atau kedaluwarsa
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token aktivasi tidak ditemukan." }, { status: 400 });
    }

    const tokenDetails = await validateActivationToken(token);

    if (!tokenDetails) {
      return NextResponse.json(
        { error: "Tautan aktivasi tidak valid, telah digunakan, atau telah kedaluwarsa. Silakan minta pengelola kos untuk mengirim ulang undangan." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: tokenDetails.email,
      nik: tokenDetails.nik,
      userName: tokenDetails.userName,
      propertyName: tokenDetails.propertyName,
    });
  } catch (error: any) {
    console.error("Error in GET /api/auth/activate-account:", error);
    return NextResponse.json({ error: "Kesalahan server internal." }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/auth/activate-account:
 *   post:
 *     summary: Eksekusi aktivasi akun mandiri (Penyewa)
 *     description: Mengaktifkan akun penyewa/kepala keluarga menggunakan token valid dan membuat data user, role, account, family (KK status draft), dan family_member.
 *     tags:
 *       - Autentikasi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - familyNumber
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               familyNumber:
 *                 type: string
 *                 description: 16 digit angka Nomor KK
 *               kkFile:
 *                 type: string
 *                 description: URL file KK (opsional)
 *               password:
 *                 type: string
 *                 description: Password akun (minimal 8 karakter)
 *     responses:
 *       200:
 *         description: Akun dan data keluarga berhasil diaktifkan
 *       400:
 *         description: Input tidak valid, token kedaluwarsa, atau kontrak sewa tidak aktif
 *       404:
 *         description: Data kontrak sewa tidak ditemukan
 *       409:
 *         description: Email, NIK, atau Nomor KK sudah terdaftar (Konflik duplikasi data)
 *       500:
 *         description: Gagal mengaktifkan akun (Kesalahan server)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, familyNumber, kkFile, password } = body;

    if (!token) {
      return NextResponse.json({ error: "Token aktivasi tidak ditemukan." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }
    if (!familyNumber || familyNumber.replace(/\D/g, "").length !== 16) {
      return NextResponse.json({ error: "Nomor KK harus terdiri dari 16 digit angka." }, { status: 400 });
    }

    let activatedResult;
    try {
      activatedResult = await activateTenantAccount({
        token,
        familyNumber,
        kkFile: kkFile || null,
        password,
      });
    } catch (err: any) {
      if (err.message === "INVALID_OR_EXPIRED_TOKEN") {
        return NextResponse.json({ error: "Tautan aktivasi tidak valid atau telah kedaluwarsa." }, { status: 400 });
      }
      if (err.message === "NO_RENTAL_CONTRACT") {
        return NextResponse.json({ error: "Data kontrak sewa tidak terkait dengan token ini." }, { status: 400 });
      }
      if (err.message === "CONTRACT_NOT_FOUND") {
        return NextResponse.json({ error: "Data kontrak sewa tidak ditemukan. Hubungi pengelola kos." }, { status: 404 });
      }
      if (err.message === "CONTRACT_INACTIVE") {
        return NextResponse.json({ error: "Kontrak sewa ini sudah tidak aktif atau telah dibatalkan. Hubungi koordinator kos Anda." }, { status: 400 });
      }
      throw err;
    }

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: activatedResult.userId,
      action: "ACTIVATE_ACCOUNT",
      module: "autentikasi",
      description: `Akun baru diaktifkan melalui tautan undangan untuk email ${activatedResult.email} (penyewa kos).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Akun dan data keluarga berhasil diaktifkan! Silakan login untuk melanjutkan.",
    });
  } catch (error: any) {
    // Tangani error duplikasi dari MySQL UNIQUE constraint
    if (error?.code === "ER_DUP_ENTRY") {
      const msg = error?.message ?? "";
      if (msg.includes("family_number") || msg.includes("families")) {
        return NextResponse.json(
          { error: "Nomor KK sudah terdaftar di sistem RT ini. Harap periksa kembali Nomor KK Anda atau hubungi pengurus RT." },
          { status: 409 }
        );
      }
      if (msg.includes("nik") || msg.includes("family_members")) {
        return NextResponse.json(
          { error: "NIK ini sudah terdaftar di data kependudukan RT. Hubungi pengurus RT jika Anda merasa ini adalah kesalahan." },
          { status: 409 }
        );
      }
      if (msg.includes("email") || msg.includes("users") || msg.includes("accounts")) {
        return NextResponse.json(
          { error: "Email ini sudah terdaftar. Jika Anda sudah memiliki akun, silakan gunakan halaman Login." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Data yang Anda masukkan sudah terdaftar di sistem. Hubungi pengurus RT untuk bantuan." },
        { status: 409 }
      );
    }

    console.error("Error in POST /api/auth/activate-account:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengaktifkan akun. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

