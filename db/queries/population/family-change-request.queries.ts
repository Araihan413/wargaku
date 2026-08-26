import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, inArray, desc, like, sql } from 'drizzle-orm';

import { getFamilyById } from './family.queries';
import { decryptPII, hashPII } from '@/lib/crypto-pii';


import { getFamilyMemberByNik } from './family-member.queries';
import { notifyUser } from '@/lib/notifications';
import { deleteCloudinaryFileByUrl } from '@/lib/cloudinary';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface DraftMemberItem {
  id?: number;
  tempId?: string;
  userId?: string | null;
  name: string;
  nik: string;
  gender: 'L' | 'P';
  relationship: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Mertua' | 'Sepupu' | 'Lainnya';
  birthPlace?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu' | 'Lainnya' | null;
  ktpFile?: string | null;
  inactiveNote?: string | null;
  isActive: boolean;
  _action: 'keep' | 'create' | 'update' | 'delete';
}

export interface DraftFamilyData {
  familyNumber: string;
  kkFile?: string | null;
  members: DraftMemberItem[];
}

export interface FamilyChangeRequestRecord {
  id: number;
  familyId: number;
  headUserId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejectionNote: string | null;
  familyNumber: string | null;
  kkFile: string | null;
  draftData: DraftFamilyData;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListFamilyChangeRequestsOptions {
  limit?: number;
  offset?: number;
  query?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
}

// ==========================================
// READ QUERIES
// ==========================================

/**
 * Ambil permohonan perubahan data KK yang sedang aktif (draft, pending, atau rejected).
 */
export async function getActiveChangeRequest(familyId: number): Promise<FamilyChangeRequestRecord | null> {
  const [request] = await db
    .select()
    .from(schema.familyChangeRequests)
    .where(
      and(
        eq(schema.familyChangeRequests.familyId, familyId),
        inArray(schema.familyChangeRequests.status, ['draft', 'pending', 'rejected'])
      )
    )
    .orderBy(desc(schema.familyChangeRequests.createdAt))
    .limit(1);

  if (!request) return null;

  return {
    ...request,
    draftData: request.draftData as DraftFamilyData,
  };
}

/**
 * Ambil permohonan perubahan data KK berdasarkan ID request.
 */
export async function getChangeRequestById(requestId: number): Promise<FamilyChangeRequestRecord | null> {
  const [request] = await db
    .select()
    .from(schema.familyChangeRequests)
    .where(eq(schema.familyChangeRequests.id, requestId))
    .limit(1);

  if (!request) return null;

  return {
    ...request,
    draftData: request.draftData as DraftFamilyData,
  };
}

/**
 * Daftar permohonan perubahan data KK dengan filter dan pencarian.
 */
export async function listFamilyChangeRequests(options: ListFamilyChangeRequestsOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.status) {
    conditions.push(eq(schema.familyChangeRequests.status, options.status));
  }
  if (options.query) {
    const v = options.query.trim();
    const vHash = hashPII(v);
    // Pencarian berdasarkan nama Kepala Keluarga (LIKE) ATAU Nomor KK exact match (Blind Index Hash)
    conditions.push(
      or(
        like(schema.users.name, `%${v}%`),
        eq(schema.families.familyNumberHash, vHash)
      )
    );
  }


  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: schema.familyChangeRequests.id,
      familyId: schema.familyChangeRequests.familyId,
      headUserId: schema.familyChangeRequests.headUserId,
      headName: schema.users.name,
      familyNumber: sql<string>`COALESCE(${schema.familyChangeRequests.familyNumber}, ${schema.families.familyNumber})`.mapWith(String),
      kkFile: sql<string | null>`COALESCE(${schema.familyChangeRequests.kkFile}, ${schema.families.kkFile})`,
      status: schema.familyChangeRequests.status,
      rejectionNote: schema.familyChangeRequests.rejectionNote,
      draftData: schema.familyChangeRequests.draftData,
      submittedAt: schema.familyChangeRequests.submittedAt,
      reviewedAt: schema.familyChangeRequests.reviewedAt,
      createdAt: schema.familyChangeRequests.createdAt,
      updatedAt: schema.familyChangeRequests.updatedAt,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      dwellingType: schema.dwellings.type,
      checkInDate: schema.familyChangeRequests.submittedAt,
    })
    .from(schema.familyChangeRequests)
    .innerJoin(schema.families, eq(schema.familyChangeRequests.familyId, schema.families.id))
    .leftJoin(schema.users, eq(schema.familyChangeRequests.headUserId, schema.users.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.familyChangeRequests.createdAt));

  const formattedData = data.map((item) => {
    const parsedDraft = item.draftData as DraftFamilyData;
    const activeDraftMembers = parsedDraft?.members ? parsedDraft.members.filter((m) => m.isActive && m._action !== 'delete') : [];
    return {
      ...item,
      familyNumber: decryptPII(item.familyNumber),
      draftData: parsedDraft,
      memberCount: activeDraftMembers.length,
    };
  });

  return {
    data: formattedData,
  };
}

