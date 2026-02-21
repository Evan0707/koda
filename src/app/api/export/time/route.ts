import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { getOrganizationId } from '@/lib/auth'
import { generateTimeEntriesCSV, getExportFilename, type TimeEntryExportData } from '@/lib/exports'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { isRateLimited, getRateLimitKey, rateLimiters } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const rateLimitKey = await getRateLimitKey('export:time')
    if (await isRateLimited(rateLimitKey, rateLimiters.standard)) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans un instant.' }, { status: 429 })
    }

    const organizationId = await getOrganizationId()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    const conditions: any[] = [eq(schema.timeEntries.organizationId, organizationId)]

    if (startDate) {
      conditions.push(gte(schema.timeEntries.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(schema.timeEntries.date, endDate))
    }

    const entries = await db.query.timeEntries.findMany({
      where: and(...conditions),
      with: {
        project: true,
        task: true,
      },
      orderBy: [desc(schema.timeEntries.date)],
    })

    const exportData: TimeEntryExportData[] = entries.map((e) => ({
      id: e.id,
      description: e.description,
      duration: e.duration,
      date: e.date,
      isBillable: e.isBillable,
      hourlyRate: e.hourlyRate,
      project: e.project ? { name: e.project.name } : null,
      task: e.task ? { title: e.task.title } : null,
    }))

    const content = generateTimeEntriesCSV(exportData)
    const filename = getExportFilename('csv', startDate || undefined, endDate || undefined, 'temps')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export time entries error:', error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}
