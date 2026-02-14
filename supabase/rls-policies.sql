-- ============================================
-- KodaFlow RLS Policies — COMPLETE
-- Run this ONCE in Supabase SQL Editor
-- Idempotent: uses DROP POLICY IF EXISTS
-- ============================================
-- NOTE: Your app uses Drizzle ORM (direct Postgres via DATABASE_URL)
-- which BYPASSES RLS. These policies protect:
--   1. Supabase Dashboard / Studio access
--   2. PostgREST API (anon key) from unauthorized access
--   3. Defense-in-depth if DATABASE_URL leaks
-- ============================================

BEGIN;

-- ============================================
-- 1. Enable RLS on ALL tables
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggables ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Helper function: get current user's org
-- ============================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 3. USERS
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view teammates" ON users;
CREATE POLICY "Users can view teammates"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Prevent privilege escalation via trigger
CREATE OR REPLACE FUNCTION public.handle_users_update_security()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce for non-superuser roles (allow Drizzle/service_role to bypass)
  IF current_setting('role') = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Security: role change not allowed';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Security: organization change not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_users_update_security ON users;
CREATE TRIGGER on_users_update_security
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_users_update_security();

-- ============================================
-- 4. ORGANIZATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can create organization" ON organizations;
CREATE POLICY "Users can create organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can update organization" ON organizations;
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

-- ============================================
-- 5. SUBSCRIPTIONS
-- ============================================
DROP POLICY IF EXISTS "org_subscriptions_select" ON subscriptions;
CREATE POLICY "org_subscriptions_select" ON subscriptions FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "org_subscriptions_insert" ON subscriptions;
CREATE POLICY "org_subscriptions_insert" ON subscriptions FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "org_subscriptions_update" ON subscriptions;
CREATE POLICY "org_subscriptions_update" ON subscriptions FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- ============================================
-- 6. ORG-SCOPED TABLES (standard CRUD)
-- Macro: SELECT/INSERT/UPDATE/DELETE by organization_id
-- ============================================

-- COMPANIES
DROP POLICY IF EXISTS "org_companies_select" ON companies;
DROP POLICY IF EXISTS "org_companies_insert" ON companies;
DROP POLICY IF EXISTS "org_companies_update" ON companies;
DROP POLICY IF EXISTS "org_companies_delete" ON companies;
CREATE POLICY "org_companies_select" ON companies FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_companies_insert" ON companies FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_companies_update" ON companies FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_companies_delete" ON companies FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CONTACTS
DROP POLICY IF EXISTS "org_contacts_select" ON contacts;
DROP POLICY IF EXISTS "org_contacts_insert" ON contacts;
DROP POLICY IF EXISTS "org_contacts_update" ON contacts;
DROP POLICY IF EXISTS "org_contacts_delete" ON contacts;
CREATE POLICY "org_contacts_select" ON contacts FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contacts_insert" ON contacts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_contacts_update" ON contacts FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contacts_delete" ON contacts FOR DELETE
  USING (organization_id = get_user_organization_id());

-- PIPELINE STAGES
DROP POLICY IF EXISTS "org_pipeline_stages_select" ON pipeline_stages;
DROP POLICY IF EXISTS "org_pipeline_stages_insert" ON pipeline_stages;
DROP POLICY IF EXISTS "org_pipeline_stages_update" ON pipeline_stages;
DROP POLICY IF EXISTS "org_pipeline_stages_delete" ON pipeline_stages;
CREATE POLICY "org_pipeline_stages_select" ON pipeline_stages FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_pipeline_stages_insert" ON pipeline_stages FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_pipeline_stages_update" ON pipeline_stages FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_pipeline_stages_delete" ON pipeline_stages FOR DELETE
  USING (organization_id = get_user_organization_id());

-- OPPORTUNITIES
DROP POLICY IF EXISTS "org_opportunities_select" ON opportunities;
DROP POLICY IF EXISTS "org_opportunities_insert" ON opportunities;
DROP POLICY IF EXISTS "org_opportunities_update" ON opportunities;
DROP POLICY IF EXISTS "org_opportunities_delete" ON opportunities;
CREATE POLICY "org_opportunities_select" ON opportunities FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_opportunities_insert" ON opportunities FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_opportunities_update" ON opportunities FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_opportunities_delete" ON opportunities FOR DELETE
  USING (organization_id = get_user_organization_id());

