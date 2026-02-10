import { pgTable, uuid, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './core'
import { projects } from './projects'

// ============================================
// CONVERSATIONS (THREADS)
// ============================================
export const conversations = pgTable('conversations', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 projectId: uuid('project_id').references(() => projects.id),

 title: text('title'),

 // Context
 contextType: text('context_type'), // project, task, quote, invoice
 contextId: uuid('context_id'),

 // Participants
 isClientVisible: boolean('is_client_visible').default(true),

 lastMessageAt: timestamp('last_message_at'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// MESSAGES
// ============================================
export const messages = pgTable('messages', {
 id: uuid('id').primaryKey().defaultRandom(),
 conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
 senderId: uuid('sender_id').references(() => users.id),

 content: text('content').notNull(),

 // For client messages (no user id)
 senderType: text('sender_type').default('user'), // user, client, system
 senderName: text('sender_name'),
 senderEmail: text('sender_email'),

 // Attachments
 attachments: jsonb('attachments').default([]),

 isRead: boolean('is_read').default(false),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// CLIENT ACCESS TOKENS (MAGIC LINKS)
// ============================================
export const clientAccessTokens = pgTable('client_access_tokens', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 projectId: uuid('project_id').references(() => projects.id),

 token: text('token').notNull().unique(),

 email: text('email').notNull(),
 name: text('name'),

 // Permissions
 permissions: jsonb('permissions').default([]), // view_project, comment, approve_deliverable

 expiresAt: timestamp('expires_at'),
 lastUsedAt: timestamp('last_used_at'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications = pgTable('notifications', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 userId: uuid('user_id').references(() => users.id).notNull(),

 type: text('type').notNull(), // invoice_paid, quote_signed, task_assigned, etc.
 title: text('title').notNull(),
 body: text('body'),

 // Link to resource
 resourceType: text('resource_type'),
 resourceId: uuid('resource_id'),
 link: text('link'),

 isRead: boolean('is_read').default(false),
 readAt: timestamp('read_at'),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// FILES
// ============================================
export const files = pgTable('files', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 uploadedById: uuid('uploaded_by_id').references(() => users.id),

 name: text('name').notNull(),
 mimeType: text('mime_type'),
 size: integer('size'), // In bytes

 url: text('url').notNull(),

 // Attached to
 attachableType: text('attachable_type'), // project, task, message, expense
 attachableId: uuid('attachable_id'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
 organization: one(organizations, {
  fields: [conversations.organizationId],
  references: [organizations.id],
 }),
 project: one(projects, {
  fields: [conversations.projectId],
  references: [projects.id],
 }),
 messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
 conversation: one(conversations, {
  fields: [messages.conversationId],
  references: [conversations.id],
 }),
 sender: one(users, {
  fields: [messages.senderId],
  references: [users.id],
 }),
}))

// Relations moved to ./relations.ts
