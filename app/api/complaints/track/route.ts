import { NextResponse } from 'next/server';
import { getComplaintByTrackingCode } from '@/db/queries/complaints';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim();

    if (!code) {
      return NextResponse.json({ error: 'Kode tracking wajib diisi' }, { status: 400 });
    }

    const complaint = await getComplaintByTrackingCode(code);

    if (!complaint) {
      return NextResponse.json(
        { error: 'Laporan pengaduan dengan kode tracking tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: complaint,
    });
  } catch (error: any) {
    console.error('Error in GET /api/complaints/track:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
