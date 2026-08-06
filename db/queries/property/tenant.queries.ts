import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';
import { sendEmail } from '@/lib/mail';
import { getTenantFamilyWelcomeEmail } from '@/lib/emails/templates';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateTenantInput {
  rentalPropertyId: number;
  roomNumber: string;
  tenantType: 'individual' | 'family';
  // Untuk individual tenant
  individualName?: string;
  individualNik?: string;
  individualGender?: 'L' | 'P';
  individualBirthPlace?: string | null;
  individualBirthDate?: string | null;
  individualPhone?: string | null;
  individualKtpFile?: string | null;
  // Untuk family tenant
  familyId?: number | null;
  userId?: string | null;
  // Untuk family tenant (user baru)
  email?: string | null;
  checkInDate: string | Date;
  notes?: string | null;
}

export interface UpdateTenantInput {
  roomNumber?: string;
  tenantType?: 'individual' | 'family';
  individualName?: string | null;
  individualNik?: string | null;
  individualGender?: 'L' | 'P' | null;
  individualPhone?: string | null;
  individualKtpFile?: string | null;
  checkInDate?: string | Date;
  checkOutDate?: string | Date | null;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationNote?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

// ==========================================
// READ QUERIES
// ==========================================

/**
 * Daftar kontrak sewa per properti.
 */
export async function listTenantContracts(options: {
  rentalPropertyId: number;
  limit?: number;
  offset?: number;
  isActive?: boolean;
  query?: string;
}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [eq(schema.rentalContracts.rentalPropertyId, options.rentalPropertyId)];
  if (options.isActive !== undefined) conditions.push(eq(schema.rentalContracts.isActive, options.isActive));
  if (options.query) {
    conditions.push(
      or(
        like(schema.rentalContracts.individualName, `%${options.query}%`),
        like(schema.rentalContracts.individualNik, `%${options.query}%`)
      )
    );
  }

  const whereClause = and(...conditions);

  const data = await db
    .select({
      id: schema.rentalContracts.id,
      rentalPropertyId: schema.rentalContracts.rentalPropertyId,
      roomNumber: schema.rentalContracts.roomNumber,
      tenantType: schema.rentalContracts.tenantType,
      familyId: schema.rentalContracts.familyId,
      userId: schema.rentalContracts.userId,
      individualName: schema.rentalContracts.individualName,
      individualNik: schema.rentalContracts.individualNik,
      individualGender: schema.rentalContracts.individualGender,
      individualBirthPlace: schema.rentalContracts.individualBirthPlace,
      individualPhone: schema.rentalContracts.individualPhone,
      individualKtpFile: schema.rentalContracts.individualKtpFile,
      checkInDate: schema.rentalContracts.checkInDate,
      checkOutDate: schema.rentalContracts.checkOutDate,
      isActive: schema.rentalContracts.isActive,
      createdAt: schema.rentalContracts.createdAt,
      // Join info
      familyNumber: schema.families.familyNumber,
      familyVerificationStatus: schema.families.verificationStatus,
      userName: schema.users.name,
    })
    .from(schema.rentalContracts)
    .leftJoin(schema.families, eq(schema.rentalContracts.familyId, schema.families.id))
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.rentalContracts.createdAt));

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalContracts)
    .where(whereClause);

  return {
    data,
    metadata: { total: Number(totalResult?.count ?? 0), limit, offset },
  };
}

/**
 * Daftar semua kontrak sewa (lintas properti) dengan filter.
 */
