import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { CitizenFilterOptions, filterCitizens } from "../residents/citizen-filter.queries";

export interface CreateSmartGroupInput {
  name: string;
  description?: string | null;
  criteria: CitizenFilterOptions;
  createdBy: string;
}

export interface UpdateSmartGroupInput {
  name?: string;
  description?: string | null;
  criteria?: CitizenFilterOptions;
}

export interface SavedSmartGroup {
  id: number;
  name: string;
  criteria: CitizenFilterOptions;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function listSmartGroups() {
  const groups = await db
    .select({
      id: schema.smartGroups.id,
      name: schema.smartGroups.name,
      queryRules: schema.smartGroups.queryRules,
      createdBy: schema.smartGroups.createdBy,
      createdAt: schema.smartGroups.createdAt,
      updatedAt: schema.smartGroups.updatedAt,
    })
    .from(schema.smartGroups)
    .orderBy(desc(schema.smartGroups.id));

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    criteria: (g.queryRules as CitizenFilterOptions) || {},
    createdBy: g.createdBy,
    createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : String(g.createdAt),
    updatedAt: g.updatedAt instanceof Date ? g.updatedAt.toISOString() : String(g.updatedAt),
  }));
}

export async function getSmartGroupById(id: number) {
  const [group] = await db
    .select({
      id: schema.smartGroups.id,
      name: schema.smartGroups.name,
      queryRules: schema.smartGroups.queryRules,
      createdBy: schema.smartGroups.createdBy,
      createdAt: schema.smartGroups.createdAt,
      updatedAt: schema.smartGroups.updatedAt,
    })
    .from(schema.smartGroups)
    .where(eq(schema.smartGroups.id, id))
    .limit(1);

  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    criteria: (group.queryRules as CitizenFilterOptions) || {},
    createdBy: group.createdBy,
    createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : String(group.createdAt),
    updatedAt: group.updatedAt instanceof Date ? group.updatedAt.toISOString() : String(group.updatedAt),
  };
}

export async function createSmartGroup(input: CreateSmartGroupInput) {
  const [result] = await db.insert(schema.smartGroups).values({
    name: input.name,
    queryRules: input.criteria as any,
    createdBy: input.createdBy,
  });
  return result.insertId;
}

export async function updateSmartGroup(id: number, input: UpdateSmartGroupInput) {
  const payload: any = { updatedAt: new Date() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.criteria !== undefined) payload.queryRules = input.criteria;

  await db
    .update(schema.smartGroups)
    .set(payload)
    .where(eq(schema.smartGroups.id, id));

  return true;
}

export async function deleteSmartGroup(id: number) {
  await db.delete(schema.smartGroups).where(eq(schema.smartGroups.id, id));
  return true;
}

export async function evaluateSmartGroupPreset(criteria: CitizenFilterOptions) {
  return filterCitizens(criteria);
}
