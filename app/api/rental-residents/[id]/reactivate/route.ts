import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalResidentById, getRentalPropertyById } from '@/db/queries/rental';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/rental-residents/{id}/reactivate:
 *   post:
 *     summary: Mengaktifkan kembali (reactivate) penyewa sewa yang nonaktif (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Penghuni Sewa
 *     responses:
 *       200:
 *         description: Penyewa berhasil diaktifkan kembali
 *       400:
 *         description: ID tidak valid atau penyewa sudah aktif
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke data penghuni ini
 *       404:
 *         description: Penghuni atau properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (resident.isActive) {
      return NextResponse.json({ error: 'Penyewa sudah dalam status aktif' }, { status: 400 });
    }

    if (!resident.rentalPropertyId) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Check write authorization: RT/Admin (manage-boarding) or direct coordinator
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator) {
      return NextResponse.json(
        { error: 'Hanya pengelola (koordinator) atau pengurus RT yang dapat mengaktifkan kembali penyewa' },
        { status: 403 }
      );
    }

    await db.transaction(async (tx) => {
      // 1. Reactivate rental resident record in residents table
      await tx
        .update(schema.residents)
        .set({
          isActive: true,
          checkOutDate: null,
          inactiveReason: null,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.residents.id, residentId));

      // 2. Cascade reactivate family, family members, and head user if family tenant
      if (resident.tenantType === 'keluarga' && resident.familyId) {
        const [family] = await tx
          .select()
          .from(schema.families)
          .where(eq(schema.families.id, resident.familyId));

        if (family) {
          await tx
            .update(schema.families)
            .set({
              isActive: true,
              checkOutDate: null,
              updatedAt: new Date(),
            })
            .where(eq(schema.families.id, resident.familyId));

          await tx
            .update(schema.residents)
            .set({
              isActive: true,
              inactiveReason: null,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(schema.residents.familyId, resident.familyId),
                eq(schema.residents.residentType, 'warga_tetap')
              )
            );

          if (family.headUserId) {
            await tx
              .update(schema.users)
              .set({
                status: 'active',
                dwellingId: resident.dwellingId,
                unitNumber: resident.roomNumber || null,
                updatedAt: new Date(),
              })
              .where(eq(schema.users.id, family.headUserId));
          }
        }
      }
    });

    return NextResponse.json({ message: 'Penyewa berhasil diaktifkan kembali' });
  } catch (error: any) {
    console.error('Error in POST /api/rental-residents/[id]/reactivate:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
