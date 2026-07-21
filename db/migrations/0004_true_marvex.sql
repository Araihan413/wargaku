ALTER TABLE `dwellings` DROP INDEX `unique_address_idx`;--> statement-breakpoint
ALTER TABLE `dwellings` MODIFY COLUMN `block_number` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `dwellings` MODIFY COLUMN `house_number` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `dwellings` ADD CONSTRAINT `unique_address_idx` UNIQUE(`block_number`,`house_number`);--> statement-breakpoint
ALTER TABLE `dwellings` DROP COLUMN `street_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `manual_address`;