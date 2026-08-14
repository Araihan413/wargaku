import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  accountActivationTokens,
  rentalContracts,
  rentalProperties,
  users,
  userRoles,
  accounts,
  families,
  familyMembers,
} from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
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

    const [tokenData] = await db
      .select({
        id: accountActivationTokens.id,
        token: accountActivationTokens.token,
        email: accountActivationTokens.email,
        nik: accountActivationTokens.nik,
        rentalContractId: accountActivationTokens.rentalContractId,
        expiresAt: accountActivationTokens.expiresAt,
        isUsed: accountActivationTokens.isUsed,
      })
      .from(accountActivationTokens)
      .where(
        and(
          eq(accountActivationTokens.token, token),
          eq(accountActivationTokens.isUsed, false),
          gt(accountActivationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Tautan aktivasi tidak valid, telah digunakan, atau telah kedaluwarsa. Silakan minta pengelola kos untuk mengirim ulang undangan." },
        { status: 400 }
      );
    }

    let userName = "Penyewa";
    let propertyName = "Properti Kos";

    if (tokenData.rentalContractId) {
      const [contract] = await db
        .select({
          individualName: rentalContracts.individualName,
          individualNik: rentalContracts.individualNik,
          propertyName: rentalProperties.name,
        })
        .from(rentalContracts)
        .innerJoin(rentalProperties, eq(rentalContracts.rentalPropertyId, rentalProperties.id))
        .where(eq(rentalContracts.id, tokenData.rentalContractId))
        .limit(1);

      if (contract) {
        userName = contract.individualName || userName;
        propertyName = contract.propertyName || propertyName;
      }
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      nik: tokenData.nik,
      userName,
      propertyName,
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

    const cleanFamilyNumber = familyNumber.replace(/\D/g, "");

    // 1. Fetch & validate token
    const [tokenData] = await db
      .select()
      .from(accountActivationTokens)
      .where(
        and(
          eq(accountActivationTokens.token, token),
          eq(accountActivationTokens.isUsed, false),
          gt(accountActivationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Tautan aktivasi tidak valid atau telah kedaluwarsa." },
        { status: 400 }
      );
    }

    if (!tokenData.rentalContractId) {
      return NextResponse.json({ error: "Data kontrak sewa tidak terkait dengan token ini." }, { status: 400 });
    }

    // 2. Fetch contract & dwelling info — validasi isActive wajib
    const [contract] = await db
      .select({
        id: rentalContracts.id,
        isActive: rentalContracts.isActive,
        individualName: rentalContracts.individualName,
        individualNik: rentalContracts.individualNik,
        individualPhone: rentalContracts.individualPhone,
        individualKtpFile: rentalContracts.individualKtpFile,
        dwellingId: rentalProperties.dwellingId,
      })
      .from(rentalContracts)
      .innerJoin(rentalProperties, eq(rentalContracts.rentalPropertyId, rentalProperties.id))
      .where(eq(rentalContracts.id, tokenData.rentalContractId))
      .limit(1);

    if (!contract) {
      return NextResponse.json({ error: "Data kontrak sewa tidak ditemukan. Hubungi pengelola kos." }, { status: 404 });
    }

    // Aturan Wajib: Kontrak sewa harus MASIH AKTIF
    if (!contract.isActive) {
      return NextResponse.json(
        { error: "Kontrak sewa ini sudah tidak aktif atau telah dibatalkan. Hubungi koordinator kos Anda." },
        { status: 400 }
      );
    }

    const userName = contract.individualName || "Kepala Keluarga";
    const userNik = tokenData.nik || contract.individualNik || "";
    const userPhone = contract.individualPhone || null;
    const hashedPassword = await hashPassword(password);
    let userId = "";

    // 3. Eksekusi atomik — Biarkan MySQL UNIQUE Constraint yang memproteksi duplikasi
    await db.transaction(async (tx) => {
      // Step 1: INSERT user baru (langsung active karena sudah terverifikasi via email link)
      userId = randomUUID();
      await tx.insert(users).values({
        id: userId,
        name: userName,
        email: tokenData.email,
        password: hashedPassword,
        phone: userPhone,
        status: "active",
        emailVerified: true,
      });
      // Jika email sudah ada → MySQL ER_DUP_ENTRY → FULL ROLLBACK otomatis

      // Step 2: Assign role Warga/Penyewa (roleId 6)
      await tx
        .insert(userRoles)
        .values({ userId, roleId: 6, isPrimary: true })
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });

      // Step 3: Credential account
      await tx.insert(accounts).values({
        id: randomUUID(),
        accountId: tokenData.email,
        providerId: "credential",
        userId,
        password: hashedPassword,
      });
      // Jika accountId duplikat → ER_DUP_ENTRY → FULL ROLLBACK

      // Step 4: INSERT keluarga (KK) baru — status draft
      const [insertFamily] = await tx.insert(families).values({
        dwellingId: contract.dwellingId,
        familyNumber: cleanFamilyNumber,
        headUserId: userId,
        kkFile: kkFile || null,
        verificationStatus: "draft",
        isActive: true,
      });
      // Jika No. KK sudah ada → MySQL ER_DUP_ENTRY (unique: family_number) → FULL ROLLBACK otomatis

      const familyId = insertFamily.insertId;

      // Step 5: INSERT anggota keluarga (Kepala Keluarga)
      await tx.insert(familyMembers).values({
        familyId,
        userId,
        name: userName,
        nik: userNik,
        phone: userPhone,
        gender: "L",
        relationship: "Kepala_Keluarga",
        ktpFile: contract.individualKtpFile || null,
        isActive: true,
      });
      // Jika NIK sudah ada → MySQL ER_DUP_ENTRY (unique: nik) → FULL ROLLBACK otomatis

      // Step 6: Sambungkan rental_contracts → family_id & user_id
      await tx
        .update(rentalContracts)
        .set({ familyId, userId, tenantType: "family" })
        .where(eq(rentalContracts.id, contract.id));

      // Step 7: Auto-Sync Dwelling ID — pastikan alamat KK selaras dengan kos
      await tx
        .update(families)
        .set({ dwellingId: contract.dwellingId })
        .where(eq(families.id, familyId));

      // Step 8: Matikan token aktivasi ini
      await tx
        .update(accountActivationTokens)
        .set({ isUsed: true })
        .where(eq(accountActivationTokens.id, tokenData.id));
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId,
      action: "ACTIVATE_ACCOUNT",
      module: "autentikasi",
      description: `Akun baru diaktifkan melalui tautan undangan untuk email ${tokenData.email} (penyewa kos).`,
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
