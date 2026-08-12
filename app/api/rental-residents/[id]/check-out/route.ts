import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkOutTenant, getTenantContractById } from '@/db/queries/property/tenant.queries';
import { getRentalPropertyById } from '@/db/queries/property/rental-property.queries';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

/**
 * @openapi
 * /api/rental-residents/{id}/check-out:
 *   post:
 *     summary: Proses Check-Out Penghuni Kos/Kontrakan
 *     description: Mengakhiri masa sewa penghuni pada properti. Mengubah status isActive menjadi false dan mencatat checkOutDate.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Penyewa berhasil diajukan check-out
 *       400:
 *         description: Penyewa sudah check-out atau tanggal check-out tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kontrak sewa tidak ditemukan
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
    const contractId = Number(id);

    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const contract = await getTenantContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    if (!contract.isActive) {
      return NextResponse.json({ error: 'Penyewa ini sudah berstatus keluar (check-out).' }, { status: 400 });
    }

    // Otorisasi Akses
    const property = await getRentalPropertyById(contract.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti kos tidak ditemukan' }, { status: 404 });
    }

    const isCoordinator = session.user.id === property.coordinatorUserId;
    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAdmin = await hasPermission(effectiveRoleId, 'manage-residents') || await hasPermission(effectiveRoleId, 'manage-boarding');
    
    if (!isCoordinator && !isAdmin) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak berhak melakukan operasi ini.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const checkOutDate = body.checkOutDate ? new Date(body.checkOutDate) : new Date();

    if (contract.checkInDate) {
      const contractCheckIn = new Date(contract.checkInDate);
      contractCheckIn.setHours(0, 0, 0, 0);
      
      const requestedCheckOut = new Date(checkOutDate);
      requestedCheckOut.setHours(0, 0, 0, 0);

      if (requestedCheckOut < contractCheckIn) {
        return NextResponse.json({ error: 'Tanggal keluar tidak boleh sebelum tanggal check-in' }, { status: 400 });
      }
    }

    await checkOutTenant(contractId, {
      checkOutDate,
      notes: body.notes || null,
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'CHECKOUT_TENANT',
      module: 'sewa',
      description: `Check-out penghuni kontrak ID #${contractId} pada tanggal ${checkOutDate.toISOString().split('T')[0]}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: 'Penyewa berhasil diajukan check-out' });
  } catch (error: any) {
    console.error('Error in POST /api/rental-residents/[id]/check-out:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
