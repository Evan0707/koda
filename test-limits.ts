import dotenv from 'dotenv'
import fs from 'fs'
dotenv.config({ path: '.env.local' })
import { db, schema } from './src/db'
import { eq, isNull, and } from 'drizzle-orm'
import { contacts } from './src/db/schema/crm'
async function run() {
 const users = await db.query.users.findMany({
  with: { organization: true },
  limit: 10
 });
 console.log("Found users: ", users.length);
 for (const u of users) {
  if (u.organization) {
   const count = await db.$count(
    contacts,
    and(
     eq(contacts.organizationId, u.organization.id),
     isNull(contacts.deletedAt)
    )
   );
   console.log(`User ${u.id} - Org: ${u.organization.id} - Contacts count: ${count}`);
  }
 }
}

run().catch(console.error).finally(() => process.exit(0));
