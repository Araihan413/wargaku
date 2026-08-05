import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, like, gte, lte, inArray, desc } from "drizzle-orm";

export interface CitizenFilterOptions {
  searchQuery?: string;
  minAge?: number;
  maxAge?: number;
  gender?: "L" | "P" | "";
  relationships?: string[];
  religion?: string;
  occupation?: string;
  dwellingType?: string;
  blockNumber?: string;
  feeStatus?: "paid" | "unpaid" | "partially_paid" | "all" | "";
  limit?: number;
  offset?: number;
}

export interface FilteredCitizen {
  id: number;
  name: string;
  nik: string;
  gender: "L" | "P";
  birthDate: string | null;
  age: number | null;
  phone: string | null;
  relationship: string;
  religion: string | null;
  occupation: string | null;
  educationLevel: string | null;
  familyNumber: string | null;
  dwellingBlock: string | null;
  dwellingHouse: string | null;
  dwellingType: string | null;
  feeStatus: string | null;
}

export async function filterCitizens(options: CitizenFilterOptions = {}) {
  const limit = options.limit ?? 500;
  const offset = options.offset ?? 0;

  const conditions: any[] = [eq(schema.familyMembers.isActive, true)];

  // 1. Search Query (Nama atau NIK)
  if (options.searchQuery && options.searchQuery.trim() !== "") {
    const q = `%${options.searchQuery.trim()}%`;
    conditions.push(
      or(
        like(schema.familyMembers.name, q),
        like(schema.familyMembers.nik, q)
      )!
    );
  }

  // 2. Rentang Usia (BirthDate Math)
  const today = new Date();
  if (options.minAge !== undefined && !isNaN(options.minAge) && options.minAge > 0) {
    const maxBirthDate = new Date(today.getFullYear() - options.minAge, today.getMonth(), today.getDate());
    conditions.push(lte(schema.familyMembers.birthDate, maxBirthDate));
  }
  if (options.maxAge !== undefined && !isNaN(options.maxAge) && options.maxAge > 0) {
    const minBirthDate = new Date(today.getFullYear() - options.maxAge - 1, today.getMonth(), today.getDate());
    conditions.push(gte(schema.familyMembers.birthDate, minBirthDate));
  }

  // 3. Jenis Kelamin
  if (options.gender && (options.gender === "L" || options.gender === "P")) {
    conditions.push(eq(schema.familyMembers.gender, options.gender));
  }

  // 4. Hubungan Keluarga (Multi-Select)
  if (options.relationships && options.relationships.length > 0) {
    conditions.push(inArray(schema.familyMembers.relationship, options.relationships as any));
  }

  // 5. Agama
  if (options.religion && options.religion !== "all" && options.religion.trim() !== "") {
    conditions.push(eq(schema.familyMembers.religion, options.religion as any));
  }

  // 6. Pekerjaan
  if (options.occupation && options.occupation.trim() !== "") {
    conditions.push(like(schema.familyMembers.occupation, `%${options.occupation.trim()}%`));
  }

  // 7. Tipe Hunian
  if (options.dwellingType && options.dwellingType !== "all" && options.dwellingType.trim() !== "") {
    if (options.dwellingType === "kos") {
      conditions.push(inArray(schema.dwellings.type, ["kos", "homestay"]));
    } else {
      conditions.push(eq(schema.dwellings.type, options.dwellingType as any));
    }
  }

  // 8. Blok Hunian
  if (options.blockNumber && options.blockNumber !== "all" && options.blockNumber.trim() !== "") {
    conditions.push(eq(schema.dwellings.blockNumber, options.blockNumber.trim()));
  }

  // 9. Status Iuran
  if (options.feeStatus && options.feeStatus !== "all") {
    conditions.push(eq(schema.feePayments.status, options.feeStatus as any));
  }

  const whereClause = and(...conditions);

  const items = await db
    .select({
      id: schema.familyMembers.id,
      name: schema.familyMembers.name,
      nik: schema.familyMembers.nik,
      gender: schema.familyMembers.gender,
      birthDate: schema.familyMembers.birthDate,
      phone: schema.familyMembers.phone,
      relationship: schema.familyMembers.relationship,
      religion: schema.familyMembers.religion,
      occupation: schema.familyMembers.occupation,
      educationLevel: schema.familyMembers.educationLevel,
      familyNumber: schema.families.familyNumber,
      dwellingBlock: schema.dwellings.blockNumber,
      dwellingHouse: schema.dwellings.houseNumber,
      dwellingType: schema.dwellings.type,
      feeStatus: schema.feePayments.status,
    })
    .from(schema.familyMembers)
    .innerJoin(schema.families, eq(schema.familyMembers.familyId, schema.families.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .leftJoin(schema.feePayments, eq(schema.families.id, schema.feePayments.familyId))
    .where(whereClause)
    .orderBy(desc(schema.familyMembers.id))
    .limit(limit)
    .offset(offset);

  // Compute precise age and format date string
  const enriched: FilteredCitizen[] = items.map((item) => {
    let age: number | null = null;
    let birthDateStr: string | null = null;
    if (item.birthDate) {
      const bDate = item.birthDate instanceof Date ? item.birthDate : new Date(item.birthDate);
      birthDateStr = bDate.toISOString().split("T")[0];
      const diffYears = today.getFullYear() - bDate.getFullYear();
      const hasHadBirthday =
        today.getMonth() > bDate.getMonth() ||
        (today.getMonth() === bDate.getMonth() && today.getDate() >= bDate.getDate());
      age = hasHadBirthday ? diffYears : diffYears - 1;
    }

    return {
      id: item.id,
      name: item.name,
      nik: item.nik,
      gender: item.gender,
      birthDate: birthDateStr,
      age,
      phone: item.phone || null,
      relationship: item.relationship,
      religion: item.religion || null,
      occupation: item.occupation || null,
      educationLevel: item.educationLevel || null,
      familyNumber: item.familyNumber || null,
      dwellingBlock: item.dwellingBlock || null,
      dwellingHouse: item.dwellingHouse || null,
      dwellingType: item.dwellingType || null,
      feeStatus: item.feeStatus || "paid",
    };
  });

  return enriched;
}