-- TAGS
DROP POLICY IF EXISTS "org_tags_select" ON tags;
DROP POLICY IF EXISTS "org_tags_insert" ON tags;
DROP POLICY IF EXISTS "org_tags_update" ON tags;
DROP POLICY IF EXISTS "org_tags_delete" ON tags;
CREATE POLICY "org_tags_select" ON tags FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tags_insert" ON tags FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_tags_update" ON tags FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tags_delete" ON tags FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ACTIVITIES (CRM)
DROP POLICY IF EXISTS "org_activities_select" ON activities;
DROP POLICY IF EXISTS "org_activities_insert" ON activities;
DROP POLICY IF EXISTS "org_activities_update" ON activities;
DROP POLICY IF EXISTS "org_activities_delete" ON activities;
CREATE POLICY "org_activities_select" ON activities FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_activities_insert" ON activities FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_activities_update" ON activities FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_activities_delete" ON activities FOR DELETE
  USING (organization_id = get_user_organization_id());

-- PRODUCTS
DROP POLICY IF EXISTS "org_products_select" ON products;
DROP POLICY IF EXISTS "org_products_insert" ON products;
DROP POLICY IF EXISTS "org_products_update" ON products;
DROP POLICY IF EXISTS "org_products_delete" ON products;
CREATE POLICY "org_products_select" ON products FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_products_insert" ON products FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_products_update" ON products FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_products_delete" ON products FOR DELETE
  USING (organization_id = get_user_organization_id());

-- QUOTES
DROP POLICY IF EXISTS "org_quotes_select" ON quotes;
DROP POLICY IF EXISTS "org_quotes_insert" ON quotes;
DROP POLICY IF EXISTS "org_quotes_update" ON quotes;
DROP POLICY IF EXISTS "org_quotes_delete" ON quotes;
CREATE POLICY "org_quotes_select" ON quotes FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_quotes_insert" ON quotes FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_quotes_update" ON quotes FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_quotes_delete" ON quotes FOR DELETE
  USING (organization_id = get_user_organization_id());

-- INVOICES
DROP POLICY IF EXISTS "org_invoices_select" ON invoices;
DROP POLICY IF EXISTS "org_invoices_insert" ON invoices;
DROP POLICY IF EXISTS "org_invoices_update" ON invoices;
DROP POLICY IF EXISTS "org_invoices_delete" ON invoices;
CREATE POLICY "org_invoices_select" ON invoices FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_invoices_insert" ON invoices FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_invoices_update" ON invoices FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_invoices_delete" ON invoices FOR DELETE
  USING (organization_id = get_user_organization_id());

-- PAYMENTS
DROP POLICY IF EXISTS "org_payments_select" ON payments;
DROP POLICY IF EXISTS "org_payments_insert" ON payments;
DROP POLICY IF EXISTS "org_payments_update" ON payments;
CREATE POLICY "org_payments_select" ON payments FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_payments_insert" ON payments FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_payments_update" ON payments FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- PROJECTS
DROP POLICY IF EXISTS "org_projects_select" ON projects;
DROP POLICY IF EXISTS "org_projects_insert" ON projects;
DROP POLICY IF EXISTS "org_projects_update" ON projects;
DROP POLICY IF EXISTS "org_projects_delete" ON projects;
CREATE POLICY "org_projects_select" ON projects FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_projects_insert" ON projects FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_projects_update" ON projects FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_projects_delete" ON projects FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CYCLES
DROP POLICY IF EXISTS "org_cycles_select" ON cycles;
DROP POLICY IF EXISTS "org_cycles_insert" ON cycles;
DROP POLICY IF EXISTS "org_cycles_update" ON cycles;
DROP POLICY IF EXISTS "org_cycles_delete" ON cycles;
CREATE POLICY "org_cycles_select" ON cycles FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_cycles_insert" ON cycles FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_cycles_update" ON cycles FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_cycles_delete" ON cycles FOR DELETE
  USING (organization_id = get_user_organization_id());

