import { createServerClient as createServerClientSSR } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

 if (!supabaseUrl || !supabaseAnonKey) {
  // Return a mock client during build or when env vars are not set
  console.warn('⚠️ Supabase credentials not found. Auth features will not work.')
  return {
   auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    exchangeCodeForSession: async () => ({ error: null }),
   },
   from: () => ({
    select: () => ({ data: null, error: null }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
   }),
  } as unknown as ReturnType<typeof createServerClientSSR>
 }

 const cookieStore = await cookies()

 return createServerClientSSR(supabaseUrl, supabaseAnonKey, {
  cookies: {
   getAll() {
    return cookieStore.getAll()
   },
   setAll(cookiesToSet) {
    try {
     cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
     )
    } catch {
     // The `setAll` method was called from a Server Component.
     // This can be ignored if you have middleware refreshing user sessions.
    }
   },
  },
 })
}
