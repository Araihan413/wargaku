export interface SecretaryKpiSummary {
  pendingRegistrations: number;
  newComplaints: number;
  upcomingActivities: number;
}

export interface PendingRegistrationItem {
  id: string; // user id
  name: string;
  email: string;
  phone: string | null;
  nik: string | null;
  createdAt: string;
  address: string | null;
}

export interface UpcomingActivityItem {
  id: number;
  title: string;
  eventDate: string;
  location: string | null;
  isPinned: boolean;
}

export interface LatestAnnouncementItem {
  id: number;
  title: string;
  category: "umum" | "penting" | "mendesak";
  isPinned: boolean;
  publishedAt: string | null;
}

export interface RecentComplaintItem {
  id: number;
  trackingCode: string;
  reporterName: string;
  category: string;
  description: string;
  status: "menunggu" | "proses" | "selesai" | "ditolak";
  createdAt: string;
}

export interface SecretaryDashboardStats {
  summary: SecretaryKpiSummary;
  pendingRegistrations: PendingRegistrationItem[];
  upcomingActivities: UpcomingActivityItem[];
  latestAnnouncements: LatestAnnouncementItem[];
  recentComplaints: RecentComplaintItem[];
}
