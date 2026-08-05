import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkOutTenant, getTenantContractById } from '@/db/queries/property/tenant.queries';

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

    const body = await request.json().catch(() => ({}));
    const checkOutDate = body.checkOutDate ? new Date(body.checkOutDate) : new Date();

    await checkOutTenant(contractId, {
      checkOutDate,
      notes: body.notes || null,
    });

    return NextResponse.json({ message: 'Penyewa berhasil diajukan check-out' });
  } catch (error: any) {
    console.error('Error in POST /api/rental-residents/[id]/check-out:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
