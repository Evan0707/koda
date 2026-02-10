import { inngest } from "@/lib/inngest/client";
import { db } from "@/db";
import { invoices } from "@/db/schema/billing";
import { eq } from "drizzle-orm";

export const paymentRecovery = inngest.createFunction(
 { id: "payment-recovery" },
 { event: "invoice.sent" },
 async ({ event, step }) => {
  const { invoiceId } = event.data;

  // 1. Wait for 10 days
  // For demo purposes, we can use a shorter duration if testing, but the brief says J+10
  await step.sleep("wait-10-days", "10d");

  // 2. Check invoice status
  const invoice = await step.run("check-invoice-status", async () => {
   const result = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
   });

   if (!result) throw new Error("Invoice not found");
   return result;
  });

  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
   return { message: "Invoice already paid or cancelled" };
  }

  // 3. Send reminder email
  await step.run("send-reminder-email", async () => {
   // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
   console.log(`Sending reminder email for invoice ${invoiceId}`);

   // Update reminder count
   await db.update(invoices)
    .set({
     lastReminderAt: new Date(),
     reminderCount: (invoice.reminderCount || 0) + 1
    })
    .where(eq(invoices.id, invoiceId));
  });

  // 4. Send SMS (as per brief)
  // "Envoyer mail relance + SMS"
  await step.run("send-reminder-sms", async () => {
   // TODO: Integrate with SMS service (Twilio, etc.)
   console.log(`Sending reminder SMS for invoice ${invoiceId}`);
  });

  return { message: "Reminders sent" };
 }
);
