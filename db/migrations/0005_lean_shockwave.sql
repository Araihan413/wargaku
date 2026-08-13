CREATE TABLE `activation_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`nik` varchar(16) NOT NULL,
	`rental_contract_id` int,
	`family_id` int,
	`expires_at` timestamp NOT NULL,
	`is_used` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activation_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `activation_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`broadcast_id` int NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`dismissed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcast_dismissals_id` PRIMARY KEY(`id`),
	CONSTRAINT `broadcast_user_unique` UNIQUE(`broadcast_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `family_change_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`family_id` int NOT NULL,
	`head_user_id` varchar(255) NOT NULL,
	`status` enum('draft','pending','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`rejection_note` text,
	`family_number` varchar(20),
	`kk_file` varchar(255),
	`draft_data` json NOT NULL,
	`submitted_at` timestamp,
	`reviewed_at` timestamp,
	`reviewed_by_user_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_change_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rental_property_id` int NOT NULL,
	`room_number` varchar(10) NOT NULL,
	`tenant_type` enum('individual','family') NOT NULL,
	`family_id` int,
	`user_id` varchar(255),
	`individual_name` varchar(100),
	`individual_nik` varchar(16),
	`individual_phone` varchar(15),
	`individual_ktp_file` varchar(255),
	`check_in_date` date NOT NULL,
	`check_out_date` date,
	`check_out_note` text,
	`verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`verification_note` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(150) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','maintenance','feature','warning') NOT NULL DEFAULT 'info',
	`send_push` boolean NOT NULL DEFAULT false,
	`send_in_app_notif` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`expires_at` timestamp,
	`created_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`role_id` int NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_role_idx` UNIQUE(`user_id`,`role_id`)
);
--> statement-breakpoint
DROP TABLE `letters`;--> statement-breakpoint
DROP TABLE `rental_residents`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_nik_unique`;--> statement-breakpoint
ALTER TABLE `accounts` DROP FOREIGN KEY `accounts_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `activity_logs` DROP FOREIGN KEY `activity_logs_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `families` DROP FOREIGN KEY `families_dwelling_id_dwellings_id_fk`;
--> statement-breakpoint
ALTER TABLE `family_members` DROP FOREIGN KEY `family_members_family_id_families_id_fk`;
--> statement-breakpoint
ALTER TABLE `fee_rules` DROP FOREIGN KEY `fee_rules_rt_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_role_id_roles_id_fk`;
--> statement-breakpoint
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_permission_id_permissions_id_fk`;
--> statement-breakpoint
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `smart_groups` DROP FOREIGN KEY `smart_groups_rt_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_role_id_roles_id_fk`;
--> statement-breakpoint
ALTER TABLE `activity_logs` MODIFY COLUMN `user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `announcements` MODIFY COLUMN `published_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `cash_transactions` MODIFY COLUMN `status` enum('pending','approved') NOT NULL DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE `complaints` MODIFY COLUMN `photo_path` text;--> statement-breakpoint
ALTER TABLE `dwellings` MODIFY COLUMN `type` enum('permanen','kos','homestay') NOT NULL DEFAULT 'permanen';--> statement-breakpoint
ALTER TABLE `families` MODIFY COLUMN `dwelling_id` int;--> statement-breakpoint
ALTER TABLE `families` MODIFY COLUMN `head_user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `families` MODIFY COLUMN `verification_status` enum('draft','pending','verified','rejected') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `family_members` MODIFY COLUMN `relationship` enum('Kepala_Keluarga','Suami','Istri','Anak','Orang_Tua','Mertua','Sepupu','Lainnya') NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `attachments` text;--> statement-breakpoint
ALTER TABLE `announcements` ADD `attachments` text;--> statement-breakpoint
ALTER TABLE `complaints` ADD `ip_address` varchar(45);--> statement-breakpoint
ALTER TABLE `family_members` ADD `user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `family_members` ADD `inactive_note` varchar(255);--> statement-breakpoint
ALTER TABLE `fee_rules` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `rental_properties` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `system_settings` ADD `emergency_contacts` json;--> statement-breakpoint
ALTER TABLE `system_settings` ADD `latitude` varchar(50);--> statement-breakpoint
ALTER TABLE `system_settings` ADD `longitude` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `push_notifications_enabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_tracking_code_unique` UNIQUE(`tracking_code`);--> statement-breakpoint
ALTER TABLE `families` ADD CONSTRAINT `families_family_number_unique` UNIQUE(`family_number`);--> statement-breakpoint
ALTER TABLE `fee_payments` ADD CONSTRAINT `unique_fee_payment_idx` UNIQUE(`fee_rule_id`,`family_id`,`period`);--> statement-breakpoint
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `unique_role_perm_idx` UNIQUE(`role_id`,`permission_id`);--> statement-breakpoint
ALTER TABLE `roles` ADD CONSTRAINT `roles_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `activation_tokens` ADD CONSTRAINT `activation_tokens_rental_contract_id_rental_contracts_id_fk` FOREIGN KEY (`rental_contract_id`) REFERENCES `rental_contracts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activation_tokens` ADD CONSTRAINT `activation_tokens_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcast_dismissals` ADD CONSTRAINT `broadcast_dismissals_broadcast_id_system_broadcasts_id_fk` FOREIGN KEY (`broadcast_id`) REFERENCES `system_broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcast_dismissals` ADD CONSTRAINT `broadcast_dismissals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_change_requests` ADD CONSTRAINT `family_change_requests_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_change_requests` ADD CONSTRAINT `family_change_requests_head_user_id_users_id_fk` FOREIGN KEY (`head_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_change_requests` ADD CONSTRAINT `family_change_requests_reviewed_by_user_id_users_id_fk` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_rental_property_id_rental_properties_id_fk` FOREIGN KEY (`rental_property_id`) REFERENCES `rental_properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_contracts` ADD CONSTRAINT `rental_contracts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `system_broadcasts` ADD CONSTRAINT `system_broadcasts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activation_tokens_token_idx` ON `activation_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `activation_tokens_email_idx` ON `activation_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `activation_tokens_nik_idx` ON `activation_tokens` (`nik`);--> statement-breakpoint
CREATE INDEX `dismissals_user_id_idx` ON `broadcast_dismissals` (`user_id`);--> statement-breakpoint
CREATE INDEX `family_change_requests_family_idx` ON `family_change_requests` (`family_id`);--> statement-breakpoint
CREATE INDEX `family_change_requests_status_idx` ON `family_change_requests` (`status`);--> statement-breakpoint
CREATE INDEX `family_change_requests_head_user_idx` ON `family_change_requests` (`head_user_id`);--> statement-breakpoint
CREATE INDEX `rental_contracts_property_idx` ON `rental_contracts` (`rental_property_id`);--> statement-breakpoint
CREATE INDEX `rental_contracts_family_idx` ON `rental_contracts` (`family_id`);--> statement-breakpoint
CREATE INDEX `rental_contracts_user_idx` ON `rental_contracts` (`user_id`);--> statement-breakpoint
CREATE INDEX `rental_contracts_tenant_type_idx` ON `rental_contracts` (`tenant_type`);--> statement-breakpoint
CREATE INDEX `rental_contracts_verification_status_idx` ON `rental_contracts` (`verification_status`);--> statement-breakpoint
CREATE INDEX `rental_contracts_is_active_idx` ON `rental_contracts` (`is_active`);--> statement-breakpoint
CREATE INDEX `rental_contracts_check_in_idx` ON `rental_contracts` (`check_in_date`);--> statement-breakpoint
CREATE INDEX `rental_contracts_individual_nik_idx` ON `rental_contracts` (`individual_nik`);--> statement-breakpoint
CREATE INDEX `system_broadcasts_is_active_idx` ON `system_broadcasts` (`is_active`);--> statement-breakpoint
CREATE INDEX `system_broadcasts_created_at_idx` ON `system_broadcasts` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_roles_user_id_idx` ON `user_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_roles_role_id_idx` ON `user_roles` (`role_id`);--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `families` ADD CONSTRAINT `families_dwelling_id_dwellings_id_fk` FOREIGN KEY (`dwelling_id`) REFERENCES `dwellings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `family_members` ADD CONSTRAINT `family_members_family_id_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `accounts_provider_idx` ON `accounts` (`provider_id`);--> statement-breakpoint
CREATE INDEX `activities_event_date_idx` ON `activities` (`event_date`);--> statement-breakpoint
CREATE INDEX `activities_created_by_idx` ON `activities` (`created_by`);--> statement-breakpoint
CREATE INDEX `activity_logs_created_at_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_logs_user_id_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_module_idx` ON `activity_logs` (`module`);--> statement-breakpoint
CREATE INDEX `announcements_created_by_idx` ON `announcements` (`created_by`);--> statement-breakpoint
CREATE INDEX `announcements_is_pinned_idx` ON `announcements` (`is_pinned`);--> statement-breakpoint
CREATE INDEX `announcements_category_idx` ON `announcements` (`category`);--> statement-breakpoint
CREATE INDEX `announcements_published_at_idx` ON `announcements` (`published_at`);--> statement-breakpoint
CREATE INDEX `cash_transactions_date_idx` ON `cash_transactions` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `cash_transactions_type_idx` ON `cash_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `cash_transactions_status_idx` ON `cash_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `complaints_tracking_idx` ON `complaints` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `complaints_status_idx` ON `complaints` (`status`);--> statement-breakpoint
CREATE INDEX `complaints_dwelling_idx` ON `complaints` (`dwelling_id`);--> statement-breakpoint
CREATE INDEX `complaints_category_idx` ON `complaints` (`category`);--> statement-breakpoint
CREATE INDEX `complaints_created_at_idx` ON `complaints` (`created_at`);--> statement-breakpoint
CREATE INDEX `dwellings_owner_user_idx` ON `dwellings` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `dwellings_type_idx` ON `dwellings` (`type`);--> statement-breakpoint
CREATE INDEX `dwellings_qr_token_idx` ON `dwellings` (`qr_token`);--> statement-breakpoint
CREATE INDEX `families_dwelling_idx` ON `families` (`dwelling_id`);--> statement-breakpoint
CREATE INDEX `families_head_user_idx` ON `families` (`head_user_id`);--> statement-breakpoint
CREATE INDEX `families_verification_status_idx` ON `families` (`verification_status`);--> statement-breakpoint
CREATE INDEX `families_family_number_idx` ON `families` (`family_number`);--> statement-breakpoint
CREATE INDEX `families_is_active_idx` ON `families` (`is_active`);--> statement-breakpoint
CREATE INDEX `family_members_family_idx` ON `family_members` (`family_id`);--> statement-breakpoint
CREATE INDEX `family_members_user_idx` ON `family_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `family_members_relationship_idx` ON `family_members` (`relationship`);--> statement-breakpoint
CREATE INDEX `fee_payments_family_idx` ON `fee_payments` (`family_id`);--> statement-breakpoint
CREATE INDEX `fee_payments_rule_idx` ON `fee_payments` (`fee_rule_id`);--> statement-breakpoint
CREATE INDEX `fee_payments_period_idx` ON `fee_payments` (`period`);--> statement-breakpoint
CREATE INDEX `fee_payments_status_idx` ON `fee_payments` (`status`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_is_read_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `permissions_module_idx` ON `permissions` (`module`);--> statement-breakpoint
CREATE INDEX `rental_properties_dwelling_idx` ON `rental_properties` (`dwelling_id`);--> statement-breakpoint
CREATE INDEX `rental_properties_coordinator_idx` ON `rental_properties` (`coordinator_user_id`);--> statement-breakpoint
CREATE INDEX `rental_properties_is_active_idx` ON `rental_properties` (`is_active`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
ALTER TABLE `dwellings` DROP COLUMN `owner_name`;--> statement-breakpoint
ALTER TABLE `dwellings` DROP COLUMN `owner_phone`;--> statement-breakpoint
ALTER TABLE `families` DROP COLUMN `head_name`;--> statement-breakpoint
ALTER TABLE `families` DROP COLUMN `unit_number`;--> statement-breakpoint
ALTER TABLE `families` DROP COLUMN `check_in_date`;--> statement-breakpoint
ALTER TABLE `families` DROP COLUMN `check_out_date`;--> statement-breakpoint
ALTER TABLE `family_members` DROP COLUMN `inactive_reason`;--> statement-breakpoint
ALTER TABLE `fee_rules` DROP COLUMN `rt_id`;--> statement-breakpoint
ALTER TABLE `smart_groups` DROP COLUMN `rt_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `nik`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `family_number`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `dwelling_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `unit_number`;