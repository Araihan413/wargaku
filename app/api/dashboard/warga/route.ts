import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, gte, sql, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. User & Family info
    const [user] = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        nik: schema.users.nik,
        roleId: schema.users.roleId,
        dwellingId: schema.users.dwellingId,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    // Fetch user's primary residence (dwelling)
    let dwellingData = null;
    if (user?.dwellingId) {
      const [dwelling] = await db
        .select({
          id: schema.dwellings.id,
          blockNumber: schema.dwellings.blockNumber,
          houseNumber: schema.dwellings.houseNumber,
          qrToken: schema.dwellings.qrToken,
          type: schema.dwellings.type,
          latitude: schema.dwellings.latitude,
          longitude: schema.dwellings.longitude,
        })
        .from(schema.dwellings)
        .where(eq(schema.dwellings.id, user.dwellingId));
      if (dwelling) {
        dwellingData = dwelling;
      }
    }

    // Check if user is head of family or member
    let familyData: {
      id: number;
      familyNumber: string;
      verificationStatus: "draft" | "pending" | "verified" | "rejected";
      verificationNote: string | null;
      headName: string;
      hasVerified: boolean;
      totalMembers: number;
    } | null = null;

    const [headFamily] = await db
      .select({
        id: schema.families.id,
        familyNumber: schema.families.familyNumber,
        verificationStatus: schema.families.verificationStatus,
        verificationNote: schema.families.verificationNote,
        headName: schema.families.headName,
        hasVerified: schema.families.hasVerified,
      })
      .from(schema.families)
      .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)));

    if (headFamily) {
      const [membersCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.residents)
        .where(and(eq(schema.residents.familyId, headFamily.id), eq(schema.residents.residentType, 'warga_tetap'), eq(schema.residents.isActive, true)));

      familyData = {
        ...headFamily,
        totalMembers: membersCount?.count || 0,
      };
    } else if (user?.nik) {
      // Check if member of a family by NIK
      const [member] = await db
        .select({
          familyId: schema.residents.familyId,
        })
        .from(schema.residents)
        .where(and(eq(schema.residents.nik, user.nik), eq(schema.residents.residentType, 'warga_tetap'), eq(schema.residents.isActive, true)));

      if (member && member.familyId) {
        const [foundFamily] = await db
          .select({
            id: schema.families.id,
            familyNumber: schema.families.familyNumber,
            verificationStatus: schema.families.verificationStatus,
            verificationNote: schema.families.verificationNote,
            headName: schema.families.headName,
            hasVerified: schema.families.hasVerified,
          })
          .from(schema.families)
          .where(eq(schema.families.id, member.familyId));

        if (foundFamily) {
          const [membersCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.residents)
            .where(and(eq(schema.residents.familyId, foundFamily.id), eq(schema.residents.residentType, 'warga_tetap'), eq(schema.residents.isActive, true)));

          familyData = {
            ...foundFamily,
            totalMembers: membersCount?.count || 0,
          };
        }
      }
    }

    // 2. Fetch top 3 latest announcements
    const latestAnnouncements = await db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        content: schema.announcements.content,
        category: schema.announcements.category,
        isPinned: schema.announcements.isPinned,
        publishedAt: schema.announcements.publishedAt,
        createdAt: schema.announcements.createdAt,
      })
      .from(schema.announcements)
      .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.createdAt))
      .limit(3);

    // 3. Fetch upcoming activities
    const now = new Date();
    const upcomingActivities = await db
      .select({
        id: schema.activities.id,
        title: schema.activities.title,
        description: schema.activities.description,
        eventDate: schema.activities.eventDate,
        location: schema.activities.location,
        isPinned: schema.activities.isPinned,
      })
      .from(schema.activities)
      .where(gte(schema.activities.eventDate, now))
      .orderBy(schema.activities.eventDate)
      .limit(3);

    // 4. Financial Summary
    const approvedTransactions = await db
      .select({
        type: schema.cashTransactions.type,
        amount: schema.cashTransactions.amount,
      })
      .from(schema.cashTransactions)
      .where(eq(schema.cashTransactions.status, "approved"));

    let totalIncome = 0;
    let totalExpense = 0;
    approvedTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") totalIncome += amt;
      if (tx.type === "expense") totalExpense += amt;
    });

    // 5. Officer Contacts (Roles 2: Ketua RT, 3: Sekretaris, 4: Bendahara)
    const officers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
        roleId: schema.users.roleId,
      })
      .from(schema.users)
      .where(and(inArray(schema.users.roleId, [2, 3, 4]), eq(schema.users.status, "active")));

    // Map roleId to friendly role title
    const officerContacts = officers.map((off) => ({
      id: off.id,
      name: off.name,
      phone: off.phone || "-",
      roleTitle:
        off.roleId === 2
          ? "Ketua RT"
          : off.roleId === 3
          ? "Sekretaris RT"
          : off.roleId === 4
          ? "Bendahara RT"
          : "Pengurus",
    }));

    // 6. Aggregate Stats (Total Warga & Total KK)
    const [wargaCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.residents)
      .where(eq(schema.residents.isActive, true));

    const [kkCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.families)
      .where(eq(schema.families.isActive, true));

    return NextResponse.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        dwellingId: user?.dwellingId,
      },
      family: familyData,
      dwelling: dwellingData,
      announcements: latestAnnouncements,
      activities: upcomingActivities,
      finance: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      officerContacts,
      stats: {
        totalWarga: wargaCount?.count || 0,
        totalKK: kkCount?.count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching warga dashboard:", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard warga" },
      { status: 500 }
    );
  }
}
