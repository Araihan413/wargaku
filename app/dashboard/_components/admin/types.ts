export interface SuperAdminDashboardSummary {
  totalUsers: number;
  totalResidents: number;
  verifiedFamilies: number;
  totalCashBalance: number;
  pendingVerifications: number;
  activeComplaints: number;
  todayAuditLogsCount: number;
}

export interface RoleDistribution {
  superAdminCount: number;
  ketuaRtCount: number;
  sekretarisCount: number;
  bendaharaCount: number;
  koordinatorKosCount: number;
  wargaCount: number;
}

export interface SystemSettingInfo {
  id: number;
  rtName: string;
  rwName: string;
  villageName: string;
  subdistrict: string;
  city: string;
  secretariatAddress?: string | null;
  logoPath?: string | null;
  officialEmail?: string | null;
  officialRtPhone?: string | null;
  officialSecretaryPhone?: string | null;
  officialTreasurerPhone?: string | null;
  updatedAt: string;
}

export interface AuditLogSummaryItem {
  id: number;
  action: string;
  module: string;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorNik: string | null;
}

export interface SuperAdminDashboardStats {
  summary: SuperAdminDashboardSummary;
  roleDistribution: RoleDistribution;
  systemSettingInfo: SystemSettingInfo | null;
  recentAuditLogs: AuditLogSummaryItem[];
}
