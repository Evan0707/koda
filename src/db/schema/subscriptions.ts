import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './core'

// ============================================
// SUBSCRIPTIONS HISTORY
// ============================================
export const subscriptions = pgTable('subscriptions', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 plan: text('plan').notNull(), // free, starter, pro
 status: text('status').notNull(), // active, past_due, canceled, incomplete

 stripeSubscriptionId: text('stripe_subscription_id'),
 currentPeriodStart: timestamp('current_period_start'),
 currentPeriodEnd: timestamp('current_period_end'),
 canceledAt: timestamp('canceled_at'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
