import {
  mysqlTable,
  varchar,
  text,
  mysqlEnum,
  timestamp,
  boolean,
  int,
  decimal,
  date,
  datetime,
  json,
  unique,
} from 'drizzle-orm/mysql-core';

// 2. roles
export const roles = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 1. users
export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: varchar('image', { length: 255 }),
  password: varchar('password', { length: 255 }),
  nik: varchar('nik', { length: 16 }).unique(),
  phone: varchar('phone', { length: 15 }),
  photo: varchar('photo', { length: 255 }),
  roleId: int('role_id').notNull().references(() => roles.id),
  status: mysqlEnum('status', ['pending', 'active', 'suspended']).notNull().default('pending'),
  familyNumber: varchar('family_number', { length: 20 }),
  dwellingId: int('dwelling_id'),
  unitNumber: varchar('unit_number', { length: 10 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// 3. permissions
export const permissions = mysqlTable('permissions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 4. role_permissions
export const rolePermissions = mysqlTable('role_permissions', {
  id: int('id').autoincrement().primaryKey(),
  roleId: int('role_id').notNull().references(() => roles.id),
  permissionId: int('permission_id').notNull().references(() => permissions.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 5. dwellings
export const dwellings = mysqlTable('dwellings', {
  id: int('id').autoincrement().primaryKey(),
  blockNumber: varchar('block_number', { length: 20 }).notNull(),
  houseNumber: varchar('house_number', { length: 20 }).notNull(),
  ownerUserId: varchar('owner_user_id', { length: 255 }).references(() => users.id),
  ownerName: varchar('owner_name', { length: 100 }),
  ownerPhone: varchar('owner_phone', { length: 15 }),
  qrToken: varchar('qr_token', { length: 100 }).notNull().unique(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  type: mysqlEnum('type', ['permanen', 'kos', 'homestay']).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueAddressIdx: unique('unique_address_idx').on(table.blockNumber, table.houseNumber),
}));

// 6. families
export const families = mysqlTable('families', {
  id: int('id').autoincrement().primaryKey(),
  dwellingId: int('dwelling_id').notNull().references(() => dwellings.id),
  familyNumber: varchar('family_number', { length: 20 }).notNull(),
  headUserId: varchar('head_user_id', { length: 255 }).notNull().references(() => users.id),
  headName: varchar('head_name', { length: 100 }).notNull(),
  unitNumber: varchar('unit_number', { length: 10 }),
  kkFile: varchar('kk_file', { length: 255 }),
  verificationStatus: mysqlEnum('verification_status', ['pending', 'verified', 'rejected']).notNull().default('pending'),
  verificationNote: text('verification_note'),
  checkInDate: date('check_in_date').notNull(),
  checkOutDate: date('check_out_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 7. family_members
export const familyMembers = mysqlTable('family_members', {
  id: int('id').autoincrement().primaryKey(),
  familyId: int('family_id').notNull().references(() => families.id),
  name: varchar('name', { length: 100 }).notNull(),
  nik: varchar('nik', { length: 16 }).notNull().unique(),
  birthPlace: varchar('birth_place', { length: 50 }),
  birthDate: date('birth_date'),
  gender: mysqlEnum('gender', ['L', 'P']).notNull(),
  relationship: mysqlEnum('relationship', ['Kepala_Keluarga', 'Suami', 'Istri', 'Anak', 'Orang_Tua', 'Lainnya']).notNull(),
  occupation: varchar('occupation', { length: 50 }),
  educationLevel: varchar('education_level', { length: 50 }),
  religion: mysqlEnum('religion', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']),
  phone: varchar('phone', { length: 15 }),
  ktpFile: varchar('ktp_file', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  inactiveReason: mysqlEnum('inactive_reason', ['pindah', 'meninggal']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 8. rental_properties
export const rentalProperties = mysqlTable('rental_properties', {
  id: int('id').autoincrement().primaryKey(),
  dwellingId: int('dwelling_id').notNull().references(() => dwellings.id),
  name: varchar('name', { length: 100 }).notNull(),
  coordinatorUserId: varchar('coordinator_user_id', { length: 255 }).references(() => users.id),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 15 }),
  totalRooms: int('total_rooms').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 9. rental_residents
export const rentalResidents = mysqlTable('rental_residents', {
  id: int('id').autoincrement().primaryKey(),
  rentalPropertyId: int('rental_property_id').notNull().references(() => rentalProperties.id),
  tenantType: mysqlEnum('tenant_type', ['perorangan', 'keluarga']).notNull(),
  familyId: int('family_id').references(() => families.id),
  name: varchar('name', { length: 100 }).notNull(),
  nik: varchar('nik', { length: 16 }).notNull().unique(),
  phone: varchar('phone', { length: 15 }),
  originAddress: text('origin_address'),
  occupation: varchar('occupation', { length: 50 }),
  educationLevel: varchar('education_level', { length: 50 }),
  religion: mysqlEnum('religion', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']),
  roomNumber: varchar('room_number', { length: 10 }),
  checkInDate: date('check_in_date').notNull(),
  checkOutDate: date('check_out_date'),
  ktpFile: varchar('ktp_file', { length: 255 }),
  verificationStatus: mysqlEnum('verification_status', ['pending', 'verified', 'rejected']).notNull().default('pending'),
  verificationNote: text('verification_note'),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  updatedBy: varchar('updated_by', { length: 255 }).references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  inactiveReason: mysqlEnum('inactive_reason', ['pindah', 'meninggal']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 10. cash_transactions
export const cashTransactions = mysqlTable('cash_transactions', {
  id: int('id').autoincrement().primaryKey(),
  type: mysqlEnum('type', ['income', 'expense']).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  receiptFile: varchar('receipt_file', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'approved']).notNull().default('pending'),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  approvedBy: varchar('approved_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 11. announcements
export const announcements = mysqlTable('announcements', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  category: mysqlEnum('category', ['umum', 'penting', 'mendesak']).notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  pinUntil: timestamp('pin_until'),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 12. activities
export const activities = mysqlTable('activities', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  eventDate: datetime('event_date').notNull(),
  location: varchar('location', { length: 255 }),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 13. letters
export const letters = mysqlTable('letters', {
  id: int('id').autoincrement().primaryKey(),
  familyMemberId: int('family_member_id').notNull().references(() => familyMembers.id),
  letterType: varchar('letter_type', { length: 100 }).notNull(),
  numberManual: varchar('number_manual', { length: 50 }),
  purpose: text('purpose').notNull(),
  notes: text('notes'),
  supportingDocument: varchar('supporting_document', { length: 255 }),
  status: mysqlEnum('status', ['menunggu_review', 'sedang_diproses', 'siap_diambil', 'selesai', 'ditolak']).notNull().default('menunggu_review'),
  createdBy: varchar('created_by', { length: 255 }).references(() => users.id),
  approvedBy: varchar('approved_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 14. complaints
export const complaints = mysqlTable('complaints', {
  id: int('id').autoincrement().primaryKey(),
  trackingCode: varchar('tracking_code', { length: 20 }).notNull(),
  reporterName: varchar('reporter_name', { length: 100 }).notNull(),
  reporterPhone: varchar('reporter_phone', { length: 15 }),
  category: mysqlEnum('category', ['Infrastruktur', 'Kebersihan', 'Keamanan', 'Sosial', 'Lainnya']).notNull(),
  description: text('description').notNull(),
  photoPath: varchar('photo_path', { length: 255 }),
  dwellingId: int('dwelling_id').references(() => dwellings.id),
  status: mysqlEnum('status', ['menunggu', 'proses', 'selesai', 'ditolak']).notNull().default('menunggu'),
  responseNote: text('response_note'),
  handledBy: varchar('handled_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// 15. activity_logs
export const activityLogs = mysqlTable('activity_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 16. smart_groups
export const smartGroups = mysqlTable('smart_groups', {
  id: int('id').autoincrement().primaryKey(),
  rtId: varchar('rt_id', { length: 255 }).notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  queryRules: json('query_rules').notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 17. fee_rules
export const feeRules = mysqlTable('fee_rules', {
  id: int('id').autoincrement().primaryKey(),
  rtId: varchar('rt_id', { length: 255 }).notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 18. fee_payments
export const feePayments = mysqlTable('fee_payments', {
  id: int('id').autoincrement().primaryKey(),
  feeRuleId: int('fee_rule_id').notNull().references(() => feeRules.id),
  familyId: int('family_id').notNull().references(() => families.id),
  period: varchar('period', { length: 7 }).notNull(), // format YYYY-MM
  amountBilled: decimal('amount_billed', { precision: 15, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull().default('0.00'),
  paymentDate: date('payment_date'),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'transfer']),
  status: mysqlEnum('status', ['unpaid', 'partially_paid', 'paid']).notNull().default('unpaid'),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  recordedBy: varchar('recorded_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 19. notifications
export const notifications = mysqlTable('notifications', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  title: varchar('title', { length: 150 }).notNull(),
  message: text('message').notNull(),
  category: mysqlEnum('category', ['personal', 'dinas']).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  redirectLink: varchar('redirect_link', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 20. system_settings
export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey(), // selalu bernilai 1 karena konfigurasi global hanya ada satu
  rtName: varchar('rt_name', { length: 50 }).notNull(),
  rwName: varchar('rw_name', { length: 50 }).notNull(),
  villageName: varchar('village_name', { length: 100 }).notNull(),
  subdistrict: varchar('subdistrict', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  secretariatAddress: text('secretariat_address'),
  logoPath: varchar('logo_path', { length: 255 }),
  officialEmail: varchar('official_email', { length: 100 }),
  officialRtPhone: varchar('official_rt_phone', { length: 15 }),
  officialSecretaryPhone: varchar('official_secretary_phone', { length: 15 }),
  officialTreasurerPhone: varchar('official_treasurer_phone', { length: 15 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Better Auth - sessions
export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
});

// Better Auth - accounts
export const accounts = mysqlTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Better Auth - verifications
export const verifications = mysqlTable('verifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});