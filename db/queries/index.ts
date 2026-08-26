// ==========================================
// CENTRAL QUERY BARREL EXPORTER (DOMAIN-DRIVEN)
// ==========================================

// 1. Modul Autentikasi & RBAC
export * from './auth/user.queries';
export * from './auth/activation.queries';

// 2. Modul Kependudukan & Hunian
export * from './population/dwelling.queries';
export * from './population/family.queries';
export * from './population/family-member.queries';

// 3. Modul Properti & Sewa
export * from './property/rental-property.queries';
export * from './property/tenant.queries';

// 4. Modul Keuangan & Iuran
export * from './finance/cash.queries';
export * from './finance/fee.queries';
export * from './finance/warga-fee.queries';

// 5. Modul Komunikasi & Pengaduan
export * from './communication/announcement.queries';
export * from './communication/activity.queries';
export * from './communication/complaint.queries';

// 6. Modul Audit, Sistem & RBAC
export * from './system/audit-log.queries';
export * from './system/notification.queries';
export * from './system/smart-group.queries';
export * from './system/system-setting.queries';
export * from './system/approval.queries';
export * from './system/permission.queries';
export * from './system/document.queries';


// 7. Modul Dashboard & Portal Publik
export * from './dashboard/internal-dashboard.queries';
export * from './dashboard/public-portal.queries';

// 8. Modul Laporan & Rekapitulasi
export * from './reports';
