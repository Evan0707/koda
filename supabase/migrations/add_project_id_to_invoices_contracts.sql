-- Add projectId to invoices table
ALTER TABLE invoices ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add projectId to contracts table  
ALTER TABLE contracts ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX idx_invoices_project_id ON invoices(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_contracts_project_id ON contracts(project_id) WHERE project_id IS NOT NULL;
