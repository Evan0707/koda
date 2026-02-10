import { pgTable, uuid, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './core'

// ============================================
// COMPANIES
// ============================================
export const companies = pgTable('companies', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 website: text('website'),
 industry: text('industry'),
 size: text('size'), // startup, pme, eti, ge

 // Legal
 siret: text('siret'),
 vatNumber: text('vat_number'),

 // Address
 address: text('address'),
 city: text('city'),
 postalCode: text('postal_code'),
 country: text('country').default('FR'),

 // Enrichment
 logoUrl: text('logo_url'),
 linkedinUrl: text('linkedin_url'),

 // Custom
 customFields: jsonb('custom_fields').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// CONTACTS
// ============================================
export const contacts = pgTable('contacts', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 companyId: uuid('company_id').references(() => companies.id),

 email: text('email'),
 firstName: text('first_name'),
 lastName: text('last_name'),
 phone: text('phone'),
 jobTitle: text('job_title'),

 // Enrichment
 avatarUrl: text('avatar_url'),
 linkedinUrl: text('linkedin_url'),

 // Status
 status: text('status').default('active'), // active, inactive, lead, client
 source: text('source'), // website, referral, linkedin, etc.

 // Custom
 customFields: jsonb('custom_fields').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// PIPELINE STAGES
// ============================================
export const pipelineStages = pgTable('pipeline_stages', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 color: text('color').default('#6366F1'),
 position: integer('position').notNull(),

 // Settings
 isWon: boolean('is_won').default(false),
 isLost: boolean('is_lost').default(false),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// OPPORTUNITIES
// ============================================
export const opportunities = pgTable('opportunities', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 companyId: uuid('company_id').references(() => companies.id),
 contactId: uuid('contact_id').references(() => contacts.id),
 stageId: uuid('stage_id').references(() => pipelineStages.id),
 ownerId: uuid('owner_id').references(() => users.id),

 name: text('name').notNull(),
 value: integer('value').default(0), // In cents
 currency: text('currency').default('EUR'),
 probability: integer('probability').default(50), // 0-100

 expectedCloseDate: timestamp('expected_close_date'),
 closedAt: timestamp('closed_at'),
 lostReason: text('lost_reason'),

 notes: text('notes'),
 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// TAGS
// ============================================
export const tags = pgTable('tags', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 color: text('color').default('#6366F1'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const taggables = pgTable('taggables', {
 id: uuid('id').primaryKey().defaultRandom(),
 tagId: uuid('tag_id').references(() => tags.id).notNull(),

 taggableType: text('taggable_type').notNull(), // company, contact, opportunity, project
 taggableId: uuid('taggable_id').notNull(),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// ACTIVITIES
// ============================================
export const activities = pgTable('activities', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 type: text('type').notNull(), // note, call, email, meeting, task
 content: text('content').notNull(),

 // Polymorphic-like relations
 contactId: uuid('contact_id').references(() => contacts.id),
 companyId: uuid('company_id').references(() => companies.id),
 opportunityId: uuid('opportunity_id').references(() => opportunities.id),

 performedAt: timestamp('performed_at').defaultNow().notNull(),
 createdBy: uuid('created_by').references(() => users.id).notNull(),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations moved to ./relations.ts
