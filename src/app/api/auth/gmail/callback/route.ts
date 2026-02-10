import { NextRequest, NextResponse } from 'next/server'
import { getGmailTokens, getGmailUserEmail } from '@/lib/gmail'
import { createClient } from '@/lib/supabase/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
 const searchParams = request.nextUrl.searchParams
 const code = searchParams.get('code')
 const error = searchParams.get('error')

 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

 if (error) {
  console.error('Gmail OAuth error:', error)
  return NextResponse.redirect(`${baseUrl}/dashboard/settings?gmail=error&message=${encodeURIComponent(error)}`)
 }

 if (!code) {
  return NextResponse.redirect(`${baseUrl}/dashboard/settings?gmail=error&message=no_code`)
 }

 try {
  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   return NextResponse.redirect(`${baseUrl}/login`)
  }

  // Exchange code for tokens
  const tokens = await getGmailTokens(code)

  if (!tokens.access_token || !tokens.refresh_token) {
   throw new Error('Missing tokens from Google')
  }

  // Get user's Gmail email address
  const gmailEmail = await getGmailUserEmail(tokens.access_token)

  // Store tokens in database
  await db.update(schema.users)
   .set({
    gmailAccessToken: tokens.access_token,
    gmailRefreshToken: tokens.refresh_token,
    gmailEmail: gmailEmail,
    gmailConnectedAt: new Date(),
    updatedAt: new Date(),
   })
   .where(eq(schema.users.id, user.id))

  // Redirect to settings with success message
  return NextResponse.redirect(`${baseUrl}/dashboard/settings?gmail=success`)

 } catch (err) {
  console.error('Gmail OAuth callback error:', err)
  return NextResponse.redirect(`${baseUrl}/dashboard/settings?gmail=error&message=callback_failed`)
 }
}