export async function listAllTenantContracts(options: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
  tenantType?: 'individual' | 'family';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  query?: string;
}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.isActive !== undefined) {
    conditions.push(eq(schema.rentalContracts.isActive, options.isActive));
  }
  if (options.tenantType) {
    conditions.push(eq(schema.rentalContracts.tenantType, options.tenantType));
  }
  if (options.verificationStatus) {
    conditions.push(eq(schema.rentalContracts.verificationStatus, options.verificationStatus));
  }
  if (options.query) {
    const v = `%${options.query}%`;
    conditions.push(
      or(
        like(schema.rentalContracts.individualName, v),
        like(schema.rentalContracts.individualNik, v),
        like(schema.users.name, v),
        like(schema.rentalProperties.name, v)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rawData = await db
    .select({
      id: schema.rentalContracts.id,
      rentalPropertyId: schema.rentalContracts.rentalPropertyId,
      roomNumber: schema.rentalContracts.roomNumber,
      tenantType: schema.rentalContracts.tenantType,
      individualName: schema.rentalContracts.individualName,
      individualNik: schema.rentalContracts.individualNik,
      individualPhone: schema.rentalContracts.individualPhone,
      individualKtpFile: schema.rentalContracts.individualKtpFile,
      checkInDate: schema.rentalContracts.checkInDate,
      checkOutDate: schema.rentalContracts.checkOutDate,
      verificationStatus: schema.rentalContracts.verificationStatus,
      verificationNote: schema.rentalContracts.verificationNote,
      isActive: schema.rentalContracts.isActive,
      propertyName: schema.rentalProperties.name,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      userName: schema.users.name,
      userPhone: schema.users.phone,
      userStatus: schema.users.status,
      familyNumber: schema.families.familyNumber,
      familyKkFile: schema.families.kkFile,
    })
    .from(schema.rentalContracts)
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .leftJoin(schema.families, eq(schema.rentalContracts.familyId, schema.families.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.rentalContracts.createdAt));

  const data = rawData.map((c) => {
    const tenantTypeStr = c.tenantType === 'family' ? ('keluarga' as const) : ('perorangan' as const);

    return {
      id: c.id,
      rentalPropertyId: c.rentalPropertyId,
      roomNumber: c.roomNumber,
      tenantType: tenantTypeStr,
      name: c.individualName || c.userName || 'Penyewa',
      nik: c.individualNik || c.familyNumber || '-',
      phone: c.individualPhone || c.userPhone || null,
      ktpFile: c.individualKtpFile || c.familyKkFile || null,
      checkInDate: c.checkInDate ? (typeof c.checkInDate === 'string' ? c.checkInDate : (c.checkInDate as Date).toISOString()) : new Date().toISOString(),
      checkOutDate: c.checkOutDate ? (typeof c.checkOutDate === 'string' ? c.checkOutDate : (c.checkOutDate as Date).toISOString()) : null,
      verificationStatus: (c.verificationStatus as 'pending' | 'verified' | 'rejected') || 'pending',
      verificationNote: c.verificationNote || null,
      isActive: c.isActive,
      propertyName: c.propertyName,
      blockNumber: c.blockNumber,
      houseNumber: c.houseNumber,
    };
  });

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalContracts)
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .where(whereClause);

  return {
    data,
    metadata: { total: Number(totalResult?.count ?? 0), limit, offset },
  };
}

export async function getTenantContractById(id: number) {
  const [contract] = await db
    .select()
    .from(schema.rentalContracts)
    .where(eq(schema.rentalContracts.id, id))
    .limit(1);
  return contract ?? null;
}

/**
 * Riwayat kontrak non-aktif untuk kamar tertentu.
 */
export async function getRoomContractHistory(propertyId: number, roomNumber: string) {
  return db
    .select()
    .from(schema.rentalContracts)
    .where(
      and(
        eq(schema.rentalContracts.rentalPropertyId, propertyId),
        eq(schema.rentalContracts.roomNumber, roomNumber),
        eq(schema.rentalContracts.isActive, false)
      )
    )
    .orderBy(desc(schema.rentalContracts.checkOutDate), desc(schema.rentalContracts.createdAt));
}

// ==========================================
// WRITE QUERIES
// ==========================================

/**
 * Buat kontrak sewa baru untuk penyewa individual.
 */
export async function createTenantContract(data: CreateTenantInput) {
  const checkInDate = data.checkInDate instanceof Date ? data.checkInDate : new Date(String(data.checkInDate));

  // Cek NIK duplikasi untuk individual
  if (data.tenantType === 'individual' && data.individualNik) {
    const [existing] = await db
      .select({ id: schema.rentalContracts.id })
      .from(schema.rentalContracts)
      .where(and(eq(schema.rentalContracts.individualNik, data.individualNik), eq(schema.rentalContracts.isActive, true)))
      .limit(1);
    if (existing) throw new Error(`NIK ${data.individualNik} sudah memiliki kontrak sewa aktif.`);
  }

  const [result] = await db.insert(schema.rentalContracts).values({
    rentalPropertyId: data.rentalPropertyId,
    roomNumber: data.roomNumber,
    tenantType: data.tenantType,
    familyId: data.familyId ?? null,
    userId: data.userId ?? null,
    individualName: data.individualName ?? null,
    individualNik: data.individualNik ?? null,
    individualGender: data.individualGender ?? null,
    individualBirthPlace: data.individualBirthPlace ?? null,
    individualBirthDate: data.individualBirthDate ? new Date(data.individualBirthDate) : null,
    individualPhone: data.individualPhone ?? null,
    individualKtpFile: data.individualKtpFile ?? null,
    checkInDate,
    isActive: true,
  });

  return result.insertId;
}

/**
 * Buat kontrak sewa keluarga: Buat user baru + KK baru + kontrak.
 * Kirim email kredensial ke penyewa keluarga.
 */
export async function createFamilyTenantWithUser(
  data: CreateTenantInput & {
    email: string;
    name: string;
    nik: string;
    phone?: string | null;
    dwellingId: number;
  },
  requestOrigin?: string
) {
  // Cek duplikasi email
  const [existingEmail] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, data.email))
    .limit(1);
  if (existingEmail) throw new Error(`Email ${data.email} sudah terdaftar di sistem.`);

  const checkInDate = data.checkInDate instanceof Date ? data.checkInDate : new Date(String(data.checkInDate));
  const randomPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(randomPassword);
  const userId = randomUUID();

  let contractId!: number;

  await db.transaction(async (tx) => {
    // 1. Buat user
    await tx.insert(schema.users).values({
      id: userId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone ?? null,
      status: 'active',
      emailVerified: false,
    });

    await tx.insert(schema.userRoles).values({ userId, roleId: 6, isPrimary: true }).onDuplicateKeyUpdate({ set: { id: sql`id` } });

    await tx.insert(schema.accounts).values({
      id: randomUUID(),
      accountId: data.email,
      providerId: 'credential',
      userId,
      password: hashedPassword,
    });

    // 2. Buat KK untuk penyewa keluarga
    const [insertFamily] = await tx.insert(schema.families).values({
      dwellingId: data.dwellingId,
      familyNumber: data.nik,
      headUserId: userId,
      verificationStatus: 'draft',
      isActive: true,
    });
    const familyId = insertFamily.insertId;

    // 3. Insert kepala keluarga sebagai family_member
    await tx.insert(schema.familyMembers).values({
      familyId,
      userId,
      name: data.name,
      nik: data.nik,
      gender: 'L',
      relationship: 'Kepala_Keluarga',
      phone: data.phone ?? null,
      isActive: true,
    });

    // 4. Buat kontrak sewa
    const [insertContract] = await tx.insert(schema.rentalContracts).values({
      rentalPropertyId: data.rentalPropertyId,
      roomNumber: data.roomNumber,
      tenantType: 'family',
      familyId,
      userId,
      checkInDate,
      isActive: true,
    });
    contractId = insertContract.insertId;
  });

  // Kirim email kredensia
  try {
    const origin = requestOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    await sendEmail({
      to: { email: data.email, name: data.name },
      subject: 'Akun Penyewa Keluarga Wargaku Berhasil Dibuat',
      htmlContent: getTenantFamilyWelcomeEmail(data.name, data.email, randomPassword, `${origin}/login`),
    });
  } catch (err) {
    console.error('Gagal kirim email kredensial penyewa keluarga:', err);
  }

  return contractId;
}

