import { db } from "../db";
import * as schema from "../db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  console.log("🚀 Starting Data Backfill to 'residents' table...");

  // 1. Fetch all family_members
  const existingFamilyMembers = await db.select().from(schema.familyMembers);
  console.log(`Found ${existingFamilyMembers.length} records in family_members.`);

  let insertedWargaCount = 0;
  for (const fm of existingFamilyMembers) {
    const [existing] = await db
      .select({ id: schema.residents.id })
      .from(schema.residents)
      .where(eq(schema.residents.nik, fm.nik))
      .limit(1);

    if (!existing) {
      let dwellingId: number | null = null;
      if (fm.familyId) {
        const [family] = await db
          .select({ dwellingId: schema.families.dwellingId })
          .from(schema.families)
          .where(eq(schema.families.id, fm.familyId))
          .limit(1);
        if (family) dwellingId = family.dwellingId;
      }

      await db.insert(schema.residents).values({
        familyId: fm.familyId,
        dwellingId: dwellingId,
        residentType: "warga_tetap",
        relationship: fm.relationship as any,
        name: fm.name,
        nik: fm.nik,
        gender: fm.gender,
        birthPlace: fm.birthPlace,
        birthDate: fm.birthDate ? (fm.birthDate as any) : null,
        phone: fm.phone,
        occupation: fm.occupation,
        educationLevel: fm.educationLevel,
        religion: fm.religion as any,
        ktpFile: fm.ktpFile,
        verificationStatus: "verified",
        isActive: fm.isActive,
        inactiveReason: fm.inactiveReason as any,
        createdAt: fm.createdAt ? new Date(fm.createdAt) : new Date(),
        updatedAt: fm.updatedAt ? new Date(fm.updatedAt) : new Date(),
      });
      insertedWargaCount++;
    }
  }
  console.log(`✅ Backfilled ${insertedWargaCount} warga_tetap into residents.`);

  // 2. Fetch all rental_residents
  const existingRentalResidents = await db.select().from(schema.rentalResidents);
  console.log(`Found ${existingRentalResidents.length} records in rental_residents.`);

  let insertedRentalCount = 0;
  for (const rr of existingRentalResidents) {
    const [existing] = await db
      .select({ id: schema.residents.id })
      .from(schema.residents)
      .where(eq(schema.residents.nik, rr.nik))
      .limit(1);

    if (!existing) {
      const residentType = rr.tenantType === "keluarga" ? "sewa_keluarga" : "sewa_perorangan";

      await db.insert(schema.residents).values({
        rentalPropertyId: rr.rentalPropertyId,
        familyId: rr.familyId,
        roomNumber: rr.roomNumber,
        residentType: residentType,
        relationship: rr.tenantType === "keluarga" ? "Kepala_Keluarga" : null,
        name: rr.name,
        nik: rr.nik,
        gender: "L",
        phone: rr.phone,
        originAddress: rr.originAddress,
        occupation: rr.occupation,
        educationLevel: rr.educationLevel,
        religion: rr.religion as any,
        ktpFile: rr.ktpFile,
        verificationStatus: rr.verificationStatus as any,
        verificationNote: rr.verificationNote,
        checkInDate: rr.checkInDate ? (rr.checkInDate as any) : null,
        checkOutDate: rr.checkOutDate ? (rr.checkOutDate as any) : null,
        isActive: rr.isActive,
        inactiveReason: rr.inactiveReason as any,
        notes: rr.notes,
        createdBy: rr.createdBy,
        updatedBy: rr.updatedBy,
        createdAt: rr.createdAt ? new Date(rr.createdAt) : new Date(),
        updatedAt: rr.updatedAt ? new Date(rr.updatedAt) : new Date(),
      });
      insertedRentalCount++;
    }
  }
  console.log(`✅ Backfilled ${insertedRentalCount} rental residents into residents.`);

  const totalResidents = await db.select({ count: sql<number>`count(*)` }).from(schema.residents);
  console.log(`🎉 Total records in 'residents' table:`, totalResidents[0]?.count || 0);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error running backfill script:", err);
  process.exit(1);
});
