CREATE TABLE `business_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`business_name` text NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`logo_url` text,
	`cover_image_url` text,
	`address` text,
	`city` text,
	`state` text,
	`zip` text,
	`phone` text,
	`email` text,
	`website` text,
	`google_maps_url` text,
	`google_place_id` text,
	`primary_color` text DEFAULT ('#4F46E5'),
	`secondary_color` text DEFAULT ('#F59E0B'),
	`facebook_url` text,
	`instagram_url` text,
	`twitter_url` text,
	`linkedin_url` text,
	`business_hours` text,
	`page_views` int NOT NULL DEFAULT 0,
	`review_clicks` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_profiles_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `business_profiles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `business_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_id` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`duration` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` text NOT NULL,
	`password_hash` text,
	`phone` text,
	`company` text,
	`google_maps_url` text,
	`business_type` text,
	`industry` text,
	`challenges` json,
	`profile_complete` boolean NOT NULL DEFAULT false,
	`firebase_uid` varchar(255),
	`google_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_firebase_uid_unique` UNIQUE(`firebase_uid`),
	CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(512) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`author` text NOT NULL,
	`rating` int NOT NULL,
	`text` text NOT NULL DEFAULT (''),
	`date` text NOT NULL DEFAULT (''),
	`source_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_id` int NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text,
	`customer_phone` text,
	`unique_token` varchar(255) NOT NULL,
	`status` text NOT NULL DEFAULT ('pending'),
	`notes` text,
	`send_method` text,
	`sent_at` timestamp,
	`opened_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_requests_unique_token_unique` UNIQUE(`unique_token`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`email_notifications` boolean NOT NULL DEFAULT true,
	`sms_notifications` boolean NOT NULL DEFAULT false,
	`push_notifications` boolean NOT NULL DEFAULT true,
	`marketing_emails` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `business_profiles` ADD CONSTRAINT `business_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_services` ADD CONSTRAINT `business_services_business_id_business_profiles_id_fk` FOREIGN KEY (`business_id`) REFERENCES `business_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_requests` ADD CONSTRAINT `review_requests_business_id_business_profiles_id_fk` FOREIGN KEY (`business_id`) REFERENCES `business_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;