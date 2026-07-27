import { db } from "../db";
import * as schema from "../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";

async function testStats() {
  const today = new Date();
  
  try {
    console.log("1. Fetching active residents...");
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
    console.log(`- Success: ${activeWargaTetap.length} tetap`);

    const activeWargaSewa = await db
      .select({
        occupation: schema.rentalResidents.occupation,
        educationLevel: schema.rentalResidents.educationLevel,
        religion: schema.rentalResidents.religion,
      })
      .from(schema.rentalResidents)
      .where(eq(schema.rentalResidents.isActive, true));
    console.log(`- Success: ${activeWargaSewa.length} sewa`);

    const allResidents = [
      ...activeWargaTetap.map((w) => ({ ...w, type: "tetap" })),
      ...activeWargaSewa.map((w) => ({ ...w, type: "sewa", gender: null, birthDate: null })),
    ];

    const [familiesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.families)
      .where(eq(schema.families.isActive, true));
    console.log(`- Success: ${familiesCount?.count || 0} families`);

    console.log("2. Processing distributions...");
    const genderCounts = activeWargaTetap.reduce(
      (acc, r) => {
        if (r.gender === "L") acc.L++;
        if (r.gender === "P") acc.P++;
        return acc;
      },
      { L: 0, P: 0 }
    );

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

    console.log("3. Fetching dwellings...");
    const allDwellings = await db
      .select({
        id: schema.dwellings.id,
        type: schema.dwellings.type,
      })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.isActive, true));
    console.log(`- Success: ${allDwellings.length} dwellings`);

    console.log("4. Fetching rental properties...");
    const activeRentals = await db
      .select({
        id: schema.rentalProperties.id,
        dwellingId: schema.rentalProperties.dwellingId,
        totalRooms: schema.rentalProperties.totalRooms,
      })
      .from(schema.rentalProperties)
      .where(eq(schema.rentalProperties.isActive, true));
    console.log(`- Success: ${activeRentals.length} active rentals`);

    console.log("5. Fetching cash transactions...");
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
    console.log(`- Success: ${incomeTransactions.length} income, ${expenseTransactions.length} expense`);

    console.log("6. Fetching fee payments...");
    const currentPeriod = format(today, "yyyy-MM");
    const iuranPayments = await db
      .select({
        amountBilled: schema.feePayments.amountBilled,
        amountPaid: schema.feePayments.amountPaid,
        status: schema.feePayments.status,
      })
      .from(schema.feePayments)
      .where(eq(schema.feePayments.period, currentPeriod));
    console.log(`- Success: ${iuranPayments.length} iuran payments`);

    console.log("7. Fetching complaints...");
    const complaints = await db
      .select({
        id: schema.complaints.id,
        status: schema.complaints.status,
        category: schema.complaints.category,
      })
      .from(schema.complaints);
    console.log(`- Success: ${complaints.length} complaints`);

    console.log("8. Fetching recent mutasi (warga check-in/out)...");
    // Let's do a simple check on families and rental residents check in
    const last6Months = subMonths(startOfMonth(today), 5);
    const recentWargaIn = await db
      .select({ checkInDate: schema.families.checkInDate })
      .from(schema.families)
      .where(gte(schema.families.checkInDate, last6Months));
    console.log(`- Success: recentWargaIn length ${recentWargaIn.length}`);

    console.log("All DB queries in stats route ran successfully!");
  } catch (error) {
    console.error("CRITICAL ERROR during query execution:", error);
  }
  process.exit();
}

testStats();
