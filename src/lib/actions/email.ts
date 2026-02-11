'use server'

import { createClient } from '@/lib/supabase/server'
import { sendGmailEmail, isGmailConnected, disconnectGmail } from '@/lib/gmail'
import { sendMailjetEmail, isMailjetConfigured } from '@/lib/mailjet'
import { db, schema } from '@/db'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Check Gmail connection status
export async function getGmailStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { connected: false, email: null, connectedAt: null }
  }

  return await isGmailConnected(user.id)
}

// Disconnect Gmail account
export async function disconnectGmailAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  await disconnectGmail(user.id)
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// Send email using Mailjet (primary) or Gmail (fallback)
async function sendEmail(
  userId: string,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string
) {
  // Try Mailjet first (simpler, no OAuth needed)
  if (isMailjetConfigured()) {
    return await sendMailjetEmail({
      to,
      toName,
      subject,
      htmlBody,
    })
  }

  // Fallback to Gmail OAuth if user has it connected
  const gmailStatus = await isGmailConnected(userId)
  if (gmailStatus.connected) {
    return await sendGmailEmail(userId, to, subject, htmlBody)
  }

  throw new Error('Aucun service email configuré. Configurez Mailjet dans les variables d\'environnement ou connectez Gmail dans les paramètres.')
}

// Send invoice by email
export async function sendInvoiceEmail(
  invoiceId: string,
  subject: string,
  htmlBody: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  try {
    // Get invoice with contact
    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(schema.invoices.id, invoiceId),
        isNull(schema.invoices.deletedAt)
      ),
      with: {
        contact: true,
      }
    })

    if (!invoice) {
      return { error: 'Facture introuvable' }
    }

    if (!invoice.contact?.email) {
      return { error: 'Le contact n\'a pas d\'adresse email' }
    }

    // Add payment link to body if not already there
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const paymentLink = `${baseUrl}/pay/${invoice.id}`

    let finalBody = htmlBody
    if (!htmlBody.includes(paymentLink)) {
      finalBody += `
    <br/><br/>
    <p><strong>💳 Payer en ligne :</strong></p>
    <p><a href="${paymentLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Payer maintenant</a></p>
   `
    }

    const contactName = invoice.contact.firstName
      ? `${invoice.contact.firstName} ${invoice.contact.lastName || ''}`
      : undefined

    const result = await sendEmail(
      user.id,
      invoice.contact.email,
      contactName,
      subject,
      finalBody
    )

    // Update invoice status to 'sent' if draft
    if (invoice.status === 'draft') {
      await db.update(schema.invoices)
        .set({
          status: 'sent',
          updatedAt: new Date(),
        })
        .where(eq(schema.invoices.id, invoiceId))
    }

    revalidatePath('/dashboard/invoices')
    return { success: true, messageId: result.messageId }

  } catch (error: any) {
    console.error('Error sending invoice email:', error)
    return { error: error.message || 'Erreur lors de l\'envoi' }
  }
}

// Send quote by email
export async function sendQuoteEmail(
  quoteId: string,
  subject: string,
  htmlBody: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  try {
    // Get quote with contact
    const quote = await db.query.quotes.findFirst({
      where: and(
        eq(schema.quotes.id, quoteId),
        isNull(schema.quotes.deletedAt)
      ),
      with: {
        contact: true,
      }
    })

    if (!quote) {
      return { error: 'Devis introuvable' }
    }

    if (!quote.contact?.email) {
      return { error: 'Le contact n\'a pas d\'adresse email' }
    }

    // Add signature link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const signatureLink = `${baseUrl}/quote/${quote.id}`

    let finalBody = htmlBody
    if (!htmlBody.includes(signatureLink)) {
      finalBody += `
    <br/><br/>
    <p><strong>✍️ Signer le devis en ligne :</strong></p>
    <p><a href="${signatureLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Voir et signer le devis</a></p>
   `
    }

    const contactName = quote.contact.firstName
      ? `${quote.contact.firstName} ${quote.contact.lastName || ''}`
      : undefined

    const result = await sendEmail(
      user.id,
      quote.contact.email,
      contactName,
      subject,
      finalBody
    )

    // Update quote status to 'sent' if draft
    if (quote.status === 'draft') {
      await db.update(schema.quotes)
        .set({
          status: 'sent',
          updatedAt: new Date(),
        })
        .where(eq(schema.quotes.id, quoteId))
    }

    revalidatePath('/dashboard/quotes')
    return { success: true, messageId: result.messageId }

  } catch (error: any) {
    console.error('Error sending quote email:', error)
    return { error: error.message || 'Erreur lors de l\'envoi' }
  }
}
