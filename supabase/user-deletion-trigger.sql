-- ============================================
-- Trigger: Delete user data on account deletion
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to clean up user data when auth user is deleted
DECLARE
  org_id uuid;
  member_count int;
BEGIN
  -- Get the user's organization
  SELECT organization_id INTO org_id FROM public.users WHERE id = OLD.id;
  
  -- If user exists in our users table
  IF org_id IS NOT NULL THEN
    -- Count remaining members in the organization
    SELECT COUNT(*) INTO member_count 
    FROM public.users 
    WHERE organization_id = org_id AND id != OLD.id;
    
    -- If this was the last member, delete the entire organization and cascade
    IF member_count = 0 THEN
      -- Delete all organization data (order matters for foreign keys)
      DELETE FROM audit_logs WHERE organization_id = org_id;
      DELETE FROM activity_logs WHERE organization_id = org_id;
      DELETE FROM activities WHERE organization_id = org_id;
      DELETE FROM api_keys WHERE organization_id = org_id;
      DELETE FROM webhooks WHERE organization_id = org_id;
      DELETE FROM email_configs WHERE organization_id = org_id;
      DELETE FROM document_sequences WHERE organization_id = org_id;
      DELETE FROM files WHERE organization_id = org_id;
      DELETE FROM notifications WHERE organization_id = org_id;
      DELETE FROM client_access_tokens WHERE organization_id = org_id;
      DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE organization_id = org_id);
      DELETE FROM conversations WHERE organization_id = org_id;
      DELETE FROM ai_suggestions WHERE organization_id = org_id;
      DELETE FROM automation_logs WHERE organization_id = org_id;
      DELETE FROM automation_rules WHERE organization_id = org_id;
      DELETE FROM contracts WHERE organization_id = org_id;
      DELETE FROM contract_templates WHERE organization_id = org_id;
      DELETE FROM bank_accounts WHERE organization_id = org_id;
      DELETE FROM expenses WHERE organization_id = org_id;
      DELETE FROM expense_categories WHERE organization_id = org_id;
      DELETE FROM time_entries WHERE organization_id = org_id;
      DELETE FROM tasks WHERE organization_id = org_id;
      DELETE FROM cycles WHERE organization_id = org_id;
      DELETE FROM projects WHERE organization_id = org_id;
      DELETE FROM payments WHERE organization_id = org_id;
      DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE organization_id = org_id);
      DELETE FROM invoices WHERE organization_id = org_id;
      DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE organization_id = org_id);
      DELETE FROM quotes WHERE organization_id = org_id;
      DELETE FROM products WHERE organization_id = org_id;
      DELETE FROM taggables WHERE tag_id IN (SELECT id FROM tags WHERE organization_id = org_id);
      DELETE FROM tags WHERE organization_id = org_id;
      DELETE FROM opportunities WHERE organization_id = org_id;
      DELETE FROM pipeline_stages WHERE organization_id = org_id;
      DELETE FROM contacts WHERE organization_id = org_id;
      DELETE FROM companies WHERE organization_id = org_id;
      DELETE FROM public.users WHERE organization_id = org_id;
      DELETE FROM organizations WHERE id = org_id;
    ELSE
      -- Cas: Suppression d'un membre (Pas le dernier)
      -- On doit détacher l'utilisateur des objets métier pour ne pas perdre l'historique de l'organisation
      
      -- 1. Détacher (Set NULL) pour les objets métier
      UPDATE public.opportunities SET owner_id = NULL WHERE owner_id = OLD.id;
      UPDATE public.expenses SET created_by_id = NULL WHERE created_by_id = OLD.id;
      UPDATE public.tasks SET assignee_id = NULL WHERE assignee_id = OLD.id;
      UPDATE public.tasks SET created_by_id = NULL WHERE created_by_id = OLD.id;
      UPDATE public.messages SET sender_id = NULL WHERE sender_id = OLD.id;
      UPDATE public.quotes SET created_by_id = NULL WHERE created_by_id = OLD.id;
      UPDATE public.invoices SET created_by_id = NULL WHERE created_by_id = OLD.id;
      UPDATE public.contracts SET created_by_id = NULL WHERE created_by_id = OLD.id;
      UPDATE public.files SET uploaded_by_id = NULL WHERE uploaded_by_id = OLD.id;

      -- 2. Supprimer les données strictement liées à l'utilisateur (Non nullables ou logs persos)
      DELETE FROM public.notifications WHERE user_id = OLD.id;
      DELETE FROM public.time_entries WHERE user_id = OLD.id;
      DELETE FROM public.activities WHERE created_by = OLD.id;
      
      -- 3. Enfin, supprimer le profil public
      DELETE FROM public.users WHERE id = OLD.id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- ============================================
-- Also create trigger for new user signup
-- to sync email if needed
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- We don't auto-create user profile here
  -- User must complete onboarding first
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
