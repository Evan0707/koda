import { z } from 'zod'

const envSchema = z.object({
 // Supabase
 NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
 NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
 SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

 // App
 NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
 NEXT_PUBLIC_APP_NAME: z.string().default('KodaFlow'),

 // Stripe (optional for now)
 STRIPE_SECRET_KEY: z.string().optional(),
 STRIPE_WEBHOOK_SECRET: z.string().optional(),
 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

 // Email (optional for now)
 RESEND_API_KEY: z.string().optional(),
 EMAIL_FROM: z.string().email().optional(),

 // AI (optional for now)
 OPENAI_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
 const parsed = envSchema.safeParse(process.env)

 if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
 }

 return parsed.data
}

export const env = validateEnv()
