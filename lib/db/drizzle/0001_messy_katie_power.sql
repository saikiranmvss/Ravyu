CREATE TABLE `industry_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_id` int NOT NULL,
	`industry` varchar(64) NOT NULL,
	`sub_industry` varchar(128),
	`risk_sensitive_mode` boolean NOT NULL DEFAULT false,
	`multi_outlet` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `industry_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `industry_profiles_business_id_unique` UNIQUE(`business_id`)
);
--> statement-breakpoint
CREATE TABLE `review_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`review_id` int NOT NULL,
	`business_id` int NOT NULL,
	`user_id` int NOT NULL,
	`industry` varchar(64) NOT NULL,
	`entity_name` varchar(255),
	`aspect` varchar(64) NOT NULL,
	`sentiment` varchar(32) NOT NULL,
	`reason` text,
	`confidence` double NOT NULL DEFAULT 0.75,
	`severity` varchar(32) NOT NULL DEFAULT 'low',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_id` int NOT NULL,
	`industry` varchar(64) NOT NULL,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`summary` text NOT NULL,
	`top_wins` json NOT NULL,
	`attention_areas` json NOT NULL,
	`recommended_action` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `industry_profiles` ADD CONSTRAINT `industry_profiles_business_id_business_profiles_id_fk` FOREIGN KEY (`business_id`) REFERENCES `business_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_insights` ADD CONSTRAINT `review_insights_review_id_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_insights` ADD CONSTRAINT `review_insights_business_id_business_profiles_id_fk` FOREIGN KEY (`business_id`) REFERENCES `business_profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_insights` ADD CONSTRAINT `review_insights_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekly_reports` ADD CONSTRAINT `weekly_reports_business_id_business_profiles_id_fk` FOREIGN KEY (`business_id`) REFERENCES `business_profiles`(`id`) ON DELETE cascade ON UPDATE no action;