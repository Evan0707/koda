import { inngest } from "@/lib/inngest/client";
import { db, schema } from "@/db";
import { eq, and, lt } from "drizzle-orm";
import { createNotification } from "@/lib/actions/automation";

export const checkOverdueInvoices = inngest.createFunction(
 { id: "check-overdue-invoices" },
 { cron: "0 9 * * *" }, // Chaque jour à 9h
 async ({ step }) => {
  const overdueInvoices = await step.run("fetch-overdue-invoices", async () => {
   const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD for comparison with date type

   // Trouver les factures 'sent' dont la date d'échéance est passée
   const invoices = await db.query.invoices.findMany({
    where: and(
     eq(schema.invoices.status, 'sent'),
     lt(schema.invoices.dueDate, today)
    ),
    with: {
     organization: true,
    }
   });
   return invoices;
  });

  if (overdueInvoices.length === 0) {
   return { message: "No overdue invoices found" };
  }

  let processedCount = 0;

  // Pour chaque facture, on met à jour le statut et on notifie
  for (const invoice of overdueInvoices) {
   await step.run(`process-invoice-${invoice.id}`, async () => {
    // Update status to overdue
    await db.update(schema.invoices)
     .set({ status: 'overdue' })
     .where(eq(schema.invoices.id, invoice.id));

    // Create notification for the creator
    if (invoice.createdById) {
     await createNotification(
      invoice.createdById,
      invoice.organizationId,
      {
       title: "Facture en retard",
       message: `La facture ${invoice.number} est arrivée à échéance le ${invoice.dueDate}.`,
       type: "warning",
       resourceType: "invoice",
       resourceId: invoice.id,
       link: `/dashboard/invoices`
      }
     );
    }
   });
   processedCount++;
  }

  return { processed: processedCount };
 }
);
