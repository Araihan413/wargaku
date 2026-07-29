// Types for Iuran Warga Module

export interface FeeRule {
  id: number;
  name: string;
  amount: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeePaymentItem {
  id: number;
  feeRuleId: number;
  feeRuleName: string;
  familyId: number;
  familyNumber: string;
  headName: string;
  dwellingBlock: string;
  dwellingHouse: string;
  period: string; // YYYY-MM
  amountBilled: number;
  amountPaid: number;
  amountDue: number; // amountBilled - amountPaid
  paymentDate: string | null;
  paymentMethod: "cash" | "transfer" | null;
  status: "unpaid" | "partially_paid" | "paid";
  isMandatory: boolean;
  recordedBy: string | null;
}

export interface TunggakanItem {
  familyId: number;
  familyNumber: string;
  headName: string;
  dwellingBlock: string;
  dwellingHouse: string;
  totalUnpaid: number;
  unpaidMonths: number;
  latestPeriod: string;
  payments: {
    period: string;
    amountBilled: number;
    amountPaid: number;
    amountDue: number;
    status: "unpaid" | "partially_paid";
  }[];
}

export const PAYMENT_METHOD_OPTIONS = [
  { label: "Tunai (Cash)", value: "cash" },
  { label: "Transfer Bank", value: "transfer" },
];
