import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Singleton pattern to prevent multiple connections in development
const globalForDb = global as unknown as { conn: postgres.Sql | undefined }
const conn = globalForDb.conn ?? postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for Supabase Transaction mode pooler
})
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema })

// Export schema for use in other files
export { schema }
