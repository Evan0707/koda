import { NextRequest, NextResponse } from 'next/server'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(request: NextRequest) {
 const authUrl = getGmailAuthUrl()
 return NextResponse.redirect(authUrl)
}
