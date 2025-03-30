CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
