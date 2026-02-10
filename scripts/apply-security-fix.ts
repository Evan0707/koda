import { db } from '../src/db'
import { sql } from 'drizzle-orm'

async function main() {
 console.log('Applying security fix...')
 await db.execute(sql`
    CREATE OR REPLACE FUNCTION public.handle_users_update_security()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Prevent changing role
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Security Violation: You cannot change your own role.';
      END IF;

      -- Prevent changing organization_id
      IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Security Violation: You cannot change your organization.';
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_users_update_security ON users;
    CREATE TRIGGER on_users_update_security
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION handle_users_update_security();
  `)
 console.log('Security fix applied successfully.')
 process.exit(0)
}

main().catch((err) => {
 console.error('Error applying fix:', err)
 process.exit(1)
})
