import { z } from 'zod'

export const contactSchema = z.object({
 firstName: z.string().min(1, 'Le prénom est requis'),
 lastName: z.string().nullable().optional(),
 email: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
 phone: z.string().nullable().optional(),
 jobTitle: z.string().nullable().optional(),
 companyId: z.string().nullable().optional(),
})

export type CreateContactInput = z.infer<typeof contactSchema>
