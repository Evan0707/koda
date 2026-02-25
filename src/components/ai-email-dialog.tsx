'use client'

import { useState, useEffect, useTransition } from 'react'
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wand2, Copy, Loader2, Send, Mail, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { generateEmailForQuote, generateEmailForInvoice } from '@/lib/actions/ai'
import { sendInvoiceEmail, sendQuoteEmail, getGmailStatus } from '@/lib/actions/email'
import { LimitReachedModal } from '@/components/limit-reached-modal'
import Link from 'next/link'

interface AIEmailDialogProps {
 type: 'quote' | 'invoice'
 id: string
 trigger?: React.ReactNode
}

export function AIEmailDialog({ type, id, trigger }: AIEmailDialogProps) {
 const [isOpen, setIsOpen] = useState(false)
 const [isGenerating, setIsGenerating] = useState(false)
 const [isSending, startSendTransition] = useTransition()
 const [content, setContent] = useState('')
 const [subject, setSubject] = useState(type === 'quote' ? 'Votre devis' : 'Votre facture')
 const [gmailConnected, setGmailConnected] = useState(false)
 const [gmailEmail, setGmailEmail] = useState<string | null>(null)
 const [showUpgradeModal, setShowUpgradeModal] = useState(false)
 const [upgradePlan, setUpgradePlan] = useState('free')

 // Check Gmail status on mount
 useEffect(() => {
  getGmailStatus().then((status) => {
   setGmailConnected(status.connected)
   setGmailEmail(status.email)
  })
 }, [])

 const handleGenerateAI = async () => {
  setIsGenerating(true)
  try {
   let result
   if (type === 'quote') {
    result = await generateEmailForQuote(id)
   } else {
    result = await generateEmailForInvoice(id)
   }

   if ('content' in result && result.content) {
    // Extract subject from first line if it starts with "Objet:"
    const lines = result.content.split('\n')
    if (lines[0]?.toLowerCase().startsWith('objet:')) {
     setSubject(lines[0].replace(/^objet:\s*/i, '').trim())
     setContent(lines.slice(1).join('\n').trim())
    } else {
     setContent(result.content)
    }
    toast.success('Email généré par l\'IA')
   } else if ((result as any).upgradeRequired) {
    // Free plan: show upsell modal instead of toast
    setUpgradePlan((result as any).currentPlan || 'free')
    setShowUpgradeModal(true)
   } else {
    toast.error((result as any).error || "Erreur lors de la génération")
   }
  } catch (error) {
   toast.error("Erreur inattendue")
  } finally {
   setIsGenerating(false)
  }
 }

 const handleCopy = () => {
  navigator.clipboard.writeText(`Objet: ${subject}\n\n${content}`)
  toast.success("Email copié !")
 }

 const handleSendViaGmail = () => {
  if (!content.trim()) {
   toast.error('Veuillez écrire le contenu de l\'email')
   return
  }

  startSendTransition(async () => {
   try {
    // Convert plain text to basic HTML
    const htmlBody = content
     .split('\n')
     .map(line => line.trim() ? `<p>${line}</p>` : '<br/>')
     .join('')

    let result
    if (type === 'invoice') {
     result = await sendInvoiceEmail(id, subject, htmlBody)
    } else {
     result = await sendQuoteEmail(id, subject, htmlBody)
    }

    if ('success' in result && result.success) {
     toast.success('Email envoyé avec succès !')
     setIsOpen(false)
     setContent('')
     setSubject(type === 'quote' ? 'Votre devis' : 'Votre facture')
    } else {
     toast.error(result.error || 'Erreur lors de l\'envoi')
    }
   } catch (error: any) {
    toast.error(error.message || 'Erreur inattendue')
   }
  })
 }

 return (
  <>
   <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
     {trigger || (
      <Button variant="outline" size="sm">
       <Send className="w-4 h-4 mr-2" />
       Envoyer par Email
      </Button>
     )}
    </DialogTrigger>
    <DialogContent className="sm:max-w-[600px]">
     <DialogHeader>
      <DialogTitle>Envoyer par email</DialogTitle>
      <DialogDescription>
       Rédigez votre email ou utilisez l&apos;IA pour générer un brouillon.
      </DialogDescription>
     </DialogHeader>

     <div className="space-y-4 py-4">
      {/* Subject Field */}
      <div className="space-y-2">
       <Label htmlFor="subject">Objet</Label>
       <Input
        id="subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Objet de l'email"
       />
      </div>

      {/* Content Field */}
      <div className="space-y-2">
       <div className="flex items-center justify-between">
        <Label>Message</Label>
        <Button
         variant="ghost"
         size="sm"
         onClick={handleGenerateAI}
         disabled={isGenerating}
         className="text-primary hover:text-primary/80 hover:bg-primary/10"
        >
         {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
         ) : (
          <Wand2 className="w-4 h-4 mr-1" />
         )}
         Générer avec IA
        </Button>
       </div>
       <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px] leading-relaxed"
        placeholder={`Bonjour,\n\nVeuillez trouver ci-joint...\n\nCordialement,`}
       />
      </div>

      {/* Gmail status indicator */}
      {gmailConnected ? (
       <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm">
        <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-green-700 dark:text-green-300">
         Gmail connecté : <strong>{gmailEmail}</strong>
        </span>
       </div>
      ) : (
       <div className="flex items-center justify-between gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
        <div className="flex items-center gap-2">
         <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
         <span className="text-amber-700 dark:text-amber-300">Gmail non connecté</span>
        </div>
        <Button asChild variant="outline" size="sm">
         <Link href="/dashboard/settings?tab=integrations">Connecter</Link>
        </Button>
       </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
       <Button variant="outline" onClick={handleCopy}>
        <Copy className="w-4 h-4 mr-2" />
        Copier
       </Button>
       {gmailConnected ? (
        <Button
         onClick={handleSendViaGmail}
         disabled={isSending || !content.trim()}
        >
         {isSending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
         ) : (
          <Send className="w-4 h-4 mr-2" />
         )}
         Envoyer
        </Button>
       ) : (
        <Button
         variant="outline"
         onClick={() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`
         }}
        >
         <Send className="w-4 h-4 mr-2" />
         Ouvrir Client Mail
        </Button>
       )}
      </div>
     </div>
    </DialogContent>
   </Dialog>

   {/* Upsell Modal for free plan */}
   <LimitReachedModal
    isOpen={showUpgradeModal}
    onClose={() => setShowUpgradeModal(false)}
    currentPlan={upgradePlan}
    limitType="ai"
   />
  </>
 )
}
