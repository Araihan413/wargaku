export interface RecentTransactionItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  receiptFile?: string | null;
  status?: string;
}

export interface DuesComplianceStats {
  totalActiveFamilies: number;
  paidFamiliesCount: number;
  unpaidFamiliesCount: number;
  duesPaidPercentage: number;
  currentPeriod: string;
}

export interface TreasurerDashboardStats {
  totalBalance: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  duesStats: DuesComplianceStats;
  recentTransactions: RecentTransactionItem[];
}
