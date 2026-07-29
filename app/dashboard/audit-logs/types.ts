export interface AuditLogItem {
  id: number;
  userId: string;
  action: string;
  module: string;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorNik: string | null;
  actorRoleName: string | null;
}

export interface AuditLogStats {
  totalLogsCount: number;
  todayLogsCount: number;
  uniqueUsersCount: number;
  securityEventsCount: number;
}

export interface AuditLogPagination {
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface AuditLogFilterState {
  search: string;
  module: string;
  dateRange: string;
  page: number;
}
