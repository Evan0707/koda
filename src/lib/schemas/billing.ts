import { z } from 'zod'

// Schema for line items (shared between quotes and invoices)
export const quoteItemSchema = z.object({
 productId: z.string().optional(),
 description: z.string().min(1, 'Description requise'),
 quantity: z.coerce.number().min(1, 'Quantité minimum 1'),
 unitPrice: z.coerce.number().min(0, 'Prix positif requis'),
 vatRate: z.coerce.number().min(0).default(20),
})

// Schema for quote creation
export const quoteSchema = z.object({
 title: z.string().optional(),
 contactId: z.string().nullable().optional(),
 companyId: z.string().nullable().optional(),
 issueDate: z.string().optional(),
 validUntil: z.string().optional(),
 currency: z.string().default('EUR'),
 status: z.enum(['draft', 'sent', 'accepted', 'rejected']).default('draft'),
 items: z.array(quoteItemSchema).min(1, 'Au moins une ligne est requise'),
})

export type CreateQuoteInput = z.infer<typeof quoteSchema>

// Schema for invoice creation (standalone, not from quote)
export const invoiceSchema = z.object({
 title: z.string().optional(),
 contactId: z.string().nullable().optional(),
 companyId: z.string().nullable().optional(),
 projectId: z.string().nullable().optional(),
 issueDate: z.string().optional(),
 dueDate: z.string().optional(),
 currency: z.string().default('EUR'),
 type: z.enum(['invoice', 'deposit', 'credit_note']).default('invoice'),
 notes: z.string().optional(),
 items: z.array(quoteItemSchema).min(1, 'Au moins une ligne est requise'),
})

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>

// Schema for invoice status update
export const updateInvoiceStatusSchema = z.object({
 status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'partial']),
})

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>
