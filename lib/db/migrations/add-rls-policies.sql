-- =====================================================
-- Row-Level Security (RLS) Policies
-- Multi-tenant isolation para QS Nexus
-- =====================================================

-- =====================================================
-- 1. Habilitar RLS em tabelas SPED
-- =====================================================

ALTER TABLE sped_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Habilitar RLS em tabelas RAG
-- =====================================================

ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_schema_configs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Habilitar RLS em tabelas de Workflow
-- =====================================================

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_steps ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Policies para SPED Files
-- =====================================================

CREATE POLICY org_isolation_sped_files 
ON sped_files 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_chart_of_accounts 
ON chart_of_accounts 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_account_balances 
ON account_balances 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_journal_entries 
ON journal_entries 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_journal_items 
ON journal_items 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_csv_imports 
ON csv_imports 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_csv_data 
ON csv_data 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

-- =====================================================
-- 5. Policies para Document Files
-- =====================================================

CREATE POLICY org_isolation_document_files 
ON document_files 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_templates 
ON templates 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

-- Template chunks herdam isolamento do template
CREATE POLICY org_isolation_template_chunks 
ON template_chunks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM templates 
    WHERE templates.id = template_chunks.template_id 
    AND (
      templates.organization_id = current_setting('app.current_org_id', true)::uuid
      OR current_setting('app.user_role', true) = 'super_admin'
    )
  )
);

-- Configs podem ser globais (null) ou específicas da org
CREATE POLICY org_isolation_classification_configs 
ON classification_configs 
FOR ALL 
USING (
  organization_id IS NULL -- Global config
  OR organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_template_schema_configs 
ON template_schema_configs 
FOR ALL 
USING (
  organization_id IS NULL -- Global schema
  OR organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

-- =====================================================
-- 6. Policies para Workflows
-- =====================================================

-- Workflow templates podem ser compartilhados (is_shared = true)
CREATE POLICY org_isolation_workflow_templates 
ON workflow_templates 
FOR ALL 
USING (
  organization_id IS NULL -- Global workflow
  OR organization_id = current_setting('app.current_org_id', true)::uuid
  OR (is_shared = true AND current_setting('app.user_role', true) IN ('super_admin', 'admin_fiscal'))
  OR current_setting('app.user_role', true) = 'super_admin'
);

CREATE POLICY org_isolation_workflow_executions 
ON workflow_executions 
FOR ALL 
USING (
  organization_id = current_setting('app.current_org_id', true)::uuid
  OR current_setting('app.user_role', true) = 'super_admin'
);

-- Execution steps herdam isolamento da execução
CREATE POLICY org_isolation_workflow_execution_steps 
ON workflow_execution_steps 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM workflow_executions 
    WHERE workflow_executions.id = workflow_execution_steps.execution_id 
    AND (
      workflow_executions.organization_id = current_setting('app.current_org_id', true)::uuid
      OR current_setting('app.user_role', true) = 'super_admin'
    )
  )
);

-- =====================================================
-- 7. Helper Functions para definir contexto
-- =====================================================

CREATE OR REPLACE FUNCTION set_tenant_context(
  p_org_id uuid,
  p_user_role text
) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', p_org_id::text, true);
  PERFORM set_config('app.user_role', p_user_role, true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Índices adicionais para performance
-- =====================================================

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_sped_files_org_period ON sped_files(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_org_code ON chart_of_accounts(organization_id, account_code);
CREATE INDEX IF NOT EXISTS idx_account_balances_org_period ON account_balances(organization_id, period_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_date ON journal_entries(organization_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_document_files_org_status ON document_files(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_templates_org_created ON templates(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_status ON workflow_executions(organization_id, status);

