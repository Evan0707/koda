import { relations } from 'drizzle-orm'
import { organizations, users } from './core'
import { companies, contacts, opportunities, pipelineStages, activities, tags, taggables } from './crm'
import { products, quotes, quoteItems, invoices, invoiceItems, payments } from './billing'
import { projects, tasks, cycles, timeEntries } from './projects'
import { contracts } from './legal'
import { notifications } from './collaboration'
import { automationRules, automationLogs } from './automation'
import { auditLogs } from './audit'

// ============================================
// CORE RELATIONS
// ============================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
 users: many(users),
}))

export const usersRelations = relations(users, ({ one }) => ({
 organization: one(organizations, {
  fields: [users.organizationId],
  references: [organizations.id],
 }),
}))

// ============================================
// CRM RELATIONS
// ============================================

export const activitiesRelations = relations(activities, ({ one }) => ({
 organization: one(organizations, {
  fields: [activities.organizationId],
  references: [organizations.id],
 }),
 contact: one(contacts, {
  fields: [activities.contactId],
  references: [contacts.id],
 }),
 company: one(companies, {
  fields: [activities.companyId],
  references: [companies.id],
 }),
 opportunity: one(opportunities, {
  fields: [activities.opportunityId],
  references: [opportunities.id],
 }),
 creator: one(users, {
  fields: [activities.createdBy],
  references: [users.id],
 }),
}))

export const companiesRelations = relations(companies, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [companies.organizationId],
  references: [organizations.id],
 }),
 contacts: many(contacts),
 opportunities: many(opportunities),
 activities: many(activities),
 taggables: many(taggables),
}))

export const contactsRelations = relations(contacts, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [contacts.organizationId],
  references: [organizations.id],
 }),
 company: one(companies, {
  fields: [contacts.companyId],
  references: [companies.id],
 }),
 opportunities: many(opportunities),
 activities: many(activities),
 taggables: many(taggables),
}))

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [opportunities.organizationId],
  references: [organizations.id],
 }),
 company: one(companies, {
  fields: [opportunities.companyId],
  references: [companies.id],
 }),
 contact: one(contacts, {
  fields: [opportunities.contactId],
  references: [contacts.id],
 }),
 stage: one(pipelineStages, {
  fields: [opportunities.stageId],
  references: [pipelineStages.id],
 }),
 owner: one(users, {
  fields: [opportunities.ownerId],
  references: [users.id],
 }),
 activities: many(activities),
 taggables: many(taggables),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [tags.organizationId],
  references: [organizations.id],
 }),
 taggables: many(taggables),
}))

export const taggablesRelations = relations(taggables, ({ one }) => ({
 tag: one(tags, {
  fields: [taggables.tagId],
  references: [tags.id],
 }),
 company: one(companies, {
  fields: [taggables.taggableId],
  references: [companies.id],
 }),
 contact: one(contacts, {
  fields: [taggables.taggableId],
  references: [contacts.id],
 }),
 opportunity: one(opportunities, {
  fields: [taggables.taggableId],
  references: [opportunities.id],
 }),
}))

// ============================================
// BILLING RELATIONS
// ============================================

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
 quote: one(quotes, {
  fields: [quoteItems.quoteId],
  references: [quotes.id],
 }),
 product: one(products, {
  fields: [quoteItems.productId],
  references: [products.id],
 }),
}))

export const quotesRelations = relations(quotes, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [quotes.organizationId],
  references: [organizations.id],
 }),
 company: one(companies, {
  fields: [quotes.companyId],
  references: [companies.id],
 }),
 contact: one(contacts, {
  fields: [quotes.contactId],
  references: [contacts.id],
 }),
 createdBy: one(users, {
  fields: [quotes.createdById],
  references: [users.id],
 }),
 items: many(quoteItems),
 invoices: many(invoices),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [invoices.organizationId],
  references: [organizations.id],
 }),
 company: one(companies, {
  fields: [invoices.companyId],
  references: [companies.id],
 }),
 contact: one(contacts, {
  fields: [invoices.contactId],
  references: [contacts.id],
 }),
 quote: one(quotes, {
  fields: [invoices.quoteId],
  references: [quotes.id],
 }),
 project: one(projects, {
  fields: [invoices.projectId],
  references: [projects.id],
 }),
 items: many(invoiceItems),
 payments: many(payments),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
 invoice: one(invoices, {
  fields: [invoiceItems.invoiceId],
  references: [invoices.id],
 }),
 product: one(products, {
  fields: [invoiceItems.productId],
  references: [products.id],
 }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
 organization: one(organizations, {
  fields: [payments.organizationId],
  references: [organizations.id],
 }),
 invoice: one(invoices, {
  fields: [payments.invoiceId],
  references: [invoices.id],
 }),
}))

// ============================================
// PROJECT RELATIONS
// ============================================

export const projectsRelations = relations(projects, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [projects.organizationId],
  references: [organizations.id],
 }),
 company: one(companies, {
  fields: [projects.companyId],
  references: [companies.id],
 }),
 quote: one(quotes, {
  fields: [projects.quoteId],
  references: [quotes.id],
 }),
 owner: one(users, {
  fields: [projects.ownerId],
  references: [users.id],
 }),
 manager: one(users, {
  fields: [projects.managerId],
  references: [users.id],
 }),
 cycles: many(cycles),
 tasks: many(tasks),
 timeEntries: many(timeEntries),
 invoices: many(invoices),
 contracts: many(contracts),
}))

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
 project: one(projects, {
  fields: [cycles.projectId],
  references: [projects.id],
 }),
 tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [tasks.organizationId],
  references: [organizations.id],
 }),
 project: one(projects, {
  fields: [tasks.projectId],
  references: [projects.id],
 }),
 cycle: one(cycles, {
  fields: [tasks.cycleId],
  references: [cycles.id],
 }),
 assignee: one(users, {
  fields: [tasks.assigneeId],
  references: [users.id],
 }),
 timeEntries: many(timeEntries),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
 organization: one(organizations, {
  fields: [timeEntries.organizationId],
  references: [organizations.id],
 }),
 project: one(projects, {
  fields: [timeEntries.projectId],
  references: [projects.id],
 }),
 task: one(tasks, {
  fields: [timeEntries.taskId],
  references: [tasks.id],
 }),
 user: one(users, {
  fields: [timeEntries.userId],
  references: [users.id],
 }),
}))

// ============================================
// AUTOMATION RELATIONS
// ============================================

export const notificationsRelations = relations(notifications, ({ one }) => ({
 organization: one(organizations, {
  fields: [notifications.organizationId],
  references: [organizations.id],
 }),
 user: one(users, {
  fields: [notifications.userId],
  references: [users.id],
 }),
}))

export const automationRulesRelations = relations(automationRules, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [automationRules.organizationId],
  references: [organizations.id],
 }),
 logs: many(automationLogs),
}))

export const automationLogsRelations = relations(automationLogs, ({ one }) => ({
 organization: one(organizations, {
  fields: [automationLogs.organizationId],
  references: [organizations.id],
 }),
 rule: one(automationRules, {
  fields: [automationLogs.ruleId],
  references: [automationRules.id],
 }),
}))

// ============================================
// AUDIT RELATIONS
// ============================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
 organization: one(organizations, {
  fields: [auditLogs.organizationId],
  references: [organizations.id],
 }),
 user: one(users, {
  fields: [auditLogs.userId],
  references: [users.id],
 }),
}))
