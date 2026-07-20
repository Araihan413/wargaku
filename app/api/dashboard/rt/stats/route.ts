import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role 2 (Ketua RT), Role 3 (Sekretaris), and Role 1 (Super Admin) can access
    const allowed = await hasPermission(session.user.roleId, "view-residents");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();

    // 1. Fetch active residents (Warga Tetap & Pendatang)
    const activeWargaTetap = await db
      .select({
        gender: schema.familyMembers.gender,
        birthDate: schema.familyMembers.birthDate,
        occupation: schema.familyMembers.occupation,
        educationLevel: schema.familyMembers.educationLevel,
        religion: schema.familyMembers.religion,
      })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true));

    const activeWargaSewa = await db
      .select({
        occupation: schema.rentalResidents.occupation,
        educationLevel: schema.rentalResidents.educationLevel,
        religion: schema.rentalResidents.religion,
      })
      .from(schema.rentalResidents)
      .where(eq(schema.rentalResidents.isActive, true));

    const allResidents = [
      ...activeWargaTetap.map((w) => ({ ...w, type: "tetap" })),
      ...activeWargaSewa.map((w) => ({ ...w, type: "sewa", gender: null, birthDate: null })),
    ];

    // Summary calculations
    const totalWargaTetap = activeWargaTetap.length;
    const totalPendatang = activeWargaSewa.length;
    const totalWargaAktif = totalWargaTetap + totalPendatang;

    const [familiesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.families)
      .where(eq(schema.families.isActive, true));
    const totalKK = familiesCount?.count || 0;

    // 2. Gender Distribution (Only calculated for permanent residents)
    const genderCounts = activeWargaTetap.reduce(
      (acc, r) => {
        if (r.gender === "L") acc.L++;
        if (r.gender === "P") acc.P++;
        return acc;
      },
      { L: 0, P: 0 }
    );
    const genderDistribution = [
      { gender: "Laki-laki", count: genderCounts.L },
      { gender: "Perempuan", count: genderCounts.P },
    ];

    // Helper to calculate age
    const getAge = (birthDateStr: string | Date | null) => {
      if (!birthDateStr) return null;
      const birthDate = new Date(birthDateStr);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // 3. Age Distribution (Only calculated for permanent residents)
    const ageCounts = { balita: 0, anak: 0, remaja: 0, produktif: 0, lansia: 0 };
    activeWargaTetap.forEach((r) => {
      const age = getAge(r.birthDate);
      if (age === null) return;
      if (age <= 5) ageCounts.balita++;
      else if (age <= 12) ageCounts.anak++;
      else if (age <= 18) ageCounts.remaja++;
      else if (age <= 59) ageCounts.produktif++;
      else ageCounts.lansia++;
    });

    const ageDistribution = [
      { range: "Balita (0-5 th)", count: ageCounts.balita },
      { range: "Anak (6-12 th)", count: ageCounts.anak },
      { range: "Remaja (13-18 th)", count: ageCounts.remaja },
      { range: "Produktif (19-59 th)", count: ageCounts.produktif },
      { range: "Lansia (>=60 th)", count: ageCounts.lansia },
    ];

    // 4. Occupation Distribution
    const occupationCounts: Record<string, number> = {};
    allResidents.forEach((r) => {
      const occ = r.occupation?.trim() || "Tidak Bekerja / Lainnya";
      occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
    });
    const occupationDistribution = Object.entries(occupationCounts)
      .map(([occupation, count]) => ({ occupation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 occupations

    // 5. Education Distribution
    const educationCounts: Record<string, number> = {};
    allResidents.forEach((r) => {
      const edu = r.educationLevel?.trim() || "Tidak Sekolah / Lainnya";
      educationCounts[edu] = (educationCounts[edu] || 0) + 1;
    });
    const educationDistribution = Object.entries(educationCounts)
      .map(([education, count]) => ({ education, count }))
      .sort((a, b) => b.count - a.count);

    // 6. Religion Distribution
    const religionCounts: Record<string, number> = {
      Islam: 0,
      Kristen: 0,
      Katolik: 0,
      Hindu: 0,
      Buddha: 0,
      Khonghucu: 0,
      Lainnya: 0,
    };
    allResidents.forEach((r) => {
      const rel = r.religion || "Lainnya";
      if (religionCounts[rel] !== undefined) {
        religionCounts[rel]++;
      } else {
        religionCounts.Lainnya++;
      }
    });
    const religionDistribution = Object.entries(religionCounts)
      .map(([religion, count]) => ({ religion, count }))
      .filter((item) => item.count > 0);

    // 7. Dwellings status
    const allDwellings = await db
      .select({
        id: schema.dwellings.id,
        type: schema.dwellings.type,
      })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.isActive, true));

    const activeFamilies = await db
      .select({ dwellingId: schema.families.dwellingId })
      .from(schema.families)
      .where(eq(schema.families.isActive, true));

    const occupiedDwellingIds = new Set<number>();
    activeFamilies.forEach((f) => occupiedDwellingIds.add(f.dwellingId));

    // Get active rental properties that have active tenants
    const activeRentals = await db
      .select({
        id: schema.rentalProperties.id,
        dwellingId: schema.rentalProperties.dwellingId,
        totalRooms: schema.rentalProperties.totalRooms,
      })
      .from(schema.rentalProperties)
      .where(eq(schema.rentalProperties.isActive, true));

    const activeTenants = await db
      .select({ rentalPropertyId: schema.rentalResidents.rentalPropertyId })
      .from(schema.rentalResidents)
      .where(eq(schema.rentalResidents.isActive, true));

    const occupiedRentalPropertyIds = new Set(activeTenants.map((t) => t.rentalPropertyId));
    activeRentals.forEach((r) => {
      if (occupiedRentalPropertyIds.has(r.id)) {
        occupiedDwellingIds.add(r.dwellingId);
      }
    });

    const dwellingCounts = { permanen: 0, kos: 0, homestay: 0, kosong: 0 };
    allDwellings.forEach((d) => {
      if (!occupiedDwellingIds.has(d.id)) {
        dwellingCounts.kosong++;
      } else {
        if (d.type === "permanen") dwellingCounts.permanen++;
        else if (d.type === "kos") dwellingCounts.kos++;
        else if (d.type === "homestay") dwellingCounts.homestay++;
      }
    });

    const dwellingDistribution = [
      { type: "Rumah Tetap", count: dwellingCounts.permanen },
      { type: "Kos / Kontrakan", count: dwellingCounts.kos },
      { type: "Homestay", count: dwellingCounts.homestay },
      { type: "Rumah Kosong", count: dwellingCounts.kosong },
    ];

    // 8. Occupancy Rate of Rental properties
    const totalRooms = activeRentals.reduce((sum, r) => sum + (r.totalRooms || 0), 0);
    const filledRooms = totalPendatang; // Estimating 1 resident per filled room/unit as MVP
    const occupancyPercent = totalRooms > 0 ? Math.round((filledRooms / totalRooms) * 100) : 0;
    const occupancyRate = { totalRooms, filledRooms, occupancyPercent };

    // 9. Finance Kas RT
    const incomeTransactions = await db
      .select({ amount: schema.cashTransactions.amount })
      .from(schema.cashTransactions)
      .where(eq(schema.cashTransactions.type, "income"));

    const expenseTransactions = await db
      .select({ amount: schema.cashTransactions.amount })
      .from(schema.cashTransactions)
      .where(
        and(
          eq(schema.cashTransactions.type, "expense"),
          eq(schema.cashTransactions.status, "approved")
        )
      );

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const currentBalance = totalIncome - totalExpense;

    // Monthly Fee payments check for the current month
    const currentPeriod = format(today, "yyyy-MM");
    const iuranPayments = await db
      .select({
        amountBilled: schema.feePayments.amountBilled,
        amountPaid: schema.feePayments.amountPaid,
        status: schema.feePayments.status,
      })
      .from(schema.feePayments)
      .where(eq(schema.feePayments.period, currentPeriod));

    const billedIuran = iuranPayments.reduce((sum, p) => sum + parseFloat(p.amountBilled.toString()), 0);
    const paidIuran = iuranPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid.toString()), 0);
    const paidCount = iuranPayments.filter((p) => p.status === "paid").length;
    const totalKKWithBilled = iuranPayments.length;
    const participationRate = totalKKWithBilled > 0 ? Math.round((paidCount / totalKKWithBilled) * 100) : 0;

    const cashSummary = {
      currentBalance,
      billedIuran,
      paidIuran,
      participationRate,
    };

    // 10. Cashflow Trend (Past 6 Months)
    const sixMonthsAgo = subMonths(startOfMonth(today), 5);
    const pastTransactions = await db
      .select({
        type: schema.cashTransactions.type,
        amount: schema.cashTransactions.amount,
        status: schema.cashTransactions.status,
        date: schema.cashTransactions.transactionDate,
      })
      .from(schema.cashTransactions)
      .where(gte(schema.cashTransactions.transactionDate, sixMonthsAgo));

    // Group transactions by month
    const monthlyCashflow: Record<string, { income: number; expense: number }> = {};
    for (let i = 0; i < 6; i++) {
      const monthStr = format(subMonths(today, i), "MMM yyyy");
      monthlyCashflow[monthStr] = { income: 0, expense: 0 };
    }

    pastTransactions.forEach((t) => {
      const mStr = format(new Date(t.date), "MMM yyyy");
      if (monthlyCashflow[mStr] !== undefined) {
        const amt = parseFloat(t.amount.toString());
        if (t.type === "income") {
          monthlyCashflow[mStr].income += amt;
        } else if (t.type === "expense" && t.status === "approved") {
          monthlyCashflow[mStr].expense += amt;
        }
      }
    });

    const cashflowTrend = Object.entries(monthlyCashflow)
      .map(([month, data]) => ({ month, ...data }))
      .reverse();

    // 11. Complaints Status & Topics
    const activeComplaints = await db.select().from(schema.complaints);
    const complaintStatusCounts = { menunggu: 0, proses: 0, selesai: 0, ditolak: 0 };
    const complaintCategoryCounts: Record<string, number> = {
      Infrastruktur: 0,
      Kebersihan: 0,
      Keamanan: 0,
      Sosial: 0,
      Lainnya: 0,
    };

    activeComplaints.forEach((c) => {
      if (complaintStatusCounts[c.status] !== undefined) {
        complaintStatusCounts[c.status]++;
      }
      if (complaintCategoryCounts[c.category] !== undefined) {
        complaintCategoryCounts[c.category]++;
      }
    });

    const complaintSummary = Object.entries(complaintStatusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));

    const topComplaintCategories = Object.entries(complaintCategoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 12. Population Mutations (Check-In vs Check-Out over the last 6 months)
    const activeRentalsHistory = await db
      .select({
        checkInDate: schema.rentalResidents.checkInDate,
        checkOutDate: schema.rentalResidents.checkOutDate,
      })
      .from(schema.rentalResidents);

    // Query permanent families check-in/check-out dates
    const permanentFamiliesHistory = await db
      .select({
        id: schema.families.id,
        checkInDate: schema.families.checkInDate,
        checkOutDate: schema.families.checkOutDate,
      })
      .from(schema.families);

    // Query family member counts to estimate exact population count
    const familyMembersCount = await db
      .select({
        familyId: schema.familyMembers.familyId,
      })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true));

    const familySizeMap: Record<number, number> = {};
    familyMembersCount.forEach((fm) => {
      familySizeMap[fm.familyId] = (familySizeMap[fm.familyId] || 0) + 1;
    });

    const monthlyMutations: Record<string, { checkIn: number; checkOut: number }> = {};
    for (let i = 0; i < 6; i++) {
      const monthStr = format(subMonths(today, i), "MMM yyyy");
      monthlyMutations[monthStr] = { checkIn: 0, checkOut: 0 };
    }

    // Process rental residents mutations (each count as 1 person)
    activeRentalsHistory.forEach((r) => {
      if (r.checkInDate) {
        const checkInMonth = format(new Date(r.checkInDate), "MMM yyyy");
        if (monthlyMutations[checkInMonth] !== undefined) {
          monthlyMutations[checkInMonth].checkIn++;
        }
      }
      if (r.checkOutDate) {
        const checkOutMonth = format(new Date(r.checkOutDate), "MMM yyyy");
        if (monthlyMutations[checkOutMonth] !== undefined) {
          monthlyMutations[checkOutMonth].checkOut++;
        }
      }
    });

    // Process permanent resident families mutations (each family is weighted by size)
    permanentFamiliesHistory.forEach((f) => {
      const size = familySizeMap[f.id] || 1; // Default to 1 if no family member records
      if (f.checkInDate) {
        const checkInMonth = format(new Date(f.checkInDate), "MMM yyyy");
        if (monthlyMutations[checkInMonth] !== undefined) {
          monthlyMutations[checkInMonth].checkIn += size;
        }
      }
      if (f.checkOutDate) {
        const checkOutMonth = format(new Date(f.checkOutDate), "MMM yyyy");
        if (monthlyMutations[checkOutMonth] !== undefined) {
          monthlyMutations[checkOutMonth].checkOut += size;
        }
      }
    });

    const populationMutations = Object.entries(monthlyMutations)
      .map(([month, data]) => ({ month, ...data }))
      .reverse();

    // Assemble full stats response
    const stats = {
      summary: {
        totalWargaAktif,
        totalKK,
        totalWargaTetap,
        totalPendatang,
      },
      genderDistribution,
      ageDistribution,
      occupationDistribution,
      educationDistribution,
      religionDistribution,
      dwellingDistribution,
      occupancyRate,
      cashSummary,
      cashflowTrend,
      complaintSummary,
      topComplaintCategories,
      populationMutations,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard Stats API error:", error);
    return NextResponse.json({ error: error.message || "Failed to load stats" }, { status: 500 });
  }
}
