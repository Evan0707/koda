'use server'

import { db } from '@/db'
import { emailConfigs } from '@/db/schema/settings'
import { getOrganizationId } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// TYPES
// ============================================
export type EmailConfig = {
  id: string
  organizationId: string
  type: string
  subject: string
  body: string
  isActive: boolean | null
}

// Template types defined in settings-client.tsx (cannot export non-async from 'use server')

const EMAIL_TEMPLATE_TYPES = [
  {
    value: 'invoice_sent',
    label: 'Envoi de facture',
    description: 'Email envoyé au client lors de l\'envoi d\'une facture',
    variables: ['{{client_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}', '{{payment_link}}'],
    defaultSubject: 'Facture {{invoice_number}} — {{company_name}}',
    defaultBody: `<p>Bonjour {{client_name}},</p>
<p>Veuillez trouver ci-joint la facture <strong>{{invoice_number}}</strong> d'un montant de <strong>{{amount}}</strong>.</p>
<p>Date d'échéance : {{due_date}}</p>
<p>Vous pouvez régler cette facture en ligne :</p>
<p><a href="{{payment_link}}">Payer maintenant</a></p>
<p>Cordialement,<br/>{{company_name}}</p>`,
  },
  {
    value: 'quote_sent',
    label: 'Envoi de devis',
    description: 'Email envoyé au client lors de l\'envoi d\'un devis',
    variables: ['{{client_name}}', '{{quote_number}}', '{{amount}}', '{{valid_until}}'],
    defaultSubject: 'Devis {{quote_number}} — {{company_name}}',
    defaultBody: `<p>Bonjour {{client_name}},</p>
<p>Veuillez trouver ci-joint le devis <strong>{{quote_number}}</strong> d'un montant de <strong>{{amount}}</strong>.</p>
<p>Ce devis est valable jusqu'au {{valid_until}}.</p>
<p>N'hésitez pas à me contacter pour toute question.</p>
<p>Cordialement,<br/>{{company_name}}</p>`,
  },
  {
    value: 'invoice_reminder',
    label: 'Relance de facture',
    description: 'Email de rappel pour les factures en retard',
    variables: ['{{client_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}', '{{days_overdue}}', '{{payment_link}}'],
    defaultSubject: 'Rappel — Facture {{invoice_number}} en attente',
    defaultBody: `<p>Bonjour {{client_name}},</p>
<p>Je me permets de vous relancer concernant la facture <strong>{{invoice_number}}</strong> d'un montant de <strong>{{amount}}</strong>, échue le {{due_date}} ({{days_overdue}} jours de retard).</p>
<p>Si le règlement a déjà été effectué, je vous prie de ne pas tenir compte de ce message.</p>
<p><a href="{{payment_link}}">Régler maintenant</a></p>
<p>Cordialement,<br/>{{company_name}}</p>`,
  },
  {
    value: 'payment_received',
    label: 'Confirmation de paiement',
    description: 'Email envoyé au client après réception du paiement',
    variables: ['{{client_name}}', '{{invoice_number}}', '{{amount}}'],
    defaultSubject: 'Paiement reçu — Facture {{invoice_number}}',
    defaultBody: `<p>Bonjour {{client_name}},</p>
<p>Nous confirmons la réception de votre paiement de <strong>{{amount}}</strong> pour la facture <strong>{{invoice_number}}</strong>.</p>
<p>Merci pour votre confiance.</p>
<p>Cordialement,<br/>{{company_name}}</p>`,
  },
] as const

const emailConfigSchema = z.object({
  type: z.string(),
  subject: z.string().min(1, 'Le sujet est requis'),
  body: z.string().min(1, 'Le corps est requis'),
  isActive: z.boolean().default(true),
})

export type EmailConfigFormData = z.infer<typeof emailConfigSchema>

// ============================================
// READ
// ============================================
export async function getEmailConfigs() {
  try {
    const organizationId = await getOrganizationId()

    const configs = await db.query.emailConfigs.findMany({
      where: eq(emailConfigs.organizationId, organizationId),
    })

    return { configs: configs as EmailConfig[] }
  } catch (error) {
    console.error('Error fetching email configs:', error)
    return { error: 'Erreur lors de la récupération des modèles' }
  }
}

// ============================================
// UPSERT
// ============================================
export async function upsertEmailConfig(data: EmailConfigFormData) {
  try {
    const organizationId = await getOrganizationId()
    const validated = emailConfigSchema.parse(data)

    const existing = await db.query.emailConfigs.findFirst({
      where: and(
        eq(emailConfigs.organizationId, organizationId),
        eq(emailConfigs.type, validated.type),
      ),
    })

    if (existing) {
      await db
        .update(emailConfigs)
        .set({
          subject: validated.subject,
          body: validated.body,
          isActive: validated.isActive,
          updatedAt: new Date(),
        })
        .where(eq(emailConfigs.id, existing.id))
    } else {
      await db.insert(emailConfigs).values({
        organizationId,
        type: validated.type,
        subject: validated.subject,
        body: validated.body,
        isActive: validated.isActive,
      })
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error upserting email config:', error)
    return { error: 'Erreur lors de la sauvegarde' }
  }
}

// ============================================
// RESET TO DEFAULT
// ============================================
export async function resetEmailConfigToDefault(type: string) {
  try {
    const organizationId = await getOrganizationId()

    const template = EMAIL_TEMPLATE_TYPES.find((t) => t.value === type)
    if (!template) return { error: 'Type de modèle inconnu' }

    const existing = await db.query.emailConfigs.findFirst({
      where: and(
        eq(emailConfigs.organizationId, organizationId),
        eq(emailConfigs.type, type),
      ),
    })

    if (existing) {
      await db
        .update(emailConfigs)
        .set({
          subject: template.defaultSubject,
          body: template.defaultBody,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(emailConfigs.id, existing.id))
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error resetting email config:', error)
    return { error: 'Erreur lors de la réinitialisation' }
  }
}