// ==========================================
// WRITE QUERIES (DRAFT LIFECYCLE)
// ==========================================

/**
 * Inisialisasi atau ambil draft change request untuk keluarga ini.
 * Mengkloning snapshot data live ke draftData jika belum ada.
 */
export async function createOrGetDraftChangeRequest(familyId: number, userId: string): Promise<FamilyChangeRequestRecord> {
  const active = await getActiveChangeRequest(familyId);
  if (active) {
    if (active.status === 'pending') {
      throw new Error('PENDING_EXISTS');
    }
    return active;
  }

  const liveFamily = await getFamilyById(familyId);
  if (!liveFamily) throw new Error('NOT_FOUND');
  if (liveFamily.headUserId !== userId) throw new Error('FORBIDDEN');
  if (liveFamily.verificationStatus !== 'verified') throw new Error('INVALID_FAMILY_STATUS');

  const draftMembers: DraftMemberItem[] = (liveFamily.members || []).map((m: any) => ({
    id: m.id,
    userId: m.userId ?? null,
    name: m.name,
    nik: m.nik,
    gender: m.gender,
    relationship: m.relationship,
    birthPlace: m.birthPlace ?? null,
    birthDate: m.birthDate ? (m.birthDate instanceof Date ? m.birthDate.toISOString().split("T")[0] : String(m.birthDate)) : null,
    phone: m.phone ?? null,
    occupation: m.occupation ?? null,
    educationLevel: m.educationLevel ?? null,
    religion: m.religion ?? null,
    ktpFile: m.ktpFile ?? null,
    inactiveNote: m.inactiveNote ?? null,
    isActive: Boolean(m.isActive),
    _action: 'keep',
  }));

  const draftData: DraftFamilyData = {
    familyNumber: liveFamily.familyNumber,
    kkFile: liveFamily.kkFile ?? null,
    members: draftMembers,
  };

  const [inserted] = await db.insert(schema.familyChangeRequests).values({
    familyId,
    headUserId: userId,
    status: 'draft',
    familyNumber: liveFamily.familyNumber,
    kkFile: liveFamily.kkFile ?? null,
    draftData,
  });

  const created = await getChangeRequestById(inserted.insertId);
  if (!created) throw new Error('FAILED_TO_CREATE_DRAFT');
  return created;
}

/**
 * Perbarui isi draftData pada permohonan perubahan yang sedang berlangsung.
 */
