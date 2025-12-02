-- Migration 0011: Add file_type to document_files
-- Adiciona enum e coluna para distinguir entre Documentos, SPED e CSV

-- Criar enum para tipo de arquivo
CREATE TYPE file_type AS ENUM ('document', 'sped', 'csv');

-- Adicionar coluna file_type à tabela document_files
ALTER TABLE document_files 
ADD COLUMN file_type file_type DEFAULT 'document' NOT NULL;

-- Atualizar arquivos SPED existentes
UPDATE document_files 
SET file_type = 'sped'
WHERE id IN (SELECT document_file_id FROM sped_files WHERE document_file_id IS NOT NULL);

-- Criar índice para melhor performance em queries filtradas por tipo
CREATE INDEX idx_document_files_file_type ON document_files(file_type);

-- Criar índice composto para filtros multi-tenant por organização e tipo
CREATE INDEX idx_document_files_org_type ON document_files(organization_id, file_type);

-- Comentários explicativos
COMMENT ON TYPE file_type IS 'Tipo de arquivo: document (jurídico/texto), sped (obrigações acessórias), csv (planilhas)';
COMMENT ON COLUMN document_files.file_type IS 'Tipo de arquivo para separação lógica na listagem';

