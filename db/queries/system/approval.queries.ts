import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { sendEmail } from '@/lib/mail';
import {
  getWargaApprovalEmail,
  getKoordinatorApprovalEmail,
  getRegistrationRejectionEmail,
} from '@/lib/emails/templates';
import { notifyUser } from '@/lib/notifications';

// ==========================================
// APPROVALS QUERIES (Dibangun Ulang untuk Skema Baru)
// ==========================================

/**
 * Mengambil daftar pendaftaran akun yang berstatus pending.
 * Menggunakan user_roles untuk menentukan role (bukan users.roleId yang sudah dihapus).
 */
export async function listPendingRegistrations() {
  // Ambil semua user pending
  const pendingUsers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.status, 'pending'))
    .orderBy(desc(schema.users.createdAt));

  if (pendingUsers.length === 0) return [];

  const userIds = pendingUsers.map((u) => u.id);

  // Ambil primary roles untuk semua user pending
  const primaryRoles = await db
    .select({
      userId: schema.userRoles.userId,
      roleId: schema.userRoles.roleId,
      roleName: schema.roles.name,
      roleSlug: schema.roles.slug,
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(and(inArray(schema.userRoles.userId, userIds), eq(schema.userRoles.isPrimary, true)));

  const roleMap = new Map(primaryRoles.map((r) => [r.userId, r]));

  // Ambil data dwelling dari keluarga yang terhubung
  const linkedFamilies = await db
    .select({
      headUserId: schema.families.headUserId,
      familyNumber: schema.families.familyNumber,
      dwellingId: schema.families.dwellingId,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
    })
    .from(schema.families)
    .innerJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(inArray(schema.families.headUserId, userIds));

  const familyMap = new Map(linkedFamilies.map((f) => [f.headUserId, f]));

  // Ambil data NIK dari family_members
  const linkedMembers = await db
    .select({
      userId: schema.familyMembers.userId,
      nik: schema.familyMembers.nik,
    })
    .from(schema.familyMembers)
    .where(inArray(schema.familyMembers.userId, userIds));

  const memberMap = new Map(linkedMembers.map((m) => [m.userId, m]));

  return pendingUsers
    .map((user) => {
      const role = roleMap.get(user.id);
      const family = familyMap.get(user.id);

      // Hanya tampilkan user dengan role warga (6) atau koordinator (5)
      if (!role || ![5, 6].includes(role.roleId)) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleId: role.roleId,
        roleName: role.roleName,
        roleSlug: role.roleSlug,
        nik: memberMap.get(user.id)?.nik ?? null,
        familyNumber: family?.familyNumber ?? null,
        dwellingId: family?.dwellingId ?? null,
        blockNumber: family?.blockNumber ?? null,
        houseNumber: family?.houseNumber ?? null,
        createdAt: user.createdAt,
      };
    })
    .filter(Boolean);
}

/**
 * Proses persetujuan atau penolakan registrasi akun.
 * Menggunakan user_roles, families, familyMembers (bukan users.roleId, users.nik, schema.residents).
 */
export async function processRegistrationApproval(
  userId: string,
  action: 'approve' | 'reject',
  rejectReason?: string,
  requestOrigin?: string
) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.status !== 'pending') throw new Error('NOT_PENDING');

  // Ambil primary role
  const [primaryRole] = await db
    .select({ roleId: schema.userRoles.roleId })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.isPrimary, true)))
    .limit(1);

  const roleId = primaryRole?.roleId ?? null;

  if (action === 'approve') {
    await db.transaction(async (tx) => {
      await tx.update(schema.users).set({ status: 'active', updatedAt: new Date() }).where(eq(schema.users.id, userId));
      // Kita biarkan verificationStatus KK tetap 'draft' agar warga mengisi datanya sendiri nanti.
    });

    const origin = requestOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    if (roleId === 5) {
      try {
        await sendEmail({
          to: { email: user.email, name: user.name },
          subject: 'Akun Koordinator Kost Anda Telah Aktif',
          htmlContent: getKoordinatorApprovalEmail(user.name, `${origin}/login`),
        });
      } catch (err) {
        console.error('Gagal mengirim email aktivasi koordinator:', err);
      }
    } else if (roleId === 6) {
      try {
        await sendEmail({
          to: { email: user.email, name: user.name },
          subject: 'Akun Wargaku Anda Telah Aktif',
          htmlContent: getWargaApprovalEmail(user.name, `${origin}/login`),
        });
      } catch (err) {
        console.error('Gagal mengirim email aktivasi warga:', err);
      }
    }

    try {
      await notifyUser(userId, {
        title: 'Akun Telah Disetujui',
        message: 'Pendaftaran akun Anda telah disetujui oleh Pengurus RT. Selamat datang di sistem Wargaku!',
        category: 'personal',
        redirectLink: '/dashboard',
      });
    } catch (err) {
      console.error('Gagal kirim notifikasi in-app:', err);
    }
  } else {
    // Reject: kirim email lalu hapus akun
    try {
      await sendEmail({
        to: { email: user.email, name: user.name },
        subject: 'Pendaftaran Akun Wargaku Ditolak',
        htmlContent: getRegistrationRejectionEmail(user.name, rejectReason ?? ''),
      });
    } catch (err) {
      console.error('Gagal mengirim email penolakan registrasi:', err);
    }

    await db.transaction(async (tx) => {
      // Kembalikan koordinator properti ke pemilik
      if (roleId === 5) {
        const propertiesToRestore = await tx
          .select({
            id: schema.rentalProperties.id,
            ownerUserId: schema.dwellings.ownerUserId,
          })
          .from(schema.rentalProperties)
          .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
          .where(eq(schema.rentalProperties.coordinatorUserId, userId));

        for (const p of propertiesToRestore) {
          if (p.ownerUserId) {
            await tx.update(schema.rentalProperties).set({ coordinatorUserId: p.ownerUserId }).where(eq(schema.rentalProperties.id, p.id));
          }
        }
      }

      // Hapus data kependudukan draft jika pendaftar adalah warga
      if (roleId === 6) {
        await tx
          .delete(schema.families)
          .where(
            and(
              eq(schema.families.headUserId, userId),
              eq(schema.families.verificationStatus, 'draft')
            )
          );
      }

      await tx.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
      await tx.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
      await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));
      await tx.delete(schema.users).where(eq(schema.users.id, userId));
    });
  }
}