export async function updateDraftChangeRequest(
  requestId: number,
  userId: string,
  payload: {
    familyNumber?: string;
    kkFile?: string | null;
    members: DraftMemberItem[];
  }
) {
  const req = await getChangeRequestById(requestId);
  if (!req) throw new Error('NOT_FOUND');
  if (req.headUserId !== userId) throw new Error('FORBIDDEN');
  if (req.status !== 'draft' && req.status !== 'rejected') throw new Error('INVALID_STATUS');

  // Check NIK uniqueness for members in payload
  for (const member of payload.members) {
    if (member._action === 'create' || member._action === 'update') {
      const existingMember = await getFamilyMemberByNik(member.nik);
      if (existingMember) {
        if (member._action === 'update' && member.id && existingMember.id === member.id) {
          continue;
        }
        throw new Error(`NIK_EXISTS:${member.nik}:${existingMember.name}`);
      }
    }
  }

  const liveFamily = await getFamilyById(req.familyId);
  const filesToDelete: string[] = [];

  // Check if draft KK file is overwritten
  if (liveFamily) {
    if (payload.kkFile !== undefined && req.kkFile && payload.kkFile !== req.kkFile && req.kkFile !== liveFamily.kkFile) {
      filesToDelete.push(req.kkFile);
    }
  }

  // Check if draft KTP files are overwritten
  if (req.draftData.members) {
    for (const oldDraftMember of req.draftData.members) {
      const newDraftMember = payload.members.find(m => {
        if (oldDraftMember.id && m.id) return oldDraftMember.id === m.id;
        if (oldDraftMember.tempId && m.tempId) return oldDraftMember.tempId === m.tempId;
        return false;
      });

      if (newDraftMember) {
        if (oldDraftMember.ktpFile && newDraftMember.ktpFile !== oldDraftMember.ktpFile) {
          let isLiveKtp = false;
          if (liveFamily && liveFamily.members && oldDraftMember.id) {
            const liveMember = liveFamily.members.find(m => m.id === oldDraftMember.id);
            if (liveMember && liveMember.ktpFile === oldDraftMember.ktpFile) {
              isLiveKtp = true;
            }
          }
          if (!isLiveKtp) {
            filesToDelete.push(oldDraftMember.ktpFile);
          }
        }
      } else {
        // Member removed from draft
        if (oldDraftMember.ktpFile) {
          let isLiveKtp = false;
          if (liveFamily && liveFamily.members && oldDraftMember.id) {
            const liveMember = liveFamily.members.find(m => m.id === oldDraftMember.id);
            if (liveMember && liveMember.ktpFile === oldDraftMember.ktpFile) {
              isLiveKtp = true;
            }
          }
          if (!isLiveKtp) {
            filesToDelete.push(oldDraftMember.ktpFile);
          }
        }
      }
    }
  }

  const draftData: DraftFamilyData = {
    familyNumber: payload.familyNumber ?? req.familyNumber ?? '',
    kkFile: payload.kkFile !== undefined ? payload.kkFile : req.kkFile,
    members: payload.members,
  };

  await db
    .update(schema.familyChangeRequests)
    .set({
      familyNumber: payload.familyNumber ?? req.familyNumber,
      kkFile: payload.kkFile !== undefined ? payload.kkFile : req.kkFile,
      draftData,
      updatedAt: new Date(),
    })
    .where(eq(schema.familyChangeRequests.id, requestId));

  // Async cleanup
  for (const url of filesToDelete) {
    deleteCloudinaryFileByUrl(url).catch((err) =>
      console.error('[Cloudinary Cleanup] Gagal menghapus berkas draf lama:', err)
    );
  }

  return true;
}

/**
 * Ajukan / Kirim draft perubahan ke RT (status -> pending).
 */
export async function submitChangeRequest(requestId: number, userId: string) {
  const req = await getChangeRequestById(requestId);
  if (!req) throw new Error('NOT_FOUND');
  if (req.headUserId !== userId) throw new Error('FORBIDDEN');
  if (req.status !== 'draft' && req.status !== 'rejected') throw new Error('INVALID_STATUS');

  if (!req.kkFile && !req.draftData.kkFile) {
    throw new Error('NO_KK_FILE');
  }

  const activeMembers = req.draftData.members.filter(
    (m) => m.isActive && m._action !== 'delete'
  );
  if (activeMembers.length === 0) {
    throw new Error('NO_ACTIVE_MEMBERS');
  }

  await db
    .update(schema.familyChangeRequests)
    .set({
      status: 'pending',
      rejectionNote: null,
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.familyChangeRequests.id, requestId));

  return true;
}

