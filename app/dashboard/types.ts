export interface DashboardStats {
  summary: {
    totalRumah: number;
    totalWargaAktif: number;
    totalKK: number;
    totalWargaTetap: number;
    totalPendatang: number;
  };
  ktpDistribution?: {
    villageName: string;
    totalLocal: number;
    totalNonLocal: number;
    localPercentage: number;
    nonLocalPercentage: number;
    nonLocalBreakdown?: {
      individualKos: number;
      familyRenters: number;
      permanentResidents: number;
    };
    breakdown?: {
      wargaTetap: {
        local: number;
        nonLocal: number;
      };
      penghuniSewa: {
        local: number;
        nonLocal: number;
      };
    };
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
