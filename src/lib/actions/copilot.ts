'use server'

import Groq from 'groq-sdk'
import { db } from '@/db'
import { invoices, quotes } from '@/db/schema/billing'
import { opportunities, pipelineStages } from '@/db/schema/crm'
import { timeEntries } from '@/db/schema/projects'
import { getOrganizationId } from '@/lib/auth'
import { and, eq, isNull, sql, gte, count, sum, desc } from 'drizzle-orm'

// ─── Types ───────────────────────────────────────────────────

export type CopilotInsight = {
 emoji: string
 title: string
 detail: string
 action?: string
 actionHref?: string
 severity: 'info' | 'warning' | 'success' | 'critical'
}

// ─── Business Snapshot ───────────────────────────────────────

async function getBusinessSnapshot(organizationId: string) {
 const now = new Date()
 const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
 const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
 const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)

 // Execute all queries in parallel
 const [
  revenueThisMonth,
  revenuePrevMonth,
  overdueInvoices,
  pendingQuotesData,
  acceptedQuotesMonth,
  sentQuotesMonth,
  pipelineData,
  timeThisMonth,
 ] = await Promise.all([
  // Revenue this month
  db.select({ total: sum(invoices.total) })
   .from(invoices)
   .where(and(
    eq(invoices.organizationId, organizationId),
    eq(invoices.status, 'paid'),
    gte(invoices.paidAt, startOfMonth),
   ))
   .then(r => Number(r[0]?.total || 0)),

  // Revenue previous month
  db.select({ total: sum(invoices.total) })
   .from(invoices)
   .where(and(
    eq(invoices.organizationId, organizationId),
    eq(invoices.status, 'paid'),
    gte(invoices.paidAt, startOfPrevMonth),
    sql`${invoices.paidAt} < ${endOfPrevMonth}`,
   ))
   .then(r => Number(r[0]?.total || 0)),

  // Overdue invoices (with details)
  db.query.invoices.findMany({
   where: and(
    eq(invoices.organizationId, organizationId),
    eq(invoices.status, 'overdue'),
    isNull(invoices.deletedAt),
   ),
   columns: { id: true, number: true, total: true, dueDate: true },
   with: { contact: { columns: { firstName: true, lastName: true } }, company: { columns: { name: true } } },
   orderBy: [desc(invoices.dueDate)],
   limit: 5,
  }),

  // Pending quotes
  db.select({ count: count(), total: sum(quotes.total) })
   .from(quotes)
   .where(and(
    eq(quotes.organizationId, organizationId),
    eq(quotes.status, 'sent'),
    isNull(quotes.deletedAt),
   ))
   .then(r => ({ count: Number(r[0]?.count || 0), total: Number(r[0]?.total || 0) })),

  // Accepted quotes this month (conversion tracking)
  db.select({ count: count() })
   .from(quotes)
   .where(and(
    eq(quotes.organizationId, organizationId),
    eq(quotes.status, 'accepted'),
    gte(quotes.updatedAt, startOfMonth),
    isNull(quotes.deletedAt),
   ))
   .then(r => Number(r[0]?.count || 0)),

  // Sent quotes this month (for conversion rate)
  db.select({ count: count() })
   .from(quotes)
   .where(and(
    eq(quotes.organizationId, organizationId),
    sql`${quotes.status} IN ('sent', 'accepted', 'rejected')`,
    gte(quotes.createdAt, startOfMonth),
    isNull(quotes.deletedAt),
   ))
   .then(r => Number(r[0]?.count || 0)),

  // Pipeline (active opportunities)
  (async () => {
   const stages = await db.select().from(pipelineStages)
    .where(eq(pipelineStages.organizationId, organizationId))
   const excludedIds = stages.filter(s => s.isWon || s.isLost).map(s => s.id)

   const result = await db.select({
    count: count(),
    total: sum(opportunities.value),
    weighted: sql<number>`SUM(${opportunities.value} * ${opportunities.probability} / 100)`,
   })
    .from(opportunities)
    .where(and(
     eq(opportunities.organizationId, organizationId),
     excludedIds.length > 0
      ? sql`${opportunities.stageId} NOT IN (${sql.join(excludedIds.map(id => sql`${id}`), sql`, `)})`
      : sql`1=1`,
     isNull(opportunities.deletedAt),
    ))
   return {
    count: Number(result[0]?.count || 0),
    total: Number(result[0]?.total || 0),
    weighted: Number(result[0]?.weighted || 0),
   }
  })(),

  // Time tracked this month
  db.select({
   totalMinutes: sum(timeEntries.duration),
   billableMinutes: sql<number>`SUM(CASE WHEN ${timeEntries.isBillable} = true THEN ${timeEntries.duration} ELSE 0 END)`,
  })
   .from(timeEntries)
   .where(and(
    eq(timeEntries.organizationId, organizationId),
    gte(timeEntries.date, startOfMonth.toISOString().slice(0, 10)),
   ))
   .then(r => ({
    totalMinutes: Number(r[0]?.totalMinutes || 0),
    billableMinutes: Number(r[0]?.billableMinutes || 0),
   })),
 ])

 // Calculate derived metrics
 const revenueChange = revenuePrevMonth > 0
  ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
  : revenueThisMonth > 0 ? 100 : 0

 const quoteConversionRate = sentQuotesMonth > 0
  ? Math.round((acceptedQuotesMonth / sentQuotesMonth) * 100)
  : null

 const totalHours = Math.round(timeThisMonth.totalMinutes / 60)
 const billableHours = Math.round(timeThisMonth.billableMinutes / 60)
 const utilizationRate = totalHours > 0
  ? Math.round((billableHours / totalHours) * 100)
  : null

 // TJM réel (if we have billable hours and revenue)
 const workingDays = billableHours > 0 ? Math.round(billableHours / 7) : null // ~7h/jour
 const tjmReel = workingDays && workingDays > 0 && revenueThisMonth > 0
  ? Math.round((revenueThisMonth / 100) / workingDays)
  : null

 const overdueTotal = overdueInvoices.reduce((s, inv) => s + (inv.total || 0), 0)

 return {
  revenueThisMonth,
  revenuePrevMonth,
  revenueChange,
  overdueInvoices: overdueInvoices.map(inv => ({
   number: inv.number,
   total: inv.total || 0,
   dueDate: inv.dueDate,
   client: inv.company?.name || [inv.contact?.firstName, inv.contact?.lastName].filter(Boolean).join(' ') || 'Client',
  })),
  overdueTotal,
  overdueCount: overdueInvoices.length,
  pendingQuotes: pendingQuotesData,
  quoteConversionRate,
  pipeline: pipelineData,
  totalHours,
  billableHours,
  utilizationRate,
  tjmReel,
  currentDate: now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
 }
}

