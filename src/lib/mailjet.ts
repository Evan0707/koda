import Mailjet from 'node-mailjet'

// Initialize Mailjet client
function getMailjetClient() {
 const apiKey = process.env.MAILJET_API_KEY
 const apiSecret = process.env.MAILJET_SECRET_KEY

 if (!apiKey || !apiSecret) {
  throw new Error("MAILJET_API_KEY and MAILJET_SECRET_KEY are required")
 }

 return new Mailjet({
  apiKey,
  apiSecret
 })
}

export interface EmailOptions {
 to: string
 toName?: string
 subject: string
 htmlBody: string
 textBody?: string
 attachments?: Array<{
  filename: string
  contentType: string
  base64Content: string
 }>
}

/**
 * Send email via Mailjet
 */
export async function sendMailjetEmail(options: EmailOptions) {
 const mailjet = getMailjetClient()

 const senderEmail = process.env.MAILJET_SENDER_EMAIL || 'noreply@kodaflow.com'
 const senderName = process.env.MAILJET_SENDER_NAME || 'KodaFlow'

 const message: any = {
  From: {
   Email: senderEmail,
   Name: senderName,
  },
  To: [
   {
    Email: options.to,
    Name: options.toName || options.to,
   },
  ],
  Subject: options.subject,
  HTMLPart: options.htmlBody,
 }

 if (options.textBody) {
  message.TextPart = options.textBody
 }

 if (options.attachments?.length) {
  message.Attachments = options.attachments.map(att => ({
   ContentType: att.contentType,
   Filename: att.filename,
   Base64Content: att.base64Content,
  }))
 }

 try {
  const response = await mailjet.post('send', { version: 'v3.1' }).request({
   Messages: [message],
  })

  const body = response.body as any
  const messageResult = body.Messages?.[0]

  if (messageResult?.Status === 'success') {
   return {
    success: true,
    messageId: messageResult.To?.[0]?.MessageID || null,
   }
  }

  throw new Error(messageResult?.Errors?.[0]?.ErrorMessage || 'Mailjet send failed')
 } catch (error: any) {
  console.error('Mailjet send error:', error)
  throw new Error(error.message || 'Erreur lors de l\'envoi via Mailjet')
 }
}

/**
 * Check if Mailjet is configured
 */
export function isMailjetConfigured(): boolean {
 return !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY)
}
