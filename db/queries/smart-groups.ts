import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

export interface QueryRule {
  field: string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=" | "IN" | "NOT IN";
  value: any;
  weight?: number | null;
}

export interface EnrichedCitizen {
  id: number;
  name: string;
  nik: string;
  age: number;
  gender: "L" | "P";
  relationship: string | null;
  occupation: string | null;
  educationLevel: string | null;
  religion: string | null;
  familyNumber: string;
  headName: string;
  blockNumber: string;
  houseNumber: string;
  dwellingType: string;
  headOccupation: string | null;
  feeStatus: "lancar" | "menunggak";
  kkMembersCount: number;
  phone?: string | null;
  ktpFile?: string | null;
  _score?: number;
  _matchCount?: number;
}

// 1. Create Smart Group Template
export async function createSmartGroup(
  rtId: string,
  name: string,
  queryRules: { globalOperator: "AND" | "OR"; rules: QueryRule[] },
  createdBy: string
) {
  const [result] = await db.insert(schema.smartGroups).values({
    rtId,
    name,
    queryRules,
    createdBy,
  });
  return result.insertId;
}

// 2. Get Smart Groups list by RT
export async function getSmartGroupsByRt(rtId: string) {
  return db
    .select({
      id: schema.smartGroups.id,
      name: schema.smartGroups.name,
      queryRules: schema.smartGroups.queryRules,
      createdAt: schema.smartGroups.createdAt,
      updatedAt: schema.smartGroups.updatedAt,
    })
    .from(schema.smartGroups)
    .where(eq(schema.smartGroups.rtId, rtId));
}

// 3. Delete Smart Group
export async function deleteSmartGroup(id: number, rtId: string) {
  const [result] = await db
    .delete(schema.smartGroups)
    .where(and(eq(schema.smartGroups.id, id), eq(schema.smartGroups.rtId, rtId)));
  return result.affectedRows > 0;
}