// ─── AI Insight Generation ───────────────────────────────────

function getGroqClient() {
 if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing")
 }
 return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function getCopilotInsights(): Promise<{ insights?: CopilotInsight[]; error?: string; upgradeRequired?: boolean }> {
 try {
  const organizationId = await getOrganizationId()

  // Plan check
  const { checkFeatureAccess } = await import('./plan-limits')
  const featureCheck = await checkFeatureAccess('ai_email')
  if (!featureCheck.hasAccess) {
   return { error: featureCheck.error, upgradeRequired: true }
  }

  // Rate limit
  const { getRateLimitKey, isRateLimited, rateLimiters } = await import('@/lib/rate-limit')
  const key = await getRateLimitKey('copilot_insights')
  if (await isRateLimited(key, rateLimiters.standard)) {
   return { error: 'Trop de requêtes. Réessayez dans un instant.' }
  }

  // Gather business data
  const snapshot = await getBusinessSnapshot(organizationId)

  // Build context for the AI
  const context = `
DONNÉES BUSINESS AU ${snapshot.currentDate}:

CA CE MOIS: ${(snapshot.revenueThisMonth / 100).toFixed(2)}€
CA MOIS PRÉCÉDENT: ${(snapshot.revenuePrevMonth / 100).toFixed(2)}€
ÉVOLUTION CA: ${snapshot.revenueChange > 0 ? '+' : ''}${snapshot.revenueChange}%

FACTURES EN RETARD: ${snapshot.overdueCount} pour ${(snapshot.overdueTotal / 100).toFixed(2)}€
${snapshot.overdueInvoices.map(inv => `  - ${inv.number} (${inv.client}): ${(inv.total / 100).toFixed(2)}€, échue le ${inv.dueDate}`).join('\n')}

DEVIS EN ATTENTE: ${snapshot.pendingQuotes.count} pour ${(snapshot.pendingQuotes.total / 100).toFixed(2)}€
${snapshot.quoteConversionRate !== null ? `TAUX DE CONVERSION DEVIS: ${snapshot.quoteConversionRate}%` : 'PAS ASSEZ DE DONNÉES POUR LE TAUX DE CONVERSION'}

PIPELINE: ${snapshot.pipeline.count} opportunités pour ${(snapshot.pipeline.total / 100).toFixed(2)}€ (pondéré: ${(snapshot.pipeline.weighted / 100).toFixed(2)}€)

TEMPS CE MOIS: ${snapshot.totalHours}h total, ${snapshot.billableHours}h facturables
${snapshot.utilizationRate !== null ? `TAUX D'UTILISATION: ${snapshot.utilizationRate}%` : ''}
${snapshot.tjmReel !== null ? `TJM RÉEL: ${snapshot.tjmReel}€/jour` : ''}
`

  const groq = getGroqClient()

  const response = await groq.chat.completions.create({
   model: "llama-3.3-70b-versatile",
   messages: [
    {
     role: "system",
     content: `Tu es un co-pilote business IA pour un freelance français utilisant KodaFlow.
Tu analyses les données business et génères exactement 3 à 5 insights ACTIONNABLES.

RÈGLES:
- Sois concis et direct (1-2 phrases max par insight)
- Priorise les URGENCES (factures en retard, CA en baisse)
- Propose des ACTIONS concrètes quand possible
- Adapte le ton: alarme pour les problèmes, encouragement pour les bonnes nouvelles
- Si les données sont vides/nulles, donne des conseils de démarrage

RÉPONDS EN JSON VALIDE UNIQUEMENT, format:
[
  {
    "emoji": "💰",
    "title": "Titre court",
    "detail": "Explication en 1-2 phrases",
    "severity": "critical|warning|info|success",
    "action": "Texte du bouton d'action (optionnel)",
    "actionHref": "/dashboard/chemin (optionnel)"
  }
]

Severities:
- critical: factures très en retard, CA en chute libre
- warning: risques à surveiller, métriques en baisse
- info: suggestions d'amélioration, statistiques neutres
- success: bonnes performances, objectifs atteints`
    },
    { role: "user", content: context }
   ],
   max_tokens: 1000,
   temperature: 0.4, // Lower for more consistent structured output
   response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content || "[]"

  try {
   const parsed = JSON.parse(content)
   // Handle both array and { insights: [...] } format
   const insights: CopilotInsight[] = Array.isArray(parsed) ? parsed : (parsed.insights || parsed.data || [])

   // Validate each insight has required fields
   const validated = insights
    .filter(i => i.emoji && i.title && i.detail && i.severity)
    .slice(0, 5)

   return { insights: validated }
  } catch {
   console.error('[Copilot] Failed to parse AI response:', content)
   return { error: 'Réponse IA invalide. Réessayez.' }
  }

 } catch (error: unknown) {
  console.error('[Copilot] Error:', error)
  const status = (error as any)?.status
  if (status === 429) return { error: 'Limite IA atteinte. Réessayez dans quelques secondes.' }
  return { error: 'Erreur lors de l\'analyse. Réessayez.' }
 }
}
