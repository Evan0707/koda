'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, Loader2, Save, RotateCcw } from 'lucide-react'
import {
  getEmailConfigs,
  upsertEmailConfig,
  resetEmailConfigToDefault,
  type EmailConfig,
  type EmailConfigFormData,
} from '@/lib/actions/email-configs'

const EMAIL_TEMPLATE_TYPES = [
  {
    value: 'invoice_sent',
    label: 'Envoi de facture',
    description: "Email envoyé au client lors de l'envoi d'une facture",
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
    description: "Email envoyé au client lors de l'envoi d'un devis",
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

export default function SettingsEmailTemplatesTab() {
  const [isPending, startTransition] = useTransition()
  const [emailConfigsList, setEmailConfigsList] = useState<EmailConfig[]>([])
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  const loadEmailConfigs = useCallback(async () => {
    const result = await getEmailConfigs()
    if (result.configs) setEmailConfigsList(result.configs)
  }, [])

  useEffect(() => {
    loadEmailConfigs()
  }, [loadEmailConfigs])

  const getEmailConfigForType = (type: string) => {
    return emailConfigsList.find((c) => c.type === type)
  }

  const handleSave = async (data: EmailConfigFormData) => {
    startTransition(async () => {
      const result = await upsertEmailConfig(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Modèle email mis à jour')
        setEditingTemplate(null)
        loadEmailConfigs()
      }
    })
  }

  const handleReset = async (type: string) => {
    startTransition(async () => {
      const result = await resetEmailConfigToDefault(type)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Modèle réinitialisé')
        loadEmailConfigs()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Modèles d&apos;emails
        </CardTitle>
        <CardDescription>
          Personnalisez les emails envoyés automatiquement à vos clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {EMAIL_TEMPLATE_TYPES.map((template) => {
            const config = getEmailConfigForType(template.value)
            const isEditing = editingTemplate === template.value
            const currentSubject = config?.subject ?? template.defaultSubject
            const currentBody = config?.body ?? template.defaultBody

            return (
              <div key={template.value} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{template.label}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {config && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReset(template.value)}
                        disabled={isPending}
                        title="Réinitialiser par défaut"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(isEditing ? null : template.value)}
                    >
                      {isEditing ? 'Annuler' : 'Modifier'}
                    </Button>
                  </div>
                </div>

                {!isEditing && (
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-sm font-medium text-foreground mb-1">Sujet : {currentSubject}</p>
                    <div className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: currentBody }} />
                  </div>
                )}

                {isEditing && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget)
                      handleSave({
                        type: template.value,
                        subject: fd.get('subject') as string,
                        body: fd.get('body') as string,
                        isActive: true,
                      })
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Sujet</Label>
                      <Input
                        name="subject"
                        defaultValue={currentSubject}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Corps de l&apos;email (HTML)</Label>
                      <textarea
                        name="body"
                        defaultValue={currentBody}
                        rows={8}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      />
                    </div>

                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Variables disponibles :</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((v) => (
                          <code key={v} className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPending} size="sm">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Enregistrer
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