// Helper to calculate age from birthDate
const calculateAge = (birthDateString: Date | string | null): number => {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper to check single rule against citizen
const checkRule = (citizen: EnrichedCitizen, rule: QueryRule): boolean => {
  const { field, operator, value } = rule;
  const citizenValue = (citizen as any)[field];

  if (citizenValue === undefined) return false;

  if (citizenValue === null) {
    if (operator === "==" && (value === null || value === "")) return true;
    if (operator === "!=" && (value !== null && value !== "")) return true;
    return false;
  }

  const normCitizenVal = typeof citizenValue === "string" ? citizenValue.toLowerCase() : citizenValue;
  const normCompareVal = typeof value === "string" ? value.toLowerCase() : value;

  switch (operator) {
    case "==":
      return String(normCitizenVal) === String(normCompareVal);
    case "!=":
      return String(normCitizenVal) !== String(normCompareVal);
    case ">":
      return Number(normCitizenVal) > Number(normCompareVal);
    case ">=":
      return Number(normCitizenVal) >= Number(normCompareVal);
    case "<":
      return Number(normCitizenVal) < Number(normCompareVal);
    case "<=":
      return Number(normCitizenVal) <= Number(normCompareVal);
    case "IN": {
      const list = Array.isArray(value)
        ? value.map((v) => String(v).toLowerCase().trim())
        : String(value)
            .toLowerCase()
            .split(",")
            .map((v) => v.trim());
      return list.includes(String(normCitizenVal).trim());
    }
    case "NOT IN": {
      const list = Array.isArray(value)
        ? value.map((v) => String(v).toLowerCase().trim())
        : String(value)
            .toLowerCase()
            .split(",")
            .map((v) => v.trim());
      return !list.includes(String(normCitizenVal).trim());
    }
    default:
      return false;
  }
};

// 4. Evaluate dynamic rules and return matching citizens
export async function evaluateSmartGroupRules(
  rtId: string,
  rules: QueryRule[],
  globalOperator: "AND" | "OR"
): Promise<EnrichedCitizen[]> {
  // Fetch active residents in the system
  const members = await db
    .select({
      id: schema.residents.id,
      name: schema.residents.name,
      nik: schema.residents.nik,
      birthPlace: schema.residents.birthPlace,
      birthDate: schema.residents.birthDate,
      gender: schema.residents.gender,
      relationship: schema.residents.relationship,
      occupation: schema.residents.occupation,
      educationLevel: schema.residents.educationLevel,
      religion: schema.residents.religion,
      phone: schema.residents.phone,
      ktpFile: schema.residents.ktpFile,
      isActive: schema.residents.isActive,
      familyId: schema.residents.familyId,
      familyNumber: schema.families.familyNumber,
      headName: schema.families.headName,
      headUserId: schema.families.headUserId,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      dwellingType: schema.dwellings.type,
    })
    .from(schema.residents)
    .innerJoin(schema.families, eq(schema.residents.familyId, schema.families.id))
    .innerJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(eq(schema.residents.isActive, true));

  // Get family heads' occupations
  const familyHeads = await db
    .select({
      familyId: schema.residents.familyId,
      occupation: schema.residents.occupation,
    })
    .from(schema.residents)
    .where(
      and(
        eq(schema.residents.relationship, "Kepala_Keluarga"),
        eq(schema.residents.isActive, true)
      )
    );

  const headOccupationMap = new Map<number, string>();
  familyHeads.forEach((h) => {
    if (h.familyId && h.occupation) {
      headOccupationMap.set(h.familyId, h.occupation);
    }
  });

  // Calculate member count per family
  const memberCounts = new Map<number, number>();
  members.forEach((m) => {
    if (m.familyId) {
      const count = memberCounts.get(m.familyId) ?? 0;
      memberCounts.set(m.familyId, count + 1);
    }
  });

  // Retrieve unpaid or partially paid billing per family to determine fee delinquent status
  const unpaidPayments = await db
    .select({ familyId: schema.feePayments.familyId })
    .from(schema.feePayments)
    .where(
      or(
        eq(schema.feePayments.status, "unpaid"),
        eq(schema.feePayments.status, "partially_paid")
      )
    );

  const delinquentFamilies = new Set<number>();
  unpaidPayments.forEach((p) => delinquentFamilies.add(p.familyId));

  // Enrich each family member
  const enrichedCitizens: EnrichedCitizen[] = members.map((m) => {
    const age = calculateAge(m.birthDate);
    const headOccupation = m.familyId ? (headOccupationMap.get(m.familyId) || null) : null;
    const feeStatus = m.familyId && delinquentFamilies.has(m.familyId) ? "menunggak" : "lancar";
    const kkMembersCount = m.familyId ? (memberCounts.get(m.familyId) ?? 0) : 0;

    return {
      id: m.id,
      name: m.name,
      nik: m.nik,
      age,
      gender: m.gender,
      relationship: m.relationship,
      occupation: m.occupation,
      educationLevel: m.educationLevel,
      religion: m.religion,
      familyNumber: m.familyNumber,
      headName: m.headName,
      blockNumber: m.blockNumber,
      houseNumber: m.houseNumber,
      dwellingType: m.dwellingType,
      headOccupation,
      feeStatus,
      kkMembersCount,
      phone: m.phone,
      ktpFile: m.ktpFile,
    };
  });

  // Apply filters
  const results: EnrichedCitizen[] = [];
  const hasWeight = rules.some(
    (r) => r.weight !== undefined && r.weight !== null && Number(r.weight) > 0
  );

  for (const citizen of enrichedCitizens) {
    let matchesAll = true;
    let matchesAny = false;
    let score = 0;
    let matchCount = 0;

    for (const rule of rules) {
      const isMatch = checkRule(citizen, rule);
      if (isMatch) {
        matchesAny = true;
        matchCount++;
        if (rule.weight) {
          score += Number(rule.weight);
        }
      } else {
        matchesAll = false;
      }
    }

    const isEligible =
      rules.length === 0
        ? true
        : globalOperator === "AND"
        ? matchesAll
        : matchesAny;

    if (isEligible) {
      results.push({
        ...citizen,
        _score: score,
        _matchCount: matchCount,
      });
    }
  }

  // Sort results
  if (hasWeight) {
    results.sort((a, b) => (b._score ?? 0) - (a._score ?? 0) || a.name.localeCompare(b.name));
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return results;
}
