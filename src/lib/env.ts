import { z } from 'zod'

/**
 * Server-side environment variables validation.
 * Import this file early to fail fast if env vars are misconfigured.
 *
 * Usage: import { env } from '@/lib/env'
 */

const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Stripe (optional — required for payments)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // Mailjet (optional — required for email)
  MJ_APIKEY_PUBLIC: z.string().optional(),
  MJ_APIKEY_PRIVATE: z.string().optional(),
  MJ_SENDER_EMAIL: z.string().email().optional(),

  // Google Gmail OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI (optional)
  GEMINI_API_KEY: z.string().optional(),

  // Inngest (optional)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
})

export type Env = z.infer<typeof serverSchema>

function validateEnv(): Env {
  const parsed = serverSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n')

    console.error('❌ Invalid environment variables:\n' + formatted)

    // In production, crash immediately. In dev, warn but continue.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables. Check server logs.')
    }
  }

  return (parsed.success ? parsed.data : process.env) as Env
}

export const env = validateEnv()
