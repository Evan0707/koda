import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr'

export function createClient() {
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

 if (!supabaseUrl || !supabaseAnonKey) {
  // Return a mock client during build or when env vars are not set
  console.warn('⚠️ Supabase credentials not found. Auth features will not work.')
  return {
   auth: {
    signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
    signInWithOtp: async () => ({ error: new Error('Supabase not configured') }),
    signUp: async () => ({ error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
   },
  } as ReturnType<typeof createBrowserClientSSR>
 }

 return createBrowserClientSSR(supabaseUrl, supabaseAnonKey)
}
