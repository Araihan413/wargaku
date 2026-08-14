import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';
import { sendEmail, sendAccountActivationEmail } from '@/lib/mail';
import { getTenantFamilyWelcomeEmail } from '@/lib/emails/templates';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateTenantInput {
  rentalPropertyId: number;
  tenantType: 'individual' | 'family';
  // Untuk individual tenant
  individualName?: string;
  individualNik?: string;
  individualPhone?: string | null;
  individualKtpFile?: string | null;
  // Untuk family tenant
  familyId?: number | null;
  userId?: string | null;
  // Untuk family tenant (user baru)
  email?: string | null;
  checkInDate: string | Date;
  notes?: string | null;
  autoDeductVacantRoom?: boolean;
}

export interface UpdateTenantInput {
  tenantType?: 'individual' | 'family';
  individualName?: string | null;
  individualNik?: string | null;
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

  const rawData = await db
    .select({
      id: schema.rentalContracts.id,
      rentalPropertyId: schema.rentalContracts.rentalPropertyId,
      tenantType: schema.rentalContracts.tenantType,
      familyId: schema.rentalContracts.familyId,
      userId: schema.rentalContracts.userId,
      individualName: schema.rentalContracts.individualName,
      individualNik: schema.rentalContracts.individualNik,
      individualPhone: schema.rentalContracts.individualPhone,
      individualKtpFile: schema.rentalContracts.individualKtpFile,
      checkInDate: schema.rentalContracts.checkInDate,
      checkOutDate: schema.rentalContracts.checkOutDate,
      verificationStatus: schema.rentalContracts.verificationStatus,
      verificationNote: schema.rentalContracts.verificationNote,
      isActive: schema.rentalContracts.isActive,
      createdAt: schema.rentalContracts.createdAt,
      // Join info
      familyNumber: schema.families.familyNumber,
      familyVerificationStatus: schema.families.verificationStatus,
      userName: schema.users.name,
      userPhone: schema.users.phone,
    })
    .from(schema.rentalContracts)
    .leftJoin(schema.families, eq(schema.rentalContracts.familyId, schema.families.id))
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.rentalContracts.createdAt));

  const mappedData = rawData.map((c) => {
    const tenantTypeStr = c.tenantType === 'family' ? 'keluarga' as const : 'perorangan' as const;
    return {
      id: c.id,
      rentalPropertyId: c.rentalPropertyId,
      tenantType: tenantTypeStr,
      name: c.individualName || c.userName || 'Penyewa',
      nik: c.individualNik || c.familyNumber || '-',
      phone: c.individualPhone || c.userPhone || null,
      ktpFile: c.individualKtpFile || null,
      checkInDate: c.checkInDate ? (typeof c.checkInDate === 'string' ? c.checkInDate : (c.checkInDate as Date).toISOString()) : new Date().toISOString(),
      checkOutDate: c.checkOutDate ? (typeof c.checkOutDate === 'string' ? c.checkOutDate : (c.checkOutDate as Date).toISOString()) : null,
      verificationStatus: (c.verificationStatus as 'pending' | 'verified' | 'rejected') || 'pending',
      verificationNote: c.verificationNote || null,
      isActive: c.isActive,
      createdAt: c.createdAt,
    };
  });

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalContracts)
    .where(whereClause);

  return {
    data: mappedData,
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
  coordinatorUserId?: string;
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
  if (options.coordinatorUserId) {
    conditions.push(eq(schema.rentalProperties.coordinatorUserId, options.coordinatorUserId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rawData = await db
    .select({
      id: schema.rentalContracts.id,
      rentalPropertyId: schema.rentalContracts.rentalPropertyId,
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

  let contractId!: number;

  await db.transaction(async (tx) => {
    const [result] = await tx.insert(schema.rentalContracts).values({
      rentalPropertyId: data.rentalPropertyId,
      tenantType: data.tenantType,
      familyId: data.familyId ?? null,
      userId: data.userId ?? null,
      individualName: data.individualName ?? null,
      individualNik: data.individualNik ?? null,
      individualPhone: data.individualPhone ?? null,
      individualKtpFile: data.individualKtpFile ?? null,
      checkInDate,
      isActive: true,
    });
    contractId = result.insertId;

    // Otomatis kurangi kamar kosong / tambah kamar terisi jika autoDeductVacantRoom true (default: true)
    if (data.autoDeductVacantRoom !== false) {
      await tx
        .update(schema.rentalProperties)
        .set({
          occupiedRooms: sql`LEAST(${schema.rentalProperties.totalRooms}, ${schema.rentalProperties.occupiedRooms} + 1)`,
          updatedAt: new Date(),
        })
        .where(eq(schema.rentalProperties.id, data.rentalPropertyId));
    }
  });

  return contractId;
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
      tenantType: 'family',
      familyId,
      userId,
      checkInDate,
      isActive: true,
    });
    contractId = insertContract.insertId;

    // Otomatis kurangi kamar kosong / tambah kamar terisi jika autoDeductVacantRoom true (default: true)
    if (data.autoDeductVacantRoom !== false) {
      await tx
        .update(schema.rentalProperties)
        .set({
          occupiedRooms: sql`LEAST(${schema.rentalProperties.totalRooms}, ${schema.rentalProperties.occupiedRooms} + 1)`,
          updatedAt: new Date(),
        })
        .where(eq(schema.rentalProperties.id, data.rentalPropertyId));
    }
  });

  // Kirim email kredensial
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
  if (data.individualName !== undefined) payload.individualName = data.individualName;
  if (data.individualNik !== undefined) payload.individualNik = data.individualNik;
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
 * Jika family tenant, nonaktifkan domisili KK juga.
 * Otomatis tambah kamar kosong jika autoFreeVacantRoom bernilai true (default: true).
 */
export async function checkOutTenant(
  contractId: number,
  data: { checkOutDate: Date; notes?: string | null; autoFreeVacantRoom?: boolean }
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
      .set({ 
        isActive: false, 
        checkOutDate: data.checkOutDate, 
        checkOutNote: data.notes || null,
        updatedAt: new Date() 
      })
      .where(eq(schema.rentalContracts.id, contractId));

    // Kurangi kamar terisi / tambah kamar kosong jika autoFreeVacantRoom true (default: true)
    if (data.autoFreeVacantRoom !== false) {
      await tx
        .update(schema.rentalProperties)
        .set({
          occupiedRooms: sql`GREATEST(0, ${schema.rentalProperties.occupiedRooms} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(schema.rentalProperties.id, contract.rentalPropertyId));
    }

    // Jika family tenant, cabut domisili (dwellingId: null) agar tidak lagi menghuni kos ini.
    if (contract.tenantType === 'family' && contract.familyId) {
      await tx
        .update(schema.families)
        .set({ dwellingId: null, updatedAt: new Date() })
        .where(eq(schema.families.id, contract.familyId));
    }
  });
}

/**
 * Hapus kontrak sewa.
 */
export async function deleteTenantContract(contractId: number) {
  await db.transaction(async (tx) => {
    const [contract] = await tx
      .select()
      .from(schema.rentalContracts)
      .where(eq(schema.rentalContracts.id, contractId))
      .limit(1);

    if (!contract) return;

    if (contract.isActive) {
      await tx
        .update(schema.rentalProperties)
        .set({
          occupiedRooms: sql`GREATEST(0, ${schema.rentalProperties.occupiedRooms} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(schema.rentalProperties.id, contract.rentalPropertyId));
    }

    await tx.delete(schema.rentalContracts).where(eq(schema.rentalContracts.id, contractId));

    if (contract.tenantType === 'family' && contract.familyId) {
      await tx
        .update(schema.families)
        .set({ dwellingId: null, updatedAt: new Date() })
        .where(eq(schema.families.id, contract.familyId));
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

    await tx
      .update(schema.rentalProperties)
      .set({
        occupiedRooms: sql`LEAST(${schema.rentalProperties.totalRooms}, ${schema.rentalProperties.occupiedRooms} + 1)`,
        updatedAt: new Date(),
      })
      .where(eq(schema.rentalProperties.id, contract.rentalPropertyId));

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

/**
 * Menerbitkan token aktivasi akun baru, meng-invalidasi token lama, dan mengirim email via Brevo.
 */
export async function createActivationTokenAndSendEmail({
  email,
  nik,
  rentalContractId,
  familyId,
  propertyName,
  userName,
  requestOrigin,
}: {
  email: string;
  nik: string;
  rentalContractId?: number;
  familyId?: number;
  propertyName: string;
  userName: string;
  requestOrigin?: string;
}) {
  // 1. Invalidate any existing unused tokens for this email or NIK
  await db
    .update(schema.accountActivationTokens)
    .set({ isUsed: true })
    .where(
      and(
        or(
          eq(schema.accountActivationTokens.email, email),
          eq(schema.accountActivationTokens.nik, nik)
        ),
        eq(schema.accountActivationTokens.isUsed, false)
      )
    );

  // 2. Generate new secure random token
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(schema.accountActivationTokens).values({
    token,
    email,
    nik,
    rentalContractId: rentalContractId ?? null,
    familyId: familyId ?? null,
    expiresAt,
    isUsed: false,
  });

  // 3. Build activation URL
  const origin = requestOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const activationUrl = `${origin}/activate-account?token=${token}`;

  // 4. Send Brevo email
  await sendAccountActivationEmail({
    toEmail: email,
    userName,
    propertyName,
    activationUrl,
  });

  return { token, activationUrl };
}

/**
 * Auto-Link kontrak sewa aktif yang masih gantung (familyId IS NULL) ke data keluarga/user.
 */
export async function autoLinkTenantContractToFamily({
  familyId,
  userId,
  nik,
  email,
  dwellingId,
}: {
  familyId: number;
  userId: string;
  nik?: string;
  email?: string;
  dwellingId?: number;
}) {
  const conditions: any[] = [
    eq(schema.rentalContracts.isActive, true),
    eq(schema.rentalContracts.tenantType, 'family'),
  ];

  if (nik) {
    conditions.push(eq(schema.rentalContracts.individualNik, nik));
  }

  const [contract] = await db
    .select({ id: schema.rentalContracts.id, rentalPropertyId: schema.rentalContracts.rentalPropertyId })
    .from(schema.rentalContracts)
    .where(and(...conditions, sql`${schema.rentalContracts.familyId} IS NULL`))
    .limit(1);

  if (!contract) return null;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.rentalContracts)
      .set({ familyId, userId })
      .where(eq(schema.rentalContracts.id, contract.id));

    if (dwellingId) {
      await tx
        .update(schema.families)
        .set({ dwellingId })
        .where(eq(schema.families.id, familyId));
    }

    if (email || nik) {
      await tx
        .update(schema.accountActivationTokens)
        .set({ isUsed: true })
        .where(
          and(
            or(
              email ? eq(schema.accountActivationTokens.email, email) : undefined,
              nik ? eq(schema.accountActivationTokens.nik, nik) : undefined,
            ),
            eq(schema.accountActivationTokens.isUsed, false),
            eq(schema.accountActivationTokens.rentalContractId, contract.id)
          )
        );
    }
  });

  return contract;
}
