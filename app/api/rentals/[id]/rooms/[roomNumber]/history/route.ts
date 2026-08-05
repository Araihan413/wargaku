import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getRoomContractHistory } from '@/db/queries/property/tenant.queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; roomNumber: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { id, roomNumber } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const history = await getRoomContractHistory(propertyId, decodeURIComponent(roomNumber));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]/rooms/[roomNumber]/history:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