/**
 * Batalkan permohonan perubahan (status -> cancelled).
 */
export async function cancelChangeRequest(requestId: number, userId: string) {
  const req = await getChangeRequestById(requestId);
  if (!req) throw new Error('NOT_FOUND');
  if (req.headUserId !== userId) throw new Error('FORBIDDEN');
  if (req.status !== 'draft' && req.status !== 'pending' && req.status !== 'rejected') {
    throw new Error('INVALID_STATUS');
  }

  const liveFamily = await getFamilyById(req.familyId);
  const filesToDelete: string[] = [];

  // Draft KK file
  if (req.kkFile && liveFamily && req.kkFile !== liveFamily.kkFile) {
    filesToDelete.push(req.kkFile);
  }

  // Draft KTP files
  if (req.draftData.members) {
    for (const member of req.draftData.members) {
      if (member.ktpFile) {
        let isLiveKtp = false;
        if (liveFamily && liveFamily.members && member.id) {
          const liveMember = liveFamily.members.find(m => m.id === member.id);
          if (liveMember && liveMember.ktpFile === member.ktpFile) {
            isLiveKtp = true;
          }
        }
        if (!isLiveKtp) {
          filesToDelete.push(member.ktpFile);
        }
      }
    }
  }

  await db
    .update(schema.familyChangeRequests)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(schema.familyChangeRequests.id, requestId));

  // Async cleanup
  for (const url of filesToDelete) {
    deleteCloudinaryFileByUrl(url).catch((err) =>
      console.error('[Cloudinary Cleanup] Gagal menghapus berkas draf saat dibatalkan:', err)
    );
  }

  return true;
}

/**
 * Setujui permohonan perubahan oleh RT (Merge atomik ke live table families & family_members).
 */
