import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { getOrganizationId } from '@/lib/auth'
import { generateQuotesCSV, getExportFilename, type QuoteExportData } from '@/lib/exports'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { isRateLimited, getRateLimitKey, rateLimiters } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const rateLimitKey = await getRateLimitKey('export:quotes')
    if (await isRateLimited(rateLimitKey, rateLimiters.standard)) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans un instant.' }, { status: 429 })
    }

    const organizationId = await getOrganizationId()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const status = searchParams.get('status')

    const conditions: any[] = [eq(schema.quotes.organizationId, organizationId)]

    if (startDate) {
      conditions.push(gte(schema.quotes.issueDate, startDate))
    }
    if (endDate) {
      conditions.push(lte(schema.quotes.issueDate, endDate))
    }
    if (status && status !== 'all') {
      conditions.push(eq(schema.quotes.status, status))
    }

    const quotes = await db.query.quotes.findMany({
      where: and(...conditions),
      with: {
        contact: true,
        company: true,
      },
      orderBy: [desc(schema.quotes.issueDate)],
    })

    const exportData: QuoteExportData[] = quotes.map((q) => ({
      id: q.id,
      number: q.number,
      status: q.status,
      title: q.title,
      issueDate: q.issueDate,
      validUntil: q.validUntil,
      signedAt: q.signedAt,
      subtotal: q.subtotal,
      vatAmount: q.vatAmount,
      total: q.total,
      currency: q.currency,
      contact: q.contact
        ? { firstName: q.contact.firstName, lastName: q.contact.lastName, email: q.contact.email }
        : null,
      company: q.company ? { name: q.company.name } : null,
    }))

    const content = generateQuotesCSV(exportData)
    const filename = getExportFilename('csv', startDate || undefined, endDate || undefined, 'devis')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export quotes error:', error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}
