'use server'

import { db } from '@/db'
import { expenses, expenseCategories } from '@/db/schema/finance'
import { getOrganizationId, getUser } from '@/lib/auth'
import { Expense, ExpenseCategory } from '@/types/db'
import { and, desc, eq, ilike, or, sql, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'
import { z } from 'zod'
import { notifyUser } from '@/lib/actions/automation'

// ============================================
// SCHEMAS
// ============================================
const expenseSchema = z.object({
 description: z.string().min(1, 'La description est requise'),
 amount: z.coerce.number().min(0.01, 'Le montant est requis'), // in euros (will be converted to cents)
 categoryId: z.string().nullable().optional(),
 date: z.string().min(1, 'La date est requise'),
 vatRate: z.coerce.number().min(0).max(100).default(20),
 receiptUrl: z.string().nullable().optional(),
 status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

const expenseCategorySchema = z.object({
 name: z.string().min(1, 'Le nom est requis'),
 color: z.string().optional().default('#6B7280'),
 icon: z.string().nullable().optional(),
 accountCode: z.string().nullable().optional(),
})

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>

// ============================================
// TYPES
// ============================================
export type ExpenseWithRelations = Expense & {
 category: ExpenseCategory | null
 createdBy: { id: string; firstName: string | null; lastName: string | null; email: string } | null
}

// ============================================
// READ
// ============================================
export async function getExpenses(options?: {
 query?: string
 categoryId?: string
 status?: string
 startDate?: string
 endDate?: string
}) {
 try {
  const organizationId = await getOrganizationId()

  const conditions = [eq(expenses.organizationId, organizationId)]

  if (options?.query) {
   conditions.push(ilike(expenses.description, `%${options.query}%`))
  }

  if (options?.categoryId) {
   conditions.push(eq(expenses.categoryId, options.categoryId))
  }

  if (options?.status) {
   conditions.push(eq(expenses.status, options.status))
  }

  if (options?.startDate) {
   conditions.push(gte(expenses.date, options.startDate))
  }

  if (options?.endDate) {
   conditions.push(lte(expenses.date, options.endDate))
  }

  const data = await db.query.expenses.findMany({
   where: and(...conditions),
   with: {
    category: true,
    createdBy: {
     columns: { id: true, firstName: true, lastName: true, email: true },
    },
   },
   orderBy: [desc(expenses.date), desc(expenses.createdAt)],
  })

  return { expenses: data as ExpenseWithRelations[] }
 } catch (error) {
  console.error('Error fetching expenses:', error)
  return { error: 'Erreur lors de la récupération des dépenses' }
 }
}

export async function getExpenseCategories() {
 try {
  const organizationId = await getOrganizationId()

  const data = await db.query.expenseCategories.findMany({
   where: eq(expenseCategories.organizationId, organizationId),
   orderBy: [desc(expenseCategories.createdAt)],
  })

  return { categories: data as ExpenseCategory[] }
 } catch (error) {
  console.error('Error fetching expense categories:', error)
  return { error: 'Erreur lors de la récupération des catégories' }
 }
}

export async function getExpenseSummary(startDate?: string, endDate?: string) {
 try {
  const organizationId = await getOrganizationId()

  const conditions = [eq(expenses.organizationId, organizationId)]

  if (startDate) conditions.push(gte(expenses.date, startDate))
  if (endDate) conditions.push(lte(expenses.date, endDate))

  const result = await db
   .select({
    totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    totalVat: sql<number>`COALESCE(SUM(${expenses.vatAmount}), 0)`,
    count: sql<number>`COUNT(*)`,
    pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${expenses.status} = 'pending')`,
    approvedCount: sql<number>`COUNT(*) FILTER (WHERE ${expenses.status} = 'approved')`,
   })
   .from(expenses)
   .where(and(...conditions))

  return {
   summary: {
    totalAmount: Number(result[0].totalAmount),
    totalVat: Number(result[0].totalVat),
    count: Number(result[0].count),
    pendingCount: Number(result[0].pendingCount),
    approvedCount: Number(result[0].approvedCount),
   },
  }
 } catch (error) {
  console.error('Error fetching expense summary:', error)
  return { error: 'Erreur' }
 }
}

// ============================================
// CREATE
// ============================================
export async function createExpense(data: ExpenseFormData) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()
  const validated = expenseSchema.parse(data)

  const amountCents = Math.round(validated.amount * 100)
  const vatAmount = Math.round(amountCents * (validated.vatRate / 100))

  const [newExpense] = await db
   .insert(expenses)
   .values({
    organizationId,
    createdById: user!.id,
    description: validated.description,
    amount: amountCents,
    vatAmount,
    vatRate: validated.vatRate,
    categoryId: validated.categoryId || null,
    date: validated.date,
    receiptUrl: validated.receiptUrl || null,
    status: validated.status,
   })
   .returning()

  revalidatePath('/dashboard/expenses')

  await logAudit({
   action: AUDIT_ACTIONS.EXPENSE_CREATED,
   entityType: 'expense',
   entityId: newExpense.id,
   metadata: { description: validated.description, amount: validated.amount },
  })

  return { success: true, id: newExpense.id }
 } catch (error) {
  console.error('Error creating expense:', error)
  return { error: 'Erreur lors de la création de la dépense' }
 }
}

export async function createExpenseCategory(data: ExpenseCategoryFormData) {
 try {
  const organizationId = await getOrganizationId()
  const validated = expenseCategorySchema.parse(data)

  const [category] = await db
   .insert(expenseCategories)
   .values({
    organizationId,
    name: validated.name,
    color: validated.color,
    icon: validated.icon || null,
    accountCode: validated.accountCode || null,
   })
   .returning()

  revalidatePath('/dashboard/expenses')
  return { success: true, category }
 } catch (error) {
  console.error('Error creating category:', error)
  return { error: 'Erreur lors de la création de la catégorie' }
 }
}

// ============================================
// UPDATE
// ============================================
export async function updateExpense(id: string, data: ExpenseFormData) {
 try {
  const organizationId = await getOrganizationId()
  const validated = expenseSchema.parse(data)

  const existing = await db.query.expenses.findFirst({
   where: and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)),
  })
  if (!existing) return { error: 'Dépense non trouvée' }

  const amountCents = Math.round(validated.amount * 100)
  const vatAmount = Math.round(amountCents * (validated.vatRate / 100))

  await db
   .update(expenses)
   .set({
    description: validated.description,
    amount: amountCents,
    vatAmount,
    vatRate: validated.vatRate,
    categoryId: validated.categoryId || null,
    date: validated.date,
    receiptUrl: validated.receiptUrl || null,
    status: validated.status,
    updatedAt: new Date(),
   })
   .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))

  revalidatePath('/dashboard/expenses')

  await logAudit({
   action: AUDIT_ACTIONS.EXPENSE_UPDATED,
   entityType: 'expense',
   entityId: id,
   metadata: { description: validated.description, amount: validated.amount },
  })

  return { success: true }
 } catch (error) {
  console.error('Error updating expense:', error)
  return { error: 'Erreur lors de la modification de la dépense' }
 }
}

export async function updateExpenseStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
 try {
  const organizationId = await getOrganizationId()

  const existing = await db.query.expenses.findFirst({
   where: and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)),
  })
  if (!existing) return { error: 'Dépense non trouvée' }

  await db
   .update(expenses)
   .set({ status, updatedAt: new Date() })
   .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))

  revalidatePath('/dashboard/expenses')

  await logAudit({
   action: AUDIT_ACTIONS.EXPENSE_UPDATED,
   entityType: 'expense',
   entityId: id,
   metadata: { status },
  })

  // Notify expense creator
  if (existing.createdById && (status === 'approved' || status === 'rejected')) {
   await notifyUser(existing.createdById, organizationId, {
    title: status === 'approved' ? 'Dépense approuvée' : 'Dépense rejetée',
    message: `La dépense "${existing.description}" a été ${status === 'approved' ? 'approuvée' : 'rejetée'}.`,
    type: status === 'approved' ? 'success' : 'warning',
    link: '/dashboard/expenses',
    resourceType: 'expense',
    resourceId: id,
   })
  }

  return { success: true }
 } catch (error) {
  console.error('Error updating expense status:', error)
  return { error: 'Erreur lors de la modification du statut' }
 }
}

// ============================================
// DELETE
// ============================================
export async function deleteExpense(id: string) {
 try {
  const organizationId = await getOrganizationId()

  const existing = await db.query.expenses.findFirst({
   where: and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)),
  })
  if (!existing) return { error: 'Dépense non trouvée' }

  await db
   .delete(expenses)
   .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)))

  revalidatePath('/dashboard/expenses')

  await logAudit({
   action: AUDIT_ACTIONS.EXPENSE_DELETED,
   entityType: 'expense',
   entityId: id,
   metadata: { description: existing.description },
  })

  return { success: true }
 } catch (error) {
  console.error('Error deleting expense:', error)
  return { error: 'Erreur lors de la suppression de la dépense' }
 }
}
