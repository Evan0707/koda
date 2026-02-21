import { z } from 'zod'

/**
 * Server-side environment variables validation.
 * Import this file early to fail fast if env vars are misconfigured.
 *
 * Usage: import { env } from '@/lib/env'
 */

const isProduction = process.env.NODE_ENV === 'production'

const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // App — required in production for correct payment links, callbacks and emails
  NEXT_PUBLIC_APP_URL: isProduction
    ? z.string().url('NEXT_PUBLIC_APP_URL is required in production')
    : z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Stripe — required in production for billing
  STRIPE_SECRET_KEY: isProduction
    ? z.string().startsWith('sk_live_', 'STRIPE_SECRET_KEY must be a live key in production')
    : z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: isProduction
    ? z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET is required in production')
    : z.string().startsWith('whsec_').optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: isProduction
    ? z.string().startsWith('whsec_', 'STRIPE_CONNECT_WEBHOOK_SECRET is required in production')
    : z.string().startsWith('whsec_').optional(),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_STARTER_ANNUAL: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_PRO_ANNUAL: z.string().startsWith('price_').optional(),

  // Mailjet (optional — required for email)
  MAILJET_API_KEY: z.string().min(1).optional(),
  MAILJET_SECRET_KEY: z.string().min(1).optional(),
  MAILJET_SENDER_EMAIL: z.string().email().optional(),
  MAILJET_SENDER_NAME: z.string().optional(),

  // Google Gmail OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI (optional — required for AI features)
  GROQ_API_KEY: z.string().min(1).optional(),

  // Encryption (required in production for OAuth tokens)
  ENCRYPTION_SECRET: isProduction
    ? z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 characters in production')
    : z.string().min(1).optional(),

  // Upstash Redis (required in production for rate limiting)
  UPSTASH_REDIS_REST_URL: isProduction
    ? z.string().url('UPSTASH_REDIS_REST_URL is required in production')
    : z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: isProduction
    ? z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required in production')
    : z.string().min(1).optional(),

  // Inngest (signing key required in production)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: isProduction
    ? z.string().min(1, 'INNGEST_SIGNING_KEY is required in production')
    : z.string().optional(),
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
