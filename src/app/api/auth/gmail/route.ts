import { NextRequest, NextResponse } from 'next/server'
import { getGmailAuthUrl } from '@/lib/gmail'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
 // Require authentication before initiating OAuth flow
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
 }

 const authUrl = getGmailAuthUrl()
 return NextResponse.redirect(authUrl)
}
