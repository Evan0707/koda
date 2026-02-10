-- Custom migration: Fix Users RLS Privilege Escalation
-- Description: Adds a trigger to prevent users from changing sensitive columns (role, organization_id)

-- Function to validate user updates
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

-- Trigger to run before update
DROP TRIGGER IF EXISTS on_users_update_security ON users;
CREATE TRIGGER on_users_update_security
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_users_update_security();
