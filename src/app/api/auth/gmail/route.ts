import { NextRequest, NextResponse } from 'next/server'
import { getGmailAuthUrl } from '@/lib/gmail'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
 // Require authentication before initiating OAuth flow
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
 }

 // Generate a random state string for CSRF protection
 const state = crypto.randomUUID()

 // Store state in an HTTP-only cookie
 const cookieStore = await cookies()
 cookieStore.set('gmail_oauth_state', state, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 10 // 10 minutes
 })

 const authUrl = getGmailAuthUrl(state)
 return NextResponse.redirect(authUrl)
}
