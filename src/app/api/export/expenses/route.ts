import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { getOrganizationId } from '@/lib/auth'
import { generateExpensesCSV, getExportFilename, type ExpenseExportData } from '@/lib/exports'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { isRateLimited, getRateLimitKey, rateLimiters } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const rateLimitKey = await getRateLimitKey('export:expenses')
    if (await isRateLimited(rateLimitKey, rateLimiters.standard)) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans un instant.' }, { status: 429 })
    }

    const organizationId = await getOrganizationId()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const status = searchParams.get('status')

    const conditions: any[] = [eq(schema.expenses.organizationId, organizationId)]

    if (startDate) {
      conditions.push(gte(schema.expenses.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(schema.expenses.date, endDate))
    }
    if (status && status !== 'all') {
      conditions.push(eq(schema.expenses.status, status))
    }

    const expenses = await db.query.expenses.findMany({
      where: and(...conditions),
      with: {
        category: true,
      },
      orderBy: [desc(schema.expenses.date)],
    })

    const exportData: ExpenseExportData[] = expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      vatAmount: e.vatAmount,
      vatRate: e.vatRate,
      date: e.date,
      status: e.status,
      category: e.category ? { name: e.category.name } : null,
    }))

    const content = generateExpensesCSV(exportData)
    const filename = getExportFilename('csv', startDate || undefined, endDate || undefined, 'depenses')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export expenses error:', error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}
