-- ============================================
-- KodaFlow RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggables ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: Get user's organization ID
-- ============================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- USERS table policies
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- SECURITY FIX: Trigger to prevent privilege escalation (role/org change)
CREATE OR REPLACE FUNCTION public.handle_users_update_security()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Security Violation: You cannot change your own role.';
  END IF;
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

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can view teammates in same organization
CREATE POLICY "Users can view teammates"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

-- ============================================
-- ORGANIZATIONS table policies
-- ============================================
-- Users can view their organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

-- Only owners can update organization
CREATE POLICY "Owners can update organization"
  ON organizations FOR UPDATE
  USING (
    id = get_user_organization_id() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'owner'
    )
  );

-- Users can create organization (on onboarding)
CREATE POLICY "Users can create organization"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Generic organization-based policies
-- For tables with organization_id column
-- ============================================

-- COMPANIES
CREATE POLICY "org_companies_select" ON companies FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_companies_insert" ON companies FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_companies_update" ON companies FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_companies_delete" ON companies FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CONTACTS
CREATE POLICY "org_contacts_select" ON contacts FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contacts_insert" ON contacts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_contacts_update" ON contacts FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contacts_delete" ON contacts FOR DELETE
  USING (organization_id = get_user_organization_id());

-- PIPELINE STAGES
CREATE POLICY "org_pipeline_stages_select" ON pipeline_stages FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_pipeline_stages_insert" ON pipeline_stages FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_pipeline_stages_update" ON pipeline_stages FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_pipeline_stages_delete" ON pipeline_stages FOR DELETE
  USING (organization_id = get_user_organization_id());

-- OPPORTUNITIES
CREATE POLICY "org_opportunities_select" ON opportunities FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_opportunities_insert" ON opportunities FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_opportunities_update" ON opportunities FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_opportunities_delete" ON opportunities FOR DELETE
  USING (organization_id = get_user_organization_id());

-- TAGS
CREATE POLICY "org_tags_select" ON tags FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tags_insert" ON tags FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_tags_update" ON tags FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tags_delete" ON tags FOR DELETE
  USING (organization_id = get_user_organization_id());

-- PRODUCTS
CREATE POLICY "org_products_select" ON products FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_products_insert" ON products FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_products_update" ON products FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_products_delete" ON products FOR DELETE
  USING (organization_id = get_user_organization_id());

-- QUOTES
CREATE POLICY "org_quotes_select" ON quotes FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_quotes_insert" ON quotes FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_quotes_update" ON quotes FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_quotes_delete" ON quotes FOR DELETE
  USING (organization_id = get_user_organization_id());

-- INVOICES
CREATE POLICY "org_invoices_select" ON invoices FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_invoices_insert" ON invoices FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_invoices_update" ON invoices FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_invoices_delete" ON invoices FOR DELETE
  USING (organization_id = get_user_organization_id());

-- PAYMENTS
CREATE POLICY "org_payments_select" ON payments FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_payments_insert" ON payments FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_payments_update" ON payments FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- PROJECTS
CREATE POLICY "org_projects_select" ON projects FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_projects_insert" ON projects FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_projects_update" ON projects FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_projects_delete" ON projects FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CYCLES
CREATE POLICY "org_cycles_select" ON cycles FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_cycles_insert" ON cycles FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_cycles_update" ON cycles FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_cycles_delete" ON cycles FOR DELETE
  USING (organization_id = get_user_organization_id());

-- TASKS
CREATE POLICY "org_tasks_select" ON tasks FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tasks_insert" ON tasks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_tasks_update" ON tasks FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tasks_delete" ON tasks FOR DELETE
  USING (organization_id = get_user_organization_id());

-- TIME ENTRIES
CREATE POLICY "org_time_entries_select" ON time_entries FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_time_entries_update" ON time_entries FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_time_entries_delete" ON time_entries FOR DELETE
  USING (organization_id = get_user_organization_id());

-- EXPENSE CATEGORIES
CREATE POLICY "org_expense_categories_select" ON expense_categories FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expense_categories_insert" ON expense_categories FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_expense_categories_update" ON expense_categories FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expense_categories_delete" ON expense_categories FOR DELETE
  USING (organization_id = get_user_organization_id());

