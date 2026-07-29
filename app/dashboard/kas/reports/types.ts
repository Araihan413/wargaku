export interface FinancialReportSummary {
  openingBalance: number;
  totalIncome: number;
  totalCashIncome: number;
  totalFeeIncome: number;
  totalExpense: number;
  endingBalance: number;
  netChange: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface LedgerItem {
  id: string;
  date: string;
  type: "income" | "expense";
  source: string;
  category: string;
  description: string;
  amount: number;
  receiptFile: string | null;
  recordedBy: string;
}

export interface FinancialReportData {
  period: {
    year: number;
    month: number | null;
    label: string;
  };
  summary: FinancialReportSummary;
  breakdown: {
    income: CategoryBreakdownItem[];
    expense: CategoryBreakdownItem[];
  };
  ledger: LedgerItem[];
}

export interface ReportFilterState {
  year: number;
  month: string; // 'all' or '1'..'12'
}