/**
 * Perbarui kontrak sewa.
 */
export async function updateTenantContract(id: number, data: UpdateTenantInput) {
  const payload: Record<string, any> = { updatedAt: new Date() };
  if (data.roomNumber !== undefined) payload.roomNumber = data.roomNumber;
  if (data.individualName !== undefined) payload.individualName = data.individualName;
  if (data.individualNik !== undefined) payload.individualNik = data.individualNik;
  if (data.individualGender !== undefined) payload.individualGender = data.individualGender;
  if (data.individualPhone !== undefined) payload.individualPhone = data.individualPhone;
  if (data.individualKtpFile !== undefined) payload.individualKtpFile = data.individualKtpFile;
  if (data.checkInDate !== undefined) payload.checkInDate = data.checkInDate instanceof Date ? data.checkInDate : new Date(String(data.checkInDate));
  if (data.checkOutDate !== undefined) payload.checkOutDate = data.checkOutDate ? (data.checkOutDate instanceof Date ? data.checkOutDate : new Date(String(data.checkOutDate))) : null;
  if (data.verificationStatus !== undefined) payload.verificationStatus = data.verificationStatus;
  if (data.verificationNote !== undefined) payload.verificationNote = data.verificationNote;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.notes !== undefined) payload.notes = data.notes;

  await db.update(schema.rentalContracts).set(payload).where(eq(schema.rentalContracts.id, id));
  return true;
}

