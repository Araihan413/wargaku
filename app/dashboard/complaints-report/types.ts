// ─── Overview / KPI Types ───────────────────────────────────────
export interface ComplaintsReportOverview {
  totalComplaints: number;
  activeComplaints: number;
  totalAnnouncements: number;
  totalActivities: number;
}

// ─── Pagination Type ──────────────────────────────────────────────
export interface ReportPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// ─── Complaint Item ───────────────────────────────────────────────
export interface ComplaintReportItem {
  id: number;
  trackingCode: string;
  reporterName: string;
  reporterPhone: string | null;
  category: "Infrastruktur" | "Kebersihan" | "Keamanan" | "Sosial" | "Lainnya";
  description: string;
  photoPath: string | null;
  status: "menunggu" | "proses" | "selesai" | "ditolak";
  responseNote: string | null;
  handledBy: string | null;
  handlerName: string | null;
  dwellingAddress?: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ─── Announcement Item ────────────────────────────────────────────
export interface AnnouncementReportItem {
  id: number;
  title: string;
  content: string;
  category: "umum" | "penting" | "mendesak";
  isPinned: boolean;
  createdBy: string | null;
  creatorName: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// ─── Activity Item ────────────────────────────────────────────────
export interface ActivityReportItem {
  id: number;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  isPinned: boolean;
  createdBy: string | null;
  creatorName: string | null;
  createdAt: string;
}

// ─── Filter State ─────────────────────────────────────────────────
export type ReportTabType = "complaints" | "announcements" | "activities";

export interface ComplaintsReportFilterState {
  tab: ReportTabType;
  search: string;
  status: string;       // for complaints: all | menunggu | proses | selesai | ditolak
  category: string;     // for complaints & announcements
  filter: string;       // for activities: all | upcoming | past
  page: number;
}
