ALTER TABLE `letters` DROP FOREIGN KEY `letters_family_member_id_family_members_id_fk`;
ALTER TABLE `letters` DROP FOREIGN KEY `letters_created_by_users_id_fk`;
ALTER TABLE `letters` DROP FOREIGN KEY `letters_approved_by_users_id_fk`;
DROP TABLE IF EXISTS `letters`;
