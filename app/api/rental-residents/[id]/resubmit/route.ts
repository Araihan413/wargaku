import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getTenantContractById, updateTenantContract } from '@/db/queries/property/tenant.queries';

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

    const existingContract = await getTenantContractById(contractId);
    
    if (!existingContract) {
      return NextResponse.json({ error: 'Data penyewa tidak ditemukan' }, { status: 404 });
    }

    if (existingContract.verificationStatus !== 'rejected') {
      return NextResponse.json({ error: 'Hanya data yang ditolak yang bisa dikirim ulang' }, { status: 400 });
    }

    await updateTenantContract(contractId, {
      verificationStatus: 'pending',
      verificationNote: null,
    });

    return NextResponse.json({ message: 'Verifikasi berhasil diajukan ulang ke RT' });
  } catch (error: any) {
    console.error('Error in POST /api/rental-residents/[id]/resubmit:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