-- TASKS
DROP POLICY IF EXISTS "org_tasks_select" ON tasks;
DROP POLICY IF EXISTS "org_tasks_insert" ON tasks;
DROP POLICY IF EXISTS "org_tasks_update" ON tasks;
DROP POLICY IF EXISTS "org_tasks_delete" ON tasks;
CREATE POLICY "org_tasks_select" ON tasks FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tasks_insert" ON tasks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_tasks_update" ON tasks FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_tasks_delete" ON tasks FOR DELETE
  USING (organization_id = get_user_organization_id());

-- TIME ENTRIES
DROP POLICY IF EXISTS "org_time_entries_select" ON time_entries;
DROP POLICY IF EXISTS "org_time_entries_insert" ON time_entries;
DROP POLICY IF EXISTS "org_time_entries_update" ON time_entries;
DROP POLICY IF EXISTS "org_time_entries_delete" ON time_entries;
CREATE POLICY "org_time_entries_select" ON time_entries FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_time_entries_insert" ON time_entries FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_time_entries_update" ON time_entries FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_time_entries_delete" ON time_entries FOR DELETE
  USING (organization_id = get_user_organization_id());

-- EXPENSE CATEGORIES
DROP POLICY IF EXISTS "org_expense_categories_select" ON expense_categories;
DROP POLICY IF EXISTS "org_expense_categories_insert" ON expense_categories;
DROP POLICY IF EXISTS "org_expense_categories_update" ON expense_categories;
DROP POLICY IF EXISTS "org_expense_categories_delete" ON expense_categories;
CREATE POLICY "org_expense_categories_select" ON expense_categories FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expense_categories_insert" ON expense_categories FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_expense_categories_update" ON expense_categories FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expense_categories_delete" ON expense_categories FOR DELETE
  USING (organization_id = get_user_organization_id());

-- EXPENSES
DROP POLICY IF EXISTS "org_expenses_select" ON expenses;
DROP POLICY IF EXISTS "org_expenses_insert" ON expenses;
DROP POLICY IF EXISTS "org_expenses_update" ON expenses;
DROP POLICY IF EXISTS "org_expenses_delete" ON expenses;
CREATE POLICY "org_expenses_select" ON expenses FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expenses_insert" ON expenses FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_expenses_update" ON expenses FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_expenses_delete" ON expenses FOR DELETE
  USING (organization_id = get_user_organization_id());

-- BANK ACCOUNTS
DROP POLICY IF EXISTS "org_bank_accounts_select" ON bank_accounts;
DROP POLICY IF EXISTS "org_bank_accounts_insert" ON bank_accounts;
DROP POLICY IF EXISTS "org_bank_accounts_update" ON bank_accounts;
DROP POLICY IF EXISTS "org_bank_accounts_delete" ON bank_accounts;
CREATE POLICY "org_bank_accounts_select" ON bank_accounts FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_bank_accounts_insert" ON bank_accounts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_bank_accounts_update" ON bank_accounts FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_bank_accounts_delete" ON bank_accounts FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CONTRACT TEMPLATES
DROP POLICY IF EXISTS "org_contract_templates_select" ON contract_templates;
DROP POLICY IF EXISTS "org_contract_templates_insert" ON contract_templates;
DROP POLICY IF EXISTS "org_contract_templates_update" ON contract_templates;
DROP POLICY IF EXISTS "org_contract_templates_delete" ON contract_templates;
CREATE POLICY "org_contract_templates_select" ON contract_templates FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contract_templates_insert" ON contract_templates FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_contract_templates_update" ON contract_templates FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contract_templates_delete" ON contract_templates FOR DELETE
  USING (organization_id = get_user_organization_id());

