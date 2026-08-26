import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";

export interface ActivationTokenDetails {
  id: number;
  token: string;
  email: string;
  nik: string | null;
  rentalContractId: number | null;
  userName: string;
  propertyName: string;
}

/**
 * Memvalidasi token aktivasi dan mengambil data preview penyewa.
 */
export async function validateActivationToken(token: string): Promise<ActivationTokenDetails | null> {
  const [tokenData] = await db
    .select({
      id: schema.accountActivationTokens.id,
      token: schema.accountActivationTokens.token,
      email: schema.accountActivationTokens.email,
      nik: schema.accountActivationTokens.nik,
      rentalContractId: schema.accountActivationTokens.rentalContractId,
      expiresAt: schema.accountActivationTokens.expiresAt,
      isUsed: schema.accountActivationTokens.isUsed,
    })
    .from(schema.accountActivationTokens)
    .where(
      and(
        eq(schema.accountActivationTokens.token, token),
        eq(schema.accountActivationTokens.isUsed, false),
        gt(schema.accountActivationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenData) {
    return null;
  }

  let userName = "Penyewa";
  let propertyName = "Properti Kos";

  if (tokenData.rentalContractId) {
    const [contract] = await db
      .select({
        individualName: schema.rentalContracts.individualName,
        individualNik: schema.rentalContracts.individualNik,
        propertyName: schema.rentalProperties.name,
      })
      .from(schema.rentalContracts)
      .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
      .where(eq(schema.rentalContracts.id, tokenData.rentalContractId))
      .limit(1);

    if (contract) {
      userName = contract.individualName || userName;
      propertyName = contract.propertyName || propertyName;
    }
  }

  return {
    id: tokenData.id,
    token: tokenData.token,
    email: tokenData.email,
    nik: tokenData.nik,
    rentalContractId: tokenData.rentalContractId,
    userName,
    propertyName,
  };
}

export interface ActivateTenantAccountInput {
  token: string;
  familyNumber: string;
  kkFile?: string | null;
  password: string;
}

/**
 * Mengeksekusi aktivasi akun penyewa kos secara atomik dalam transaksi database.
 */
export async function activateTenantAccount(input: ActivateTenantAccountInput): Promise<{ userId: string; email: string }> {
  const { token, familyNumber, kkFile, password } = input;
  const cleanFamilyNumber = familyNumber.replace(/\D/g, "");

  // 1. Fetch & validate token
  const [tokenData] = await db
    .select()
    .from(schema.accountActivationTokens)
    .where(
      and(
        eq(schema.accountActivationTokens.token, token),
        eq(schema.accountActivationTokens.isUsed, false),
        gt(schema.accountActivationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenData) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  if (!tokenData.rentalContractId) {
    throw new Error("NO_RENTAL_CONTRACT");
  }

  // 2. Fetch contract & dwelling info
  const [contract] = await db
    .select({
      id: schema.rentalContracts.id,
      isActive: schema.rentalContracts.isActive,
      individualName: schema.rentalContracts.individualName,
      individualNik: schema.rentalContracts.individualNik,
      individualPhone: schema.rentalContracts.individualPhone,
      individualKtpFile: schema.rentalContracts.individualKtpFile,
      dwellingId: schema.rentalProperties.dwellingId,
    })
    .from(schema.rentalContracts)
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .where(eq(schema.rentalContracts.id, tokenData.rentalContractId))
    .limit(1);

  if (!contract) {
    throw new Error("CONTRACT_NOT_FOUND");
  }

  if (!contract.isActive) {
    throw new Error("CONTRACT_INACTIVE");
  }

  const userName = contract.individualName || "Kepala Keluarga";
  const userNik = tokenData.nik || contract.individualNik || "";
  const userPhone = contract.individualPhone || null;
  const hashedPassword = await hashPassword(password);
  const userId = randomUUID();

  // 3. Eksekusi atomik dalam transaksi
  await db.transaction(async (tx) => {
    // Step 1: INSERT user baru
    await tx.insert(schema.users).values({
      id: userId,
      name: userName,
      email: tokenData.email,
      phone: userPhone,
      status: "active",
      emailVerified: true,
    });

    // Step 2: Assign role Warga/Penyewa (roleId 6)
    await tx
      .insert(schema.userRoles)
      .values({ userId, roleId: 6, isPrimary: true })
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });

    // Step 3: Credential account
    await tx.insert(schema.accounts).values({
      id: randomUUID(),
      accountId: tokenData.email,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    // Step 4: INSERT keluarga (KK) baru — status draft
    const [insertFamily] = await tx.insert(schema.families).values({
      dwellingId: contract.dwellingId,
      familyNumber: cleanFamilyNumber,
      headUserId: userId,
      kkFile: kkFile || null,
      verificationStatus: "draft",
      isActive: true,
    });

    const familyId = insertFamily.insertId;

    // Step 5: INSERT anggota keluarga (Kepala Keluarga)
    await tx.insert(schema.familyMembers).values({
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

    // Step 6: Sambungkan rental_contracts → family_id & user_id
    await tx
      .update(schema.rentalContracts)
      .set({ familyId, userId, tenantType: "family" })
      .where(eq(schema.rentalContracts.id, contract.id));

    // Step 7: Auto-Sync Dwelling ID
    await tx
      .update(schema.families)
      .set({ dwellingId: contract.dwellingId })
      .where(eq(schema.families.id, familyId));

    // Step 8: Matikan token aktivasi ini
    await tx
      .update(schema.accountActivationTokens)
      .set({ isUsed: true })
      .where(eq(schema.accountActivationTokens.id, tokenData.id));
  });

  return { userId, email: tokenData.email };
}
