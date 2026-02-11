'use server'

import { db, schema } from '@/db'
import { eq, isNull, and } from 'drizzle-orm'

// Get quote for public signature page (no auth required)
export async function getPublicQuote(quoteId: string) {
 try {
  const quote = await db.query.quotes.findFirst({
   where: and(
    eq(schema.quotes.id, quoteId),
    isNull(schema.quotes.deletedAt)
   ),
   with: {
    contact: true,
    company: true,
    organization: true,
    items: true,
   }
  })

  if (!quote) {
   return { error: 'Devis introuvable' }
  }

  // Increment view count and set viewed date
  await db.update(schema.quotes)
   .set({
    viewCount: (quote.viewCount || 0) + 1,
    viewedAt: quote.viewedAt || new Date(),
    updatedAt: new Date(),
   })
   .where(eq(schema.quotes.id, quoteId))

  return {
   quote: {
    id: quote.id,
    number: quote.number,
    status: quote.status,
    title: quote.title,
    introduction: quote.introduction,
    terms: quote.terms,
    notes: quote.notes,
    issueDate: quote.issueDate,
    validUntil: quote.validUntil,
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    total: quote.total,
    discount: quote.discount,
    currency: quote.currency,
    depositPercent: quote.depositPercent,
    depositRequired: quote.depositRequired,
    signedAt: quote.signedAt,
    items: quote.items.map(item => ({
     description: item.description,
     quantity: Number(item.quantity),
     unitPrice: item.unitPrice,
     total: item.total,
    })),
    contact: quote.contact ? {
     name: [quote.contact.firstName, quote.contact.lastName].filter(Boolean).join(' ') || 'Contact',
     email: quote.contact.email,
     companyName: quote.company?.name || null,
    } : null,
    organization: {
     name: quote.organization?.name || 'Entreprise',
     address: quote.organization?.address,
     city: quote.organization?.city,
     postalCode: quote.organization?.postalCode,
     country: quote.organization?.country,
     siret: quote.organization?.siret,
     vatNumber: quote.organization?.vatNumber,
     logoUrl: quote.organization?.logoUrl,
    },
   },
  }
 } catch (error) {
  console.error('Error fetching public quote:', error)
  return { error: 'Erreur lors de la récupération du devis' }
 }
}

// Sign quote with signature data
export async function signQuote(
 quoteId: string,
 signatureData: {
  signature: string // Base64 image
  signerName: string
  signerEmail: string
  signerIp?: string
 }
) {
 try {
  const quote = await db.query.quotes.findFirst({
   where: and(
    eq(schema.quotes.id, quoteId),
    isNull(schema.quotes.deletedAt)
   )
  })

  if (!quote) {
   return { error: 'Devis introuvable' }
  }

  if (quote.status === 'signed') {
   return { error: 'Ce devis a déjà été signé' }
  }

  // Check if quote is still valid
  if (quote.validUntil) {
   const validDate = new Date(quote.validUntil)
   if (validDate < new Date()) {
    return { error: 'Ce devis a expiré' }
   }
  }

  // Update quote with signature
  await db.update(schema.quotes)
   .set({
    status: 'signed',
    signedAt: new Date(),
    signatureData: {
     ...signatureData,
     signedAt: new Date().toISOString(),
    } as any,
    updatedAt: new Date(),
   })
   .where(eq(schema.quotes.id, quoteId))

  return { success: true }

 } catch (error) {
  console.error('Error signing quote:', error)
  return { error: 'Erreur lors de la signature' }
 }
}
