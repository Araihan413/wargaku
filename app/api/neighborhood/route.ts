import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';

const censorNik = (nik: string | null) => {
  if (!nik) return '-';
  if (nik.length <= 6) return nik;
  return `${nik.slice(0, 3)}${'*'.repeat(nik.length - 6)}${nik.slice(-3)}`;
};

const censorPhone = (phone: string | null) => {
  if (!phone) return '-';
  if (phone.length <= 5) return phone;
  return `${phone.slice(0, 4)}${'*'.repeat(phone.length - 7)}${phone.slice(-3)}`;
};

export async function GET() {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    // 2. Check if officer (view-residents permission)
    const isOfficer = await hasPermission(session.user.roleId, 'view-residents');

    // 3. Fetch all active dwellings
    const allDwellings = await db
      .select()
      .from(schema.dwellings)
      .where(eq(schema.dwellings.isActive, true));

    // 4. Fetch all active families
    const allFamilies = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.isActive, true));

    // 5. Fetch all active family members
    const allMembers = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true));

    // 6. Fetch all active rental properties
    const allRentalProperties = await db
      .select()
      .from(schema.rentalProperties)
      .where(eq(schema.rentalProperties.isActive, true));

    // 7. Fetch all active rental residents
    const allRentalResidents = await db
      .select()
      .from(schema.rentalResidents)
      .where(
        and(
          eq(schema.rentalResidents.isActive, true),
          eq(schema.rentalResidents.verificationStatus, 'verified')
        )
      );

    // 8. Map data in-memory
    const results = allDwellings.map((dwelling) => {
      // Find families in this dwelling
      const dwellingFamilies = allFamilies
        .filter((f) => f.dwellingId === dwelling.id)
        .map((family) => {
          // Find members in this family
          const familyMembers = allMembers
            .filter((m) => m.familyId === family.id)
            .map((member) => ({
              id: member.id,
              name: member.name,
              nik: isOfficer ? member.nik : censorNik(member.nik),
              gender: member.gender,
              relationship: member.relationship,
              occupation: member.occupation,
              educationLevel: member.educationLevel,
              phone: isOfficer ? member.phone : censorPhone(member.phone),
            }));

          return {
            id: family.id,
            familyNumber: isOfficer ? family.familyNumber : `${family.familyNumber.slice(0, 4)}${'*'.repeat(family.familyNumber.length - 8)}${family.familyNumber.slice(-4)}`,
            headName: family.headName,
            unitNumber: family.unitNumber,
            verificationStatus: family.verificationStatus,
            members: familyMembers,
          };
        });

      // Find rental properties in this dwelling
      const dwellingRentals = allRentalProperties
        .filter((rp) => rp.dwellingId === dwelling.id)
        .map((property) => {
          // Find residents in this property
          const propertyResidents = allRentalResidents
            .filter((rr) => rr.rentalPropertyId === property.id)
            .map((resident) => ({
              id: resident.id,
              name: resident.name,
              nik: isOfficer ? resident.nik : censorNik(resident.nik),
              phone: isOfficer ? resident.phone : censorPhone(resident.phone),
              originAddress: resident.originAddress,
              occupation: resident.occupation,
              educationLevel: resident.educationLevel,
              roomNumber: resident.roomNumber,
              tenantType: resident.tenantType,
              checkInDate: resident.checkInDate,
            }));

          return {
            id: property.id,
            name: property.name,
            contactPerson: property.contactPerson,
            phone: isOfficer ? property.phone : censorPhone(property.phone),
            totalRooms: property.totalRooms,
            residents: propertyResidents,
          };
        });

      return {
        id: dwelling.id,
        blockNumber: dwelling.blockNumber,
        houseNumber: dwelling.houseNumber,
        type: dwelling.type,
        notes: dwelling.notes,
        latitude: dwelling.latitude,
        longitude: dwelling.longitude,
        families: dwellingFamilies,
        rentalProperties: dwellingRentals,
      };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in GET /api/neighborhood:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
