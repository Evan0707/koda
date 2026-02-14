'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
 CheckCircle,
 FileText,
 Pen,
 Eraser,
 Download,
 Loader2,
 Calendar,
 Building2,
 User,
 Check,
 Undo2,
} from 'lucide-react'
import { signQuote } from '@/lib/actions/quote-signature'
import { toast } from 'sonner'
import { triggerFireworks } from '@/lib/confetti'
import type { PublicQuote } from '@/types/db'

export default function QuoteSignatureClient({ quote }: { quote: PublicQuote }) {
 const [isPending, startTransition] = useTransition()
 const [isSigned, setIsSigned] = useState(quote.status === 'signed')
 const [signerName, setSignerName] = useState(quote.contact?.name || '')
 const [signerEmail, setSignerEmail] = useState(quote.contact?.email || '')
 const canvasRef = useRef<HTMLCanvasElement>(null)
 const [isDrawing, setIsDrawing] = useState(false)
 const [hasSignature, setHasSignature] = useState(false)
 const [strokes, setStrokes] = useState<Array<Array<{ x: number, y: number }>>>([])
 const [currentStroke, setCurrentStroke] = useState<Array<{ x: number, y: number }>>([])

 const formatPrice = (cents: number | null) => {
  if (cents === null) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
   style: 'currency',
   currency: quote.currency || 'EUR',
  }).format(cents / 100)
 }

 const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
   day: 'numeric',
   month: 'long',
   year: 'numeric',
  })
 }

 // Canvas drawing functions
 const redrawCanvas = (strokesToDraw: Array<Array<{ x: number, y: number }>>) => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  strokesToDraw.forEach(stroke => {
   if (stroke.length === 0) return
   ctx.beginPath()
   ctx.moveTo(stroke[0].x, stroke[0].y)
   stroke.forEach(point => {
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1f2937'
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
   })
  })
 }

 const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current
  if (!canvas) return

  setIsDrawing(true)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY

  setCurrentStroke([{ x, y }])
  ctx.beginPath()
  ctx.moveTo(x, y)
 }

 const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
  if (!isDrawing) return
  const canvas = canvasRef.current
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY

  setCurrentStroke(prev => [...prev, { x, y }])

  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#1f2937'
  ctx.lineTo(x, y)
  ctx.stroke()
  setHasSignature(true)
 }

 const stopDrawing = () => {
  if (currentStroke.length > 0) {
   setStrokes(prev => [...prev, currentStroke])
   setCurrentStroke([])
  }
  setIsDrawing(false)
 }

 const clearSignature = () => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  setStrokes([])
  setCurrentStroke([])
  setHasSignature(false)
 }

 const undoLastStroke = () => {
  if (strokes.length === 0) return
  const newStrokes = strokes.slice(0, -1)
  setStrokes(newStrokes)
  redrawCanvas(newStrokes)
  setHasSignature(newStrokes.length > 0)
 }

 const handleSign = () => {
  if (!signerName.trim()) {
   toast.error('Veuillez entrer votre nom')
   return
  }
  if (!signerEmail.trim()) {
   toast.error('Veuillez entrer votre email')
   return
  }
  if (!hasSignature) {
   toast.error('Veuillez signer dans la zone de signature')
   return
  }

  const canvas = canvasRef.current
  if (!canvas) return

  const signatureImage = canvas.toDataURL('image/png')

  startTransition(async () => {
   const result = await signQuote(quote.id, {
    signature: signatureImage,
    signerName: signerName.trim(),
    signerEmail: signerEmail.trim(),
   })

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Devis signé avec succès !')
    triggerFireworks()
    setIsSigned(true)
   }
  })
 }

 // Already signed view
 if (isSigned) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 flex items-center justify-center p-4">
    <Card className="max-w-lg w-full">
     <CardContent className="pt-10 pb-8 text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
       <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">
       Devis accepté ! ✅
      </h1>
      <p className="text-muted-foreground mb-6">
       Le devis <strong>#{quote.number}</strong> a été signé et accepté.
      </p>
      <div className="bg-muted rounded-lg p-4 text-left mb-6">
       <p className="text-sm text-muted-foreground mb-1">Montant total</p>
       <p className="text-2xl font-bold text-foreground">{formatPrice(quote.total)}</p>
      </div>
      <p className="text-sm text-muted-foreground/80">
       Une confirmation a été envoyée à {quote.organization.name}.
      </p>
     </CardContent>
    </Card>
   </div>
  )
 }

 // Quote expired check
 const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date()
 if (isExpired) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950/30 dark:to-orange-950/30 flex items-center justify-center p-4">
    <Card className="max-w-lg w-full">
     <CardContent className="pt-10 pb-8 text-center">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
       <Calendar className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">
       Devis expiré
      </h1>
      <p className="text-muted-foreground">
       Ce devis était valable jusqu'au {formatDate(quote.validUntil)} et n'est plus disponible.
      </p>
     </CardContent>
    </Card>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-background py-8 px-4">
   <div className="max-w-4xl mx-auto space-y-6">
    {/* Header */}
    <div className="text-center mb-8">
     <Badge className="bg-primary/10 text-primary mb-4 hover:bg-primary/10">
      Devis #{quote.number}
     </Badge>
     <h1 className="text-3xl font-bold text-foreground mb-2">
      {quote.title || 'Devis'}
     </h1>
     <p className="text-muted-foreground">
      Proposé par <strong>{quote.organization.name}</strong>
     </p>
    </div>

    {/* Quote Details Card */}
    <Card>
     <CardHeader className="border-b border-border">
      <div className="flex items-center justify-between">
       <CardTitle className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Détails du devis
       </CardTitle>
       <div className="text-right text-sm text-muted-foreground">
        <p>Émis le {formatDate(quote.issueDate)}</p>
        <p>Valable jusqu'au {formatDate(quote.validUntil)}</p>
       </div>
      </div>
     </CardHeader>
     <CardContent className="pt-6">
      {/* Organization & Client Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
       <div>
        <p className="text-sm text-muted-foreground mb-2">De</p>
        <div className="flex items-start gap-2">
         <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
         <div>
          <p className="font-medium text-foreground">{quote.organization.name}</p>
          {quote.organization.address && (
           <p className="text-sm text-muted-foreground">
            {quote.organization.address}<br />
            {quote.organization.postalCode} {quote.organization.city}
           </p>
          )}
         </div>
        </div>
       </div>
       <div>
        <p className="text-sm text-muted-foreground mb-2">À</p>
        <div className="flex items-start gap-2">
         <User className="w-4 h-4 text-muted-foreground mt-1" />
         <div>
          <p className="font-medium text-foreground">{quote.contact?.name || 'Client'}</p>
          {quote.contact?.companyName && (
           <p className="text-sm text-muted-foreground">{quote.contact.companyName}</p>
          )}
          {quote.contact?.email && (
           <p className="text-sm text-muted-foreground">{quote.contact.email}</p>
          )}
         </div>
        </div>
       </div>
      </div>

      {/* Introduction */}
      {quote.introduction && (
       <div className="mb-6 p-4 bg-muted rounded-lg">
        <p className="text-foreground whitespace-pre-wrap">{quote.introduction}</p>
       </div>
      )}

      {/* Items Table */}
      <div className="border border-border rounded-lg overflow-hidden mb-6">
       <table className="w-full">
        <thead className="bg-muted">
         <tr>
          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Description</th>
          <th className="text-center p-3 text-sm font-medium text-muted-foreground w-24">Qté</th>
          <th className="text-right p-3 text-sm font-medium text-muted-foreground w-32">Prix unit.</th>
          <th className="text-right p-3 text-sm font-medium text-muted-foreground w-32">Total</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-border">
         {quote.items.map((item, idx) => (
          <tr key={idx}>
           <td className="p-3 text-foreground">{item.description}</td>
           <td className="p-3 text-center text-foreground">{item.quantity}</td>
           <td className="p-3 text-right text-muted-foreground">{formatPrice(item.unitPrice)}</td>
           <td className="p-3 text-right font-medium text-foreground">{formatPrice(item.total)}</td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
       <div className="w-64 space-y-2">
        <div className="flex justify-between text-sm">
         <span className="text-muted-foreground">Sous-total HT</span>
         <span className="text-foreground">{formatPrice(quote.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
         <span className="text-muted-foreground">TVA</span>
         <span className="text-foreground">{formatPrice(quote.vatAmount)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
         <span className="text-foreground">Total TTC</span>
         <span className="text-primary">{formatPrice(quote.total)}</span>
        </div>
       </div>
      </div>

      {/* Terms */}
      {quote.terms && (
       <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm font-medium text-foreground mb-2">Conditions</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.terms}</p>
       </div>
      )}
     </CardContent>
    </Card>

    {/* Signature Card */}
    <Card className="border-2 border-primary/20">
     <CardHeader>
      <CardTitle className="flex items-center gap-2 text-primary">
       <Pen className="w-5 h-5" />
       Signature électronique
      </CardTitle>
     </CardHeader>
     <CardContent className="space-y-6">
      <p className="text-muted-foreground">
       En signant ce devis, vous acceptez les conditions proposées et confirmez votre accord pour les prestations décrites.
      </p>

      {/* Signer Info */}
      <div className="grid md:grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label htmlFor="signerName">Votre nom *</Label>
        <Input
         id="signerName"
         value={signerName}
         onChange={(e) => setSignerName(e.target.value)}
         placeholder="Jean Dupont"
        />
       </div>
       <div className="space-y-2">
        <Label htmlFor="signerEmail">Votre email *</Label>
        <Input
         id="signerEmail"
         type="email"
         value={signerEmail}
         onChange={(e) => setSignerEmail(e.target.value)}
         placeholder="jean@example.com"
        />
       </div>
      </div>

      {/* Signature Canvas */}
      <div className="space-y-2">
       <div className="flex items-center justify-between">
        <Label>Signature *</Label>
        <div className="flex gap-2">
         <Button
          variant="ghost"
          size="sm"
          onClick={undoLastStroke}
          disabled={strokes.length === 0}
          className="text-muted-foreground"
         >
          <Undo2 className="w-4 h-4 mr-1" />
          Annuler
         </Button>
         <Button
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          className="text-muted-foreground"
         >
          <Eraser className="w-4 h-4 mr-1" />
          Effacer
         </Button>
        </div>
       </div>
       {/* Keep white background for signaturepad as discussed */}
       <div className="border-2 border-dashed border-input rounded-lg bg-white overflow-hidden">
        <canvas
         ref={canvasRef}
         width={1200}
         height={400}
         className="w-full cursor-crosshair touch-none"
         style={{ height: '200px' }}
         onMouseDown={startDrawing}
         onMouseMove={draw}
         onMouseUp={stopDrawing}
         onMouseLeave={stopDrawing}
         onTouchStart={startDrawing}
         onTouchMove={draw}
         onTouchEnd={stopDrawing}
        />
       </div>
       <p className="text-xs text-muted-foreground text-center">
        Dessinez votre signature avec la souris ou le doigt
       </p>
      </div>

      {/* Submit Button */}
      <Button
       onClick={handleSign}
       disabled={isPending || !hasSignature}
       className="w-full bg-primary hover:bg-primary/90 h-10 text-md"
      >
       {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
       ) : (
        <Check className="w-5 h-5 mr-2" />
       )}
       Signer et accepter le devis
      </Button>

      <p className="text-xs text-muted-foreground/80 text-center">
       En cliquant sur ce bouton, vous reconnaissez avoir lu et accepté ce devis.
       Cette signature électronique a valeur légale.
      </p>
     </CardContent>
    </Card>
   </div>
  </div>
 )
}
