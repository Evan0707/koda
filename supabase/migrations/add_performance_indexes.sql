-- ============================================
-- PERFORMANCE INDEXES for hot-path queries
-- ============================================

-- Contacts: list by org, search by name/email
CREATE INDEX IF NOT EXISTS idx_contacts_org_deleted ON contacts (organization_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_org_company ON contacts (organization_id, company_id) WHERE deleted_at IS NULL;

-- Companies: list by org
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies (organization_id);

-- Invoices: list by org + status, lookup by number
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices (organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_org_deleted ON invoices (organization_id, deleted_at);

-- Quotes: list by org + status
CREATE INDEX IF NOT EXISTS idx_quotes_org_status ON quotes (organization_id, status) WHERE deleted_at IS NULL;

-- Opportunities: pipeline view (org + stage)
CREATE INDEX IF NOT EXISTS idx_opportunities_org_stage ON opportunities (organization_id, stage_id) WHERE deleted_at IS NULL;

-- Tasks: project board view (project + status)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks (project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_org_deleted ON tasks (organization_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id) WHERE deleted_at IS NULL;

-- Projects: list by org
CREATE INDEX IF NOT EXISTS idx_projects_org_deleted ON projects (organization_id, deleted_at);

-- Time entries: user timesheet, running timer
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries (user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_running ON time_entries (user_id, ended_at) WHERE ended_at IS NULL;

-- Notifications: user notifications list
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);

-- Taggables: lookup by taggable
CREATE INDEX IF NOT EXISTS idx_taggables_taggable ON taggables (taggable_id, taggable_type);
CREATE INDEX IF NOT EXISTS idx_taggables_tag ON taggables (tag_id);

-- Pipeline stages: org listing
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_org ON pipeline_stages (organization_id, position);

-- Products: org listing
CREATE INDEX IF NOT EXISTS idx_products_org ON products (organization_id) WHERE is_active = true;

-- Invoice/quote items: parent lookup
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items (quote_id);