/**
 * Check-out penyewa — nonaktifkan kontrak.
 * Jika family tenant, nonaktifkan KK juga.
 */
export async function checkOutTenant(
  contractId: number,
  data: { checkOutDate: Date; notes?: string | null }
) {
  await db.transaction(async (tx) => {
    const [contract] = await tx
      .select()
      .from(schema.rentalContracts)
      .where(eq(schema.rentalContracts.id, contractId))
      .limit(1);

    if (!contract) throw new Error('Kontrak tidak ditemukan.');

    await tx
      .update(schema.rentalContracts)
      .set({ isActive: false, checkOutDate: data.checkOutDate, updatedAt: new Date() })
      .where(eq(schema.rentalContracts.id, contractId));

    // Jika family tenant, nonaktifkan KK dan user
    if (contract.tenantType === 'family' && contract.familyId) {
      await tx
        .update(schema.families)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.families.id, contract.familyId));

      if (contract.userId) {
        await tx
          .update(schema.users)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(eq(schema.users.id, contract.userId));
      }
    }
  });
}

/**
 * Hapus kontrak sewa (hard delete untuk individual, cascade untuk family tenant).
 */
export async function deleteTenantContract(contractId: number) {
  await db.transaction(async (tx) => {
    const [contract] = await tx
      .select()
      .from(schema.rentalContracts)
      .where(eq(schema.rentalContracts.id, contractId))
      .limit(1);

    if (!contract) return;

    await tx.delete(schema.rentalContracts).where(eq(schema.rentalContracts.id, contractId));

    // Jika family tenant, hapus KK, family_members, user
    if (contract.tenantType === 'family' && contract.familyId) {
      await tx.delete(schema.familyMembers).where(eq(schema.familyMembers.familyId, contract.familyId));
      await tx.delete(schema.families).where(eq(schema.families.id, contract.familyId));
      if (contract.userId) {
        await tx.delete(schema.accounts).where(eq(schema.accounts.userId, contract.userId));
        await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, contract.userId));
        await tx.delete(schema.users).where(eq(schema.users.id, contract.userId));
      }
    }
  });
}

/**
 * Aktifkan kembali kontrak sewa yang sudah check-out.
 */
export async function reactivateTenantContract(contractId: number) {
  await db.transaction(async (tx) => {
    const [contract] = await tx
      .select()
      .from(schema.rentalContracts)
      .where(eq(schema.rentalContracts.id, contractId))
      .limit(1);

    if (!contract) throw new Error('Kontrak tidak ditemukan.');

    await tx
      .update(schema.rentalContracts)
      .set({ isActive: true, checkOutDate: null, updatedAt: new Date() })
      .where(eq(schema.rentalContracts.id, contractId));

    if (contract.tenantType === 'family' && contract.familyId) {
      await tx.update(schema.families).set({ isActive: true, updatedAt: new Date() }).where(eq(schema.families.id, contract.familyId));
      if (contract.userId) {
        await tx.update(schema.users).set({ status: 'active', updatedAt: new Date() }).where(eq(schema.users.id, contract.userId));
      }
    }
  });
}

export async function terminateTenantContract(id: number) {
  await db
    .update(schema.rentalContracts)
    .set({ isActive: false, checkOutDate: new Date(), updatedAt: new Date() })
    .where(eq(schema.rentalContracts.id, id));
  return true;
}