-- EXPENSES
CREATE POLICY "org_expenses_select" ON expenses FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expenses_insert" ON expenses FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_expenses_update" ON expenses FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expenses_delete" ON expenses FOR DELETE
  USING (organization_id = get_user_organization_id());

-- BANK ACCOUNTS
CREATE POLICY "org_bank_accounts_select" ON bank_accounts FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_bank_accounts_insert" ON bank_accounts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_bank_accounts_update" ON bank_accounts FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_bank_accounts_delete" ON bank_accounts FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CONTRACT TEMPLATES
CREATE POLICY "org_contract_templates_select" ON contract_templates FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contract_templates_insert" ON contract_templates FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_contract_templates_update" ON contract_templates FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contract_templates_delete" ON contract_templates FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CONTRACTS
CREATE POLICY "org_contracts_select" ON contracts FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contracts_insert" ON contracts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_contracts_update" ON contracts FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contracts_delete" ON contracts FOR DELETE
  USING (organization_id = get_user_organization_id());

-- AUTOMATION RULES
CREATE POLICY "org_automation_rules_select" ON automation_rules FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_automation_rules_insert" ON automation_rules FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_automation_rules_update" ON automation_rules FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_automation_rules_delete" ON automation_rules FOR DELETE
  USING (organization_id = get_user_organization_id());

-- AUTOMATION LOGS
CREATE POLICY "org_automation_logs_select" ON automation_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- AI SUGGESTIONS
CREATE POLICY "org_ai_suggestions_select" ON ai_suggestions FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_ai_suggestions_update" ON ai_suggestions FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- CONVERSATIONS
CREATE POLICY "org_conversations_select" ON conversations FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_conversations_insert" ON conversations FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_conversations_update" ON conversations FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- NOTIFICATIONS
CREATE POLICY "org_notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "org_notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- FILES
CREATE POLICY "org_files_select" ON files FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_files_insert" ON files FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_files_delete" ON files FOR DELETE
  USING (organization_id = get_user_organization_id());

-- DOCUMENT SEQUENCES
CREATE POLICY "org_document_sequences_select" ON document_sequences FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_document_sequences_insert" ON document_sequences FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_document_sequences_update" ON document_sequences FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- EMAIL CONFIGS
CREATE POLICY "org_email_configs_select" ON email_configs FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_email_configs_insert" ON email_configs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_email_configs_update" ON email_configs FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- WEBHOOKS
CREATE POLICY "org_webhooks_select" ON webhooks FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_webhooks_insert" ON webhooks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_webhooks_update" ON webhooks FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_webhooks_delete" ON webhooks FOR DELETE
  USING (organization_id = get_user_organization_id());

-- API KEYS
CREATE POLICY "org_api_keys_select" ON api_keys FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_api_keys_insert" ON api_keys FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_api_keys_delete" ON api_keys FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ACTIVITY LOGS
CREATE POLICY "org_activity_logs_select" ON activity_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- CLIENT ACCESS TOKENS
CREATE POLICY "org_client_access_tokens_select" ON client_access_tokens FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_client_access_tokens_insert" ON client_access_tokens FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_client_access_tokens_delete" ON client_access_tokens FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ============================================
-- QUOTE ITEMS (via quote's organization)
-- ============================================
CREATE POLICY "quote_items_select" ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "quote_items_insert" ON quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "quote_items_update" ON quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "quote_items_delete" ON quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.organization_id = get_user_organization_id()
    )
  );

-- INVOICE ITEMS (via invoice's organization)
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.organization_id = get_user_organization_id()
    )
  );

-- MESSAGES (via conversation's organization)
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.organization_id = get_user_organization_id()
    )
  );

-- TAGGABLES (via tag's organization)
CREATE POLICY "taggables_select" ON taggables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tags 
      WHERE tags.id = taggables.tag_id 
      AND tags.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "taggables_insert" ON taggables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tags 
      WHERE tags.id = taggables.tag_id 
      AND tags.organization_id = get_user_organization_id()
    )
  );
CREATE POLICY "taggables_delete" ON taggables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tags 
      WHERE tags.id = taggables.tag_id 
      AND tags.organization_id = get_user_organization_id()
    )
  );
