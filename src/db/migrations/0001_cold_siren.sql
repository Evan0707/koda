ALTER TABLE "organizations" ADD COLUMN "stripe_secret_key" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_publishable_key" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_webhook_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gmail_connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "link" text;