export async function approveChangeRequest(requestId: number, reviewerUserId: string) {
  const req = await getChangeRequestById(requestId);
  if (!req) throw new Error('NOT_FOUND');
  if (req.status !== 'pending') throw new Error('INVALID_STATUS');

  const liveFamily = await getFamilyById(req.familyId);
  const oldKkFile = (liveFamily && req.kkFile && liveFamily.kkFile && req.kkFile !== liveFamily.kkFile) ? liveFamily.kkFile : null;
  const oldKtpFiles: string[] = [];

  if (liveFamily && liveFamily.members && req.draftData.members) {
    for (const draftMember of req.draftData.members) {
      if (draftMember._action === 'update' && draftMember.id) {
        const liveMember = liveFamily.members.find(m => m.id === draftMember.id);
        if (liveMember && draftMember.ktpFile && liveMember.ktpFile && draftMember.ktpFile !== liveMember.ktpFile) {
          oldKtpFiles.push(liveMember.ktpFile);
        }
      }
    }
  }

  const result = await db.transaction(async (tx) => {
    // 1. Terapkan pembaruan data KK
    const familyUpdates: Partial<typeof schema.families.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (req.familyNumber) familyUpdates.familyNumber = req.familyNumber;
    if (req.kkFile) familyUpdates.kkFile = req.kkFile;

    await tx
      .update(schema.families)
      .set(familyUpdates)
      .where(eq(schema.families.id, req.familyId));

    // 2. Terapkan perubahan pada tiap anggota keluarga
    for (const member of req.draftData.members) {
      if (member._action === 'create') {
        await tx.insert(schema.familyMembers).values({
          familyId: req.familyId,
          userId: member.userId ?? null,
          name: member.name,
          nik: member.nik,
          gender: member.gender,
          relationship: member.relationship,
          birthPlace: member.birthPlace ?? null,
          birthDate: member.birthDate ? new Date(member.birthDate) : null,
          phone: member.phone ?? null,
          occupation: member.occupation ?? null,
          educationLevel: member.educationLevel ?? null,
          religion: member.religion ?? null,
          ktpFile: member.ktpFile ?? null,
          inactiveNote: member.inactiveNote ?? null,
          isActive: member.isActive,
        });
      } else if (member._action === 'update' && member.id) {
        await tx
          .update(schema.familyMembers)
          .set({
            name: member.name,
            nik: member.nik,
            gender: member.gender,
            relationship: member.relationship,
            birthPlace: member.birthPlace ?? null,
            birthDate: member.birthDate ? new Date(member.birthDate) : null,
            phone: member.phone ?? null,
            occupation: member.occupation ?? null,
            educationLevel: member.educationLevel ?? null,
            religion: member.religion ?? null,
            ktpFile: member.ktpFile ?? null,
            inactiveNote: member.inactiveNote ?? null,
            isActive: member.isActive,
            updatedAt: new Date(),
          })
          .where(eq(schema.familyMembers.id, member.id));
      } else if (member._action === 'delete' && member.id) {
        await tx
          .update(schema.familyMembers)
          .set({
            isActive: false,
            inactiveNote: member.inactiveNote ?? 'Dinonaktifkan oleh Kepala Keluarga',
            updatedAt: new Date(),
          })
          .where(eq(schema.familyMembers.id, member.id));
      }
    }

    // 3. Update status change request menjadi 'approved'
    await tx
      .update(schema.familyChangeRequests)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
        updatedAt: new Date(),
      })
      .where(eq(schema.familyChangeRequests.id, requestId));

    // 4. Notifikasi ke Kepala Keluarga
    if (req.headUserId) {
      await notifyUser(req.headUserId, {
        title: 'Perubahan Data KK Disetujui',
        message: 'Permohonan perubahan data Kartu Keluarga Anda telah disetujui oleh Pengurus RT.',
        category: 'dinas',
        redirectLink: '/dashboard/family',
      }).catch((err) => console.error('Gagal kirim notifikasi approve change request:', err));
    }

    return true;
  });

  if (result) {
    // Async cleanup
    if (oldKkFile) {
      deleteCloudinaryFileByUrl(oldKkFile).catch((err) =>
        console.error('[Cloudinary Cleanup] Gagal menghapus KK lama:', err)
      );
    }
    for (const oldKtp of oldKtpFiles) {
      deleteCloudinaryFileByUrl(oldKtp).catch((err) =>
        console.error('[Cloudinary Cleanup] Gagal menghapus KTP lama:', err)
      );
    }
  }

  return result;
}

/**
 * Tolak permohonan perubahan oleh RT (Data live tetap utuh pada versi lama).
 */
export async function rejectChangeRequest(requestId: number, reviewerUserId: string, rejectionNote: string) {
  const req = await getChangeRequestById(requestId);
  if (!req) throw new Error('NOT_FOUND');
  if (req.status !== 'pending') throw new Error('INVALID_STATUS');

  await db
    .update(schema.familyChangeRequests)
    .set({
      status: 'rejected',
      rejectionNote: rejectionNote || 'Permohonan perubahan data ditolak oleh Pengurus RT.',
      reviewedAt: new Date(),
      reviewedByUserId: reviewerUserId,
      updatedAt: new Date(),
    })
    .where(eq(schema.familyChangeRequests.id, requestId));

  // Notifikasi ke Kepala Keluarga
  if (req.headUserId) {
    await notifyUser(req.headUserId, {
      title: 'Perubahan Data KK Ditolak',
      message: rejectionNote
        ? `Permohonan perubahan data KK ditolak oleh RT: ${rejectionNote}`
        : 'Permohonan perubahan data Kartu Keluarga Anda ditolak oleh Pengurus RT.',
      category: 'dinas',
      redirectLink: '/dashboard/family',
    }).catch((err) => console.error('Gagal kirim notifikasi reject change request:', err));
  }

  return true;
}
