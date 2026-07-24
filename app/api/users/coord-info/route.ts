import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // Find the pending coordinator user by ID
    const [user] = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.id, id),
          eq(schema.users.roleId, 5), // Koordinator Kost
          isNull(schema.users.password) // Password still empty
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Calon koordinator tidak ditemukan atau sudah terregistrasi' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
    });
  } catch (error: any) {
    console.error('Error in GET /api/users/coord-info:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
