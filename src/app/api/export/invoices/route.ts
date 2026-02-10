import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { getOrganizationId } from '@/lib/auth'
import { generateInvoicesCSV, generateInvoicesFEC, getExportFilename, InvoiceExportData } from '@/lib/exports'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
 try {
  const organizationId = await getOrganizationId()

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const status = searchParams.get('status')

  // Build query conditions
  const conditions: any[] = [eq(schema.invoices.organizationId, organizationId)]

  if (startDate) {
   conditions.push(gte(schema.invoices.issueDate, startDate))
  }
  if (endDate) {
   conditions.push(lte(schema.invoices.issueDate, endDate))
  }
  if (status && status !== 'all') {
   conditions.push(eq(schema.invoices.status, status))
  }

  // Fetch invoices with relations
  const invoices = await db.query.invoices.findMany({
   where: and(...conditions),
   with: {
    contact: true,
    company: true,
   },
   orderBy: [desc(schema.invoices.issueDate)],
  })

  // Map to export format
  const exportData: InvoiceExportData[] = invoices.map(inv => ({
   id: inv.id,
   number: inv.number,
   status: inv.status,
   issueDate: inv.issueDate,
   dueDate: inv.dueDate,
   paidAt: inv.paidAt,
   subtotal: inv.subtotal,
   vatAmount: inv.vatAmount,
   total: inv.total,
   paidAmount: inv.paidAmount,
   currency: inv.currency,
   contact: inv.contact ? {
    firstName: inv.contact.firstName,
    lastName: inv.contact.lastName,
    email: inv.contact.email,
   } : null,
   company: inv.company ? {
    name: inv.company.name,
   } : null,
  }))

  // Generate export content
  let content: string
  let contentType: string
  let filename: string

  if (format === 'fec') {
   content = generateInvoicesFEC(exportData)
   contentType = 'text/plain; charset=utf-8'
   filename = getExportFilename('fec', startDate || undefined, endDate || undefined)
  } else {
   content = generateInvoicesCSV(exportData)
   contentType = 'text/csv; charset=utf-8'
   filename = getExportFilename('csv', startDate || undefined, endDate || undefined)
  }

  // Return file download response
  return new NextResponse(content, {
   headers: {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
   },
  })

 } catch (error) {
  console.error('Export error:', error)
  return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 })
 }
}