-- CONTRACTS
DROP POLICY IF EXISTS "org_contracts_select" ON contracts;
DROP POLICY IF EXISTS "org_contracts_insert" ON contracts;
DROP POLICY IF EXISTS "org_contracts_update" ON contracts;
DROP POLICY IF EXISTS "org_contracts_delete" ON contracts;
CREATE POLICY "org_contracts_select" ON contracts FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contracts_insert" ON contracts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_contracts_update" ON contracts FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_contracts_delete" ON contracts FOR DELETE
  USING (organization_id = get_user_organization_id());

-- AUTOMATION RULES
DROP POLICY IF EXISTS "org_automation_rules_select" ON automation_rules;
DROP POLICY IF EXISTS "org_automation_rules_insert" ON automation_rules;
DROP POLICY IF EXISTS "org_automation_rules_update" ON automation_rules;
DROP POLICY IF EXISTS "org_automation_rules_delete" ON automation_rules;
CREATE POLICY "org_automation_rules_select" ON automation_rules FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_automation_rules_insert" ON automation_rules FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_automation_rules_update" ON automation_rules FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_automation_rules_delete" ON automation_rules FOR DELETE
  USING (organization_id = get_user_organization_id());

-- AUTOMATION LOGS (read-only)
DROP POLICY IF EXISTS "org_automation_logs_select" ON automation_logs;
CREATE POLICY "org_automation_logs_select" ON automation_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- AI SUGGESTIONS
DROP POLICY IF EXISTS "org_ai_suggestions_select" ON ai_suggestions;
DROP POLICY IF EXISTS "org_ai_suggestions_update" ON ai_suggestions;
CREATE POLICY "org_ai_suggestions_select" ON ai_suggestions FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_ai_suggestions_update" ON ai_suggestions FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- CONVERSATIONS
DROP POLICY IF EXISTS "org_conversations_select" ON conversations;
DROP POLICY IF EXISTS "org_conversations_insert" ON conversations;
DROP POLICY IF EXISTS "org_conversations_update" ON conversations;
CREATE POLICY "org_conversations_select" ON conversations FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_conversations_insert" ON conversations FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_conversations_update" ON conversations FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- NOTIFICATIONS (user-scoped, not org-scoped)
DROP POLICY IF EXISTS "org_notifications_select" ON notifications;
DROP POLICY IF EXISTS "org_notifications_update" ON notifications;
CREATE POLICY "org_notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "org_notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- FILES
DROP POLICY IF EXISTS "org_files_select" ON files;
DROP POLICY IF EXISTS "org_files_insert" ON files;
DROP POLICY IF EXISTS "org_files_delete" ON files;
CREATE POLICY "org_files_select" ON files FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_files_insert" ON files FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_files_delete" ON files FOR DELETE
  USING (organization_id = get_user_organization_id());

-- DOCUMENT SEQUENCES
DROP POLICY IF EXISTS "org_document_sequences_select" ON document_sequences;
DROP POLICY IF EXISTS "org_document_sequences_insert" ON document_sequences;
DROP POLICY IF EXISTS "org_document_sequences_update" ON document_sequences;
CREATE POLICY "org_document_sequences_select" ON document_sequences FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_document_sequences_insert" ON document_sequences FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_document_sequences_update" ON document_sequences FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- EMAIL CONFIGS
DROP POLICY IF EXISTS "org_email_configs_select" ON email_configs;
DROP POLICY IF EXISTS "org_email_configs_insert" ON email_configs;
DROP POLICY IF EXISTS "org_email_configs_update" ON email_configs;
CREATE POLICY "org_email_configs_select" ON email_configs FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_email_configs_insert" ON email_configs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_email_configs_update" ON email_configs FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- WEBHOOKS
DROP POLICY IF EXISTS "org_webhooks_select" ON webhooks;
DROP POLICY IF EXISTS "org_webhooks_insert" ON webhooks;
DROP POLICY IF EXISTS "org_webhooks_update" ON webhooks;
DROP POLICY IF EXISTS "org_webhooks_delete" ON webhooks;
CREATE POLICY "org_webhooks_select" ON webhooks FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_webhooks_insert" ON webhooks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_webhooks_update" ON webhooks FOR UPDATE
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_webhooks_delete" ON webhooks FOR DELETE
  USING (organization_id = get_user_organization_id());

