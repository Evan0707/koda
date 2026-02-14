import { z } from 'zod'

// ===========================================
// Password Schema (reusable)
// ===========================================

/** 
 * Strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

export const emailSchema = z.string().email('Email invalide')

// ===========================================
// Auth Schemas
// ===========================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema,
})

// ===========================================
// Quote Schemas
// ===========================================

export const signQuoteSchema = z.object({
  quoteId: z.string().uuid('ID de devis invalide'),
  signatureData: z.object({
    signature: z.string().min(1, 'Signature requise'),
    signerName: z.string().min(1, 'Nom du signataire requis'),
    signerEmail: emailSchema,
    signerIp: z.string().optional(),
  }),
})

// ===========================================
// Invoice / Payment Schemas
// ===========================================

export const createCheckoutSchema = z.object({
  invoiceId: z.string().uuid('ID de facture invalide'),
})

export const getPublicInvoiceSchema = z.object({
  invoiceId: z.string().uuid('ID de facture invalide'),
})

export const getPublicQuoteSchema = z.object({
  quoteId: z.string().uuid('ID de devis invalide'),
})

// ===========================================
// Helper function for validation
// ===========================================

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { success: false, error: firstError?.message || 'Données invalides' }
  }
  
  return { success: true, data: result.data }
}
