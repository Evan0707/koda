import { google } from 'googleapis'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

const SCOPES = ['https://mail.google.com/']

// Create OAuth2 client
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
  )
}

// Generate authorization URL
export function getGmailAuthUrl() {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token every time
  })
}

// Exchange code for tokens
export async function getGmailTokens(code: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

// Get user's email address from token
export async function getGmailUserEmail(accessToken: string) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const profile = await gmail.users.getProfile({ userId: 'me' })
  return profile.data.emailAddress
}

// Refresh access token if expired
async function refreshAccessToken(userId: string, refreshToken: string) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()

  // Update stored access token
  await db.update(schema.users)
    .set({
      gmailAccessToken: credentials.access_token,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))

  return credentials.access_token
}

// Create email with attachment
function createEmailWithAttachment(
  to: string,
  subject: string,
  body: string,
  attachment?: { filename: string; content: Buffer; contentType: string }
) {
  const boundary = 'boundary_' + Date.now().toString(16)

  let email = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body).toString('base64'),
  ]

  if (attachment) {
    email = email.concat([
      '',
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      attachment.content.toString('base64'),
    ])
  }

  email.push(`--${boundary}--`)

  return Buffer.from(email.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Send email via Gmail API
export async function sendGmailEmail(
  userId: string,
  to: string,
  subject: string,
  htmlBody: string,
  attachment?: { filename: string; content: Buffer; contentType: string }
) {
  // Get user's Gmail credentials
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  })

  if (!user?.gmailAccessToken || !user?.gmailRefreshToken) {
    throw new Error('Gmail non connecté. Veuillez connecter votre compte dans les paramètres.')
  }

  const oauth2Client = createOAuth2Client()

  // Try with current access token, refresh if needed
  let accessToken = user.gmailAccessToken

  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: user.gmailRefreshToken,
    })

    // Check if token is expired by making a test request
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Create the email
    const rawEmail = createEmailWithAttachment(to, subject, htmlBody, attachment)

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawEmail,
      },
    })

    return { success: true, messageId: response.data.id }
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      try {
        const accessToken = await refreshAccessToken(userId, user.gmailRefreshToken)

        oauth2Client.setCredentials({ access_token: accessToken })
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

        const rawEmail = createEmailWithAttachment(to, subject, htmlBody, attachment)

        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: rawEmail,
          },
        })

        return { success: true, messageId: response.data.id }
      } catch (refreshError) {
        console.error('Failed to refresh Gmail token:', refreshError)
        throw new Error('Session Gmail expirée. Veuillez reconnecter votre compte.')
      }
    }

    console.error('Gmail send error:', error)
    throw error
  }
}

// Check if user has Gmail connected
export async function isGmailConnected(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: {
      gmailEmail: true,
      gmailConnectedAt: true,
    }
  })

  return {
    connected: !!user?.gmailEmail,
    email: user?.gmailEmail || null,
    connectedAt: user?.gmailConnectedAt || null,
  }
}

// Disconnect Gmail
export async function disconnectGmail(userId: string) {
  await db.update(schema.users)
    .set({
      gmailAccessToken: null,
      gmailRefreshToken: null,
      gmailEmail: null,
      gmailConnectedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))

  return { success: true }
}
