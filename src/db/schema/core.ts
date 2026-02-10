import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================
// ORGANIZATIONS
// ============================================
export const organizations = pgTable('organizations', {
 id: uuid('id').primaryKey().defaultRandom(),
 name: text('name').notNull(),
 slug: text('slug').notNull().unique(),

 // Legal info
 legalName: text('legal_name'),
 siret: text('siret'),
 vatNumber: text('vat_number'),
 address: text('address'),
 city: text('city'),
 postalCode: text('postal_code'),
 country: text('country').default('FR'),

 // Settings
 defaultCurrency: text('default_currency').default('EUR'),
 timezone: text('timezone').default('Europe/Paris'),
 locale: text('locale').default('fr'),

 // Customization
 logoUrl: text('logo_url'),
 preferences: jsonb('preferences').default({}),

 // Stripe Configuration
 stripeSecretKey: text('stripe_secret_key'),
 stripePublishableKey: text('stripe_publishable_key'),
 stripeWebhookSecret: text('stripe_webhook_secret'),

 // Timestamps
 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// USERS
// ============================================
export const users = pgTable('users', {
 id: uuid('id').primaryKey(), // This comes from Supabase Auth
 organizationId: uuid('organization_id').references(() => organizations.id),

 email: text('email').notNull().unique(),
 firstName: text('first_name'),
 lastName: text('last_name'),
 phone: text('phone'),
 avatarUrl: text('avatar_url'),

 role: text('role').default('member').notNull(), // owner, admin, member
 isActive: boolean('is_active').default(true),

 preferences: jsonb('preferences').default({}),

 // Gmail OAuth
 gmailAccessToken: text('gmail_access_token'),
 gmailRefreshToken: text('gmail_refresh_token'),
 gmailEmail: text('gmail_email'),
 gmailConnectedAt: timestamp('gmail_connected_at'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// Relations moved to ./relations.ts
