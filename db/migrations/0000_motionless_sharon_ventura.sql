CREATE TABLE `accounts` (
	`id` varchar(255) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`expires_at` timestamp,
	`password` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`event_date` datetime NOT NULL,
	`location` varchar(255),
	`is_pinned` boolean NOT NULL DEFAULT false,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`module` varchar(50) NOT NULL,
	`description` text,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`category` enum('umum','penting','mendesak') NOT NULL,
	`is_pinned` boolean NOT NULL DEFAULT false,
	`pin_until` timestamp,
	`created_by` int NOT NULL,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cash_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`transaction_date` date NOT NULL,
	`category` varchar(50) NOT NULL,
	`description` text,
	`receipt_file` varchar(255),
	`status` enum('pending','approved') NOT NULL DEFAULT 'pending',
	`created_by` int NOT NULL,
	`approved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tracking_code` varchar(20) NOT NULL,
	`reporter_name` varchar(100) NOT NULL,
	`reporter_phone` varchar(15),
	`category` enum('Infrastruktur','Kebersihan','Keamanan','Sosial','Lainnya') NOT NULL,
	`description` text NOT NULL,
	`photo_path` varchar(255),
	`dwelling_id` int,
	`status` enum('menunggu','proses','selesai','ditolak') NOT NULL DEFAULT 'menunggu',
	`response_note` text,
	`handled_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dwellings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`street_name` varchar(100) NOT NULL,
	`block_number` varchar(20),
	`house_number` varchar(20),
	`owner_user_id` int,
	`owner_name` varchar(100),
	`owner_phone` varchar(15),
	`qr_token` varchar(100) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`type` enum('permanen','kos','homestay') NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dwellings_id` PRIMARY KEY(`id`),
	CONSTRAINT `dwellings_qr_token_unique` UNIQUE(`qr_token`)
);
--> statement-breakpoint
CREATE TABLE `families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dwelling_id` int NOT NULL,
	`family_number` varchar(20) NOT NULL,
	`head_user_id` int NOT NULL,
	`head_name` varchar(100) NOT NULL,
	`unit_number` varchar(10),
	`kk_file` varchar(255),
	`verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`verification_note` text,
	`check_in_date` date NOT NULL,
	`check_out_date` date,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `families_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`family_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`nik` varchar(16) NOT NULL,
	`birth_place` varchar(50),
	`birth_date` date,
	`gender` enum('L','P') NOT NULL,
	`relationship` enum('Kepala_Keluarga','Istri','Anak','Orang_Tua','Lainnya') NOT NULL,
	`occupation` varchar(50),
	`education_level` varchar(50),
	`phone` varchar(15),
	`ktp_file` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`inactive_reason` enum('pindah','meninggal'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_members_nik_unique` UNIQUE(`nik`)
);
--> statement-breakpoint
CREATE TABLE `fee_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fee_rule_id` int NOT NULL,
	`family_id` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`amount_billed` decimal(15,2) NOT NULL,
	`amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
	`payment_date` date,
	`payment_method` enum('cash','transfer'),
	`status` enum('unpaid','partially_paid','paid') NOT NULL DEFAULT 'unpaid',
	`is_mandatory` boolean NOT NULL DEFAULT true,
	`recorded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fee_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rt_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`is_mandatory` boolean NOT NULL DEFAULT true,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fee_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`family_member_id` int NOT NULL,
	`letter_type` varchar(100) NOT NULL,
	`number_manual` varchar(50),
	`purpose` text NOT NULL,
	`notes` text,
	`supporting_document` varchar(255),
	`status` enum('menunggu_review','sedang_diproses','siap_diambil','selesai','ditolak') NOT NULL DEFAULT 'menunggu_review',
	`created_by` int,
	`approved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(150) NOT NULL,
	`message` text NOT NULL,
	`category` enum('personal','dinas') NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`redirect_link` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`module` varchar(50) NOT NULL,
	`description` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dwelling_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`coordinator_user_id` int,
	`contact_person` varchar(100),
	`phone` varchar(15),
	`total_rooms` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_residents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rental_property_id` int NOT NULL,
	`tenant_type` enum('perorangan','keluarga') NOT NULL,
	`family_id` int,
	`name` varchar(100) NOT NULL,
	`nik` varchar(16) NOT NULL,
	`phone` varchar(15),
	`origin_address` text,
	`occupation` varchar(50),
	`education_level` varchar(50),
	`room_number` varchar(10),
	`check_in_date` date NOT NULL,
	`check_out_date` date,
	`ktp_file` varchar(255),
	`verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`verification_note` text,
	`created_by` int NOT NULL,
	`updated_by` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`inactive_reason` enum('pindah','meninggal'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_residents_id` PRIMARY KEY(`id`),
	CONSTRAINT `rental_residents_nik_unique` UNIQUE(`nik`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_id` int NOT NULL,
	`permission_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` text,
	`user_id` int NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `smart_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rt_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`query_rules` json NOT NULL,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smart_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int NOT NULL,
	`rt_name` varchar(50) NOT NULL,
	`rw_name` varchar(50) NOT NULL,
	`village_name` varchar(100) NOT NULL,
	`subdistrict` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`secretariat_address` text,
	`logo_path` varchar(255),
	`official_email` varchar(100),
	`official_rt_phone` varchar(15),
	`official_secretary_phone` varchar(15),
	`official_treasurer_phone` varchar(15),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` varchar(255),
	`password` varchar(255),
	`nik` varchar(16),
	`phone` varchar(15),
	`photo` varchar(255),
	`role_id` int NOT NULL,
	`status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
	`family_number` varchar(20),
	`dwelling_id` int,
	`unit_number` varchar(10),
	`manual_address` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_nik_unique` UNIQUE(`nik`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(255) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cash_transactions` ADD CONSTRAINT `cash_transactions_approved_by_users_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_dwelling_id_dwellings_id_fk` FOREIGN KEY (`dwelling_id`) REFERENCES `dwellings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_handled_by_users_id_fk` FOREIGN KEY (`handled_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dwellings` ADD CONSTRAINT `dwellings_owner_user_id_users_id_fk` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `families` ADD CONSTRAINT `families_dwelling_id_dwellings_id_fk` FOREIGN KEY (`dwelling_id`) REFERENCES `dwellings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `families` ADD CONSTRAINT `families_head_user_id_users_id_fk` FOREIGN KEY (`head_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_payments` ADD CONSTRAINT `fee_payments_fee_rule_id_fee_rules_id_fk` FOREIGN KEY (`fee_rule_id`) REFERENCES `fee_rules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_payments` ADD CONSTRAINT `fee_payments_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_payments` ADD CONSTRAINT `fee_payments_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_rules` ADD CONSTRAINT `fee_rules_rt_id_users_id_fk` FOREIGN KEY (`rt_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fee_rules` ADD CONSTRAINT `fee_rules_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_family_member_id_family_members_id_fk` FOREIGN KEY (`family_member_id`) REFERENCES `family_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `letters` ADD CONSTRAINT `letters_approved_by_users_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_properties` ADD CONSTRAINT `rental_properties_dwelling_id_dwellings_id_fk` FOREIGN KEY (`dwelling_id`) REFERENCES `dwellings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_properties` ADD CONSTRAINT `rental_properties_coordinator_user_id_users_id_fk` FOREIGN KEY (`coordinator_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_residents` ADD CONSTRAINT `rental_residents_rental_property_id_rental_properties_id_fk` FOREIGN KEY (`rental_property_id`) REFERENCES `rental_properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_residents` ADD CONSTRAINT `rental_residents_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_residents` ADD CONSTRAINT `rental_residents_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_residents` ADD CONSTRAINT `rental_residents_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `smart_groups` ADD CONSTRAINT `smart_groups_rt_id_users_id_fk` FOREIGN KEY (`rt_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `smart_groups` ADD CONSTRAINT `smart_groups_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;