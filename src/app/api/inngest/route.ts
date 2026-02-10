import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { paymentRecovery } from "@/lib/inngest/functions/payment-recovery";
import { checkOverdueInvoices } from "@/lib/inngest/functions/invoices";

// Create an API that serves zero-latency functions
export const { GET, POST, PUT } = serve({
 client: inngest,
 functions: [
  paymentRecovery,
  checkOverdueInvoices,
 ],
});