-- API KEYS
DROP POLICY IF EXISTS "org_api_keys_select" ON api_keys;
DROP POLICY IF EXISTS "org_api_keys_insert" ON api_keys;
DROP POLICY IF EXISTS "org_api_keys_delete" ON api_keys;
CREATE POLICY "org_api_keys_select" ON api_keys FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_api_keys_insert" ON api_keys FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_api_keys_delete" ON api_keys FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ACTIVITY LOGS (read-only)
DROP POLICY IF EXISTS "org_activity_logs_select" ON activity_logs;
CREATE POLICY "org_activity_logs_select" ON activity_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- AUDIT LOGS (read-only)
DROP POLICY IF EXISTS "org_audit_logs_select" ON audit_logs;
CREATE POLICY "org_audit_logs_select" ON audit_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- CLIENT ACCESS TOKENS
DROP POLICY IF EXISTS "org_client_access_tokens_select" ON client_access_tokens;
DROP POLICY IF EXISTS "org_client_access_tokens_insert" ON client_access_tokens;
DROP POLICY IF EXISTS "org_client_access_tokens_delete" ON client_access_tokens;
CREATE POLICY "org_client_access_tokens_select" ON client_access_tokens FOR SELECT
  USING (organization_id = get_user_organization_id());
CREATE POLICY "org_client_access_tokens_insert" ON client_access_tokens FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "org_client_access_tokens_delete" ON client_access_tokens FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ============================================
-- 7. CHILD TABLES (no organization_id — join to parent)
-- ============================================

-- QUOTE ITEMS (via quotes.organization_id)
DROP POLICY IF EXISTS "quote_items_select" ON quote_items;
DROP POLICY IF EXISTS "quote_items_insert" ON quote_items;
DROP POLICY IF EXISTS "quote_items_update" ON quote_items;
DROP POLICY IF EXISTS "quote_items_delete" ON quote_items;
CREATE POLICY "quote_items_select" ON quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.organization_id = get_user_organization_id()
  ));
CREATE POLICY "quote_items_insert" ON quote_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.organization_id = get_user_organization_id()
  ));
CREATE POLICY "quote_items_update" ON quote_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.organization_id = get_user_organization_id()
  ));
CREATE POLICY "quote_items_delete" ON quote_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.organization_id = get_user_organization_id()
  ));

-- INVOICE ITEMS (via invoices.organization_id)
DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.organization_id = get_user_organization_id()
  ));
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.organization_id = get_user_organization_id()
  ));
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.organization_id = get_user_organization_id()
  ));
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.organization_id = get_user_organization_id()
  ));

-- MESSAGES (via conversations.organization_id)
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.organization_id = get_user_organization_id()
  ));
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.organization_id = get_user_organization_id()
  ));

-- TAGGABLES (via tags.organization_id)
DROP POLICY IF EXISTS "taggables_select" ON taggables;
DROP POLICY IF EXISTS "taggables_insert" ON taggables;
DROP POLICY IF EXISTS "taggables_delete" ON taggables;
CREATE POLICY "taggables_select" ON taggables FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tags
    WHERE tags.id = taggables.tag_id
    AND tags.organization_id = get_user_organization_id()
  ));
CREATE POLICY "taggables_insert" ON taggables FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tags
    WHERE tags.id = taggables.tag_id
    AND tags.organization_id = get_user_organization_id()
  ));
CREATE POLICY "taggables_delete" ON taggables FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tags
    WHERE tags.id = taggables.tag_id
    AND tags.organization_id = get_user_organization_id()
  ));

-- ============================================
-- 8. PERFORMANCE: Indexes for RLS lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_id_organization_id ON users(id, organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_organization_id ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_organization_id ON pipeline_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_organization_id ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_cycles_organization_id ON cycles(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_organization_id ON expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_organization_id ON bank_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_organization_id ON contract_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_organization_id ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_organization_id ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_organization_id ON automation_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_organization_id ON ai_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_files_organization_id ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_sequences_organization_id ON document_sequences(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_configs_organization_id ON email_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_organization_id ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_organization_id ON client_access_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_taggables_tag_id ON taggables(tag_id);

COMMIT;
