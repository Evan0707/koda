'use server'

import Groq from 'groq-sdk'
import { getOrganizationId } from '@/lib/auth'
import { getQuote } from './quotes'
import { getInvoice } from './invoices'

// Initialize Groq client lazily
function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing in environment variables")
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

/**
 * Generates content using Groq (LLaMA 3 70B - fast & free)
 */
export async function generateAIContent(prompt: string, context?: string) {
    try {
        // Ensure user is authenticated
        await getOrganizationId()

        // Check AI feature access (starter+ only)
        const { checkFeatureAccess } = await import('./plan-limits')
        const featureCheck = await checkFeatureAccess('ai_email')
        if (!featureCheck.hasAccess) {
            return { success: false, error: featureCheck.error, upgradeRequired: true, currentPlan: 'free' }
        }

        // Rate limit AI calls
        const { getRateLimitKey, isRateLimited, rateLimiters } = await import('@/lib/rate-limit')
        const key = await getRateLimitKey('ai_generate')
        if (await isRateLimited(key, rateLimiters.standard)) {
            return { success: false, error: 'Trop de requêtes IA. Veuillez patienter quelques secondes.' }
        }

        const groq = getGroqClient()

        const fullPrompt = `
      Role: You are a helpful assistant for KodaFlow, a freelancer platform.
      Goal: Draft professional emails, Contracts clauses, or categorize transactions.
      Tone: Professional, concise, efficient.
      Language: French (France).
      
      ${context ? `CONTEXT:\n${context}` : ''}
      
      TASK:
      ${prompt}
    `

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a professional assistant for freelancers. Always respond in French." },
                { role: "user", content: fullPrompt }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        })

        const content = response.choices[0]?.message?.content || ""

        return {
            success: true,
            content
        }

    } catch (error: unknown) {
        console.error("AI Generation Error (Groq):", error)

        let errorMessage = "Une erreur est survenue lors de la génération avec l'IA."

        // Safe access to error properties
        const errorStatus = (error as any)?.status

        if (errorStatus === 401) {
            errorMessage = "Clé API Groq invalide."
        } else if (errorStatus === 429) {
            errorMessage = "Limite de requêtes Groq atteinte. Réessayez dans quelques secondes."
        } else if (errorStatus === 500) {
            errorMessage = "Erreur serveur Groq. Réessayez plus tard."
        }

        return {
            success: false,
            error: errorMessage
        }
    }
}

export async function generateEmailForQuote(quoteId: string) {
    const { quote } = await getQuote(quoteId)
    if (!quote) return { error: "Devis non trouvé" }

    const context = `
    Type: Devis
    Numéro: ${quote.number}
    Montant: ${((quote.total || 0) / 100).toFixed(2)} €
    Client: ${quote.contact ? `${quote.contact.firstName} ${quote.contact.lastName}` : (quote.company?.name || 'Client')}
    Date: ${quote.createdAt}
    Sujet de l'email: Envoi du devis pour validation
  `

    const prompt = `Rédige un email professionnel, courtois et concis pour envoyer ce devis au client. L'email doit inciter à la validation. Ne mets pas d'objet, juste le corps du mail.`

    return generateAIContent(prompt, context)
}

export async function generateEmailForInvoice(invoiceId: string) {
    const { invoice } = await getInvoice(invoiceId)
    if (!invoice) return { error: "Facture non trouvée" }

    const isOverdue = invoice.status === 'overdue'

    const context = `
    Type: Facture
    Numéro: ${invoice.number}
    Montant: ${((invoice.total || 0) / 100).toFixed(2)} €
    Client: ${invoice.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName}` : (invoice.company?.name || 'Client')}
    Date d'échéance: ${invoice.dueDate}
    Statut: ${invoice.status}
    ${isOverdue ? "ATTENTION: La facture est en retard de paiement." : ""}
  `

    const prompt = isOverdue
        ? `Rédige un email de relance pour cette facture impayée. Le ton doit être ferme mais poli. Rappelle que le paiement est attendu rapidement.`
        : `Rédige un email professionnel et cordial pour envoyer cette facture au client. Remercie pour la collaboration.`

    return generateAIContent(prompt, context)
}
