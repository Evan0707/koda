import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './core'
import { companies, contacts } from './crm'
import { quotes } from './billing'

// ============================================
// PROJECTS
// ============================================
export const projects = pgTable('projects', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 companyId: uuid('company_id').references(() => companies.id),
 contactId: uuid('contact_id').references(() => contacts.id),
 quoteId: uuid('quote_id').references(() => quotes.id),
 ownerId: uuid('owner_id').references(() => users.id),
 managerId: uuid('manager_id').references(() => users.id),

 name: text('name').notNull(),
 description: text('description'),

 status: text('status').default('active'), // active, paused, completed, cancelled

 // Budget
 budgetType: text('budget_type').default('fixed'), // fixed, hourly, retainer
 budgetAmount: integer('budget_amount'), // In cents
 budgetHours: integer('budget_hours'),

 // Dates
 startDate: date('start_date'),
 endDate: date('end_date'),

 // Progress
 progress: integer('progress').default(0), // 0-100

 // Settings
 isClientVisible: boolean('is_client_visible').default(true),
 allowClientComments: boolean('allow_client_comments').default(true),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// CYCLES (SPRINTS)
// ============================================
export const cycles = pgTable('cycles', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),

 name: text('name').notNull(),

 startDate: date('start_date'),
 endDate: date('end_date'),

 status: text('status').default('upcoming'), // upcoming, active, completed

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// TASKS
// ============================================
export const tasks = pgTable('tasks', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
 cycleId: uuid('cycle_id').references(() => cycles.id, { onDelete: 'cascade' }),
 parentId: uuid('parent_id'), // For subtasks
 assigneeId: uuid('assignee_id').references(() => users.id),
 createdById: uuid('created_by_id').references(() => users.id),

 title: text('title').notNull(),
 description: text('description'),

 status: text('status').default('todo'), // todo, in_progress, review, done
 priority: text('priority').default('medium'), // low, medium, high, urgent

 // Estimation
 estimatedHours: integer('estimated_hours'),

 // Dates
 dueDate: date('due_date'),
 completedAt: timestamp('completed_at'),

 position: integer('position').default(0),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// TIME ENTRIES
// ============================================
export const timeEntries = pgTable('time_entries', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
 taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
 userId: uuid('user_id').references(() => users.id).notNull(),

 description: text('description'),

 // Duration in minutes
 duration: integer('duration').notNull(),

 // Or start/end time for timer
 startedAt: timestamp('started_at'),
 endedAt: timestamp('ended_at'),

 // Billing
 isBillable: boolean('is_billable').default(true),
 hourlyRate: integer('hourly_rate'), // Override from project

 date: date('date').notNull(),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations moved to ./relations.ts
