import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './core'
import { companies, contacts } from './crm'

// ============================================
// CONTRACT TEMPLATES
// ============================================
export const contractTemplates = pgTable('contract_templates', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 description: text('description'),

 content: text('content').notNull(), // HTML/Markdown template

 category: text('category'), // nda, freelance, service, custom

 isPublic: text('is_public').default('false'), // Shared templates

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// CONTRACTS
// ============================================
export const contracts = pgTable('contracts', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 templateId: uuid('template_id').references(() => contractTemplates.id),
 companyId: uuid('company_id').references(() => companies.id),
 contactId: uuid('contact_id').references(() => contacts.id),
 createdById: uuid('created_by_id').references(() => users.id),

 title: text('title').notNull(),
 content: text('content').notNull(),

 status: text('status').default('draft'), // draft, sent, signed, expired, cancelled

 // Versioning
 version: integer('version').default(1),

 // Signature
 signedAt: timestamp('signed_at'),
 signatureData: jsonb('signature_data'),

 // Validity
 effectiveDate: timestamp('effective_date'),
 expirationDate: timestamp('expiration_date'),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// RELATIONS
// ============================================
export const contractsRelations = relations(contracts, ({ one }) => ({
 organization: one(organizations, {
  fields: [contracts.organizationId],
  references: [organizations.id],
 }),
 template: one(contractTemplates, {
  fields: [contracts.templateId],
  references: [contractTemplates.id],
 }),
 company: one(companies, {
  fields: [contracts.companyId],
  references: [companies.id],
 }),
 contact: one(contacts, {
  fields: [contracts.contactId],
  references: [contacts.id],
 }),
 createdBy: one(users, {
  fields: [contracts.createdById],
  references: [users.id],
 }),
}))
