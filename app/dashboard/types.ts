export interface DashboardStats {
  summary: {
    totalWargaAktif: number;
    totalKK: number;
    totalWargaTetap: number;
    totalPendatang: number;
  };
  genderDistribution: { gender: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
  occupationDistribution: { occupation: string; count: number }[];
  educationDistribution: { education: string; count: number }[];
  religionDistribution: { religion: string; count: number }[];
  dwellingDistribution: { type: string; count: number }[];
  occupancyRate: {
    totalRooms: number;
    filledRooms: number;
    occupancyPercent: number;
  };
  cashSummary: {
    currentBalance: number;
    billedIuran: number;
    paidIuran: number;
    participationRate: number;
  };
  cashflowTrend: { month: string; income: number; expense: number }[];
  complaintSummary: {
    status: string;
    count: number;
  }[];
  topComplaintCategories: { category: string; count: number }[];
  populationMutations: { month: string; checkIn: number; checkOut: number }[];
}
