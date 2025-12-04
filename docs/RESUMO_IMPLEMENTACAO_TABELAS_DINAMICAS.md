# ✅ Resumo: Sistema de Tabelas Dinâmicas Implementado

**Data:** 2025-12-04  
**Status:** Backend 100% Completo | Frontend Pendente

---

## 🎯 Objetivo Alcançado

Implementamos um sistema que permite admins **criarem tabelas SQL customizadas** no PostgreSQL para armazenar dados extraídos de documentos, SPED e CSV.

**Fluxo Completo:**

```
Admin cria schema "Contratos" → Sistema gera SQL → Tabela criada no BD
    ↓
Usuário faz upload de contrato.pdf
    ↓
IA extrai: {contratante: "XYZ", valor: 50000, prazo: "2026-01-01"}
    ↓
Dados salvos em AMBOS:
  ✅ Tabela SQL contratos_prestacao (queries estruturadas)
  ✅ processed_documents + document_chunks (RAG semântico)
```

---

## 📦 Arquivos Criados/Modificados

### Schemas e Migrations
- ✅ `lib/db/schema/document-schemas.ts` - Schema `document_schemas`
- ✅ `drizzle/0002_create_document_schemas.sql` - Migration (já existia)

### Serviços Core
- ✅ `lib/services/table-generator.ts` - **NOVO** - Gera CREATE TABLE seguro
- ✅ `lib/services/schema-manager.ts` - **NOVO** - CRUD de schemas
- ✅ `lib/services/dynamic-data-extractor.ts` - **NOVO** - Inserção de dados

### Integração RAG
- ✅ `lib/services/rag-processor.ts` - **MODIFICADO** - Adicionado suporte a `customSchemaId`
- ✅ `app/api/documents/[id]/process/route.ts` - **MODIFICADO** - Busca schema ativo

### APIs REST
- ✅ `app/api/admin/schemas/route.ts` - GET/POST schemas
- ✅ `app/api/admin/schemas/[id]/route.ts` - GET/PATCH/DELETE schema
- ✅ `app/api/admin/schemas/[id]/create-table/route.ts` - POST criar tabela
- ✅ `app/api/admin/schemas/[id]/records/route.ts` - GET registros

### Documentação
- ✅ `docs/DESIGN_TABELAS_DINAMICAS.md` - Design completo
- ✅ `docs/API_TABELAS_DINAMICAS.md` - Referência de API
- ✅ `docs/RESUMO_IMPLEMENTACAO_TABELAS_DINAMICAS.md` - Este arquivo

---

## 🔑 Funcionalidades Implementadas

### 1. Criação de Schemas Customizados

**Admin pode definir:**
- Nome da tabela (ex: `contratos_prestacao`)
- Tipo base: `document`, `sped` ou `csv`
- Categoria: `juridico`, `contabil`, `geral`
- Campos customizados:
  - Nome (`fieldName`) e label (`displayName`)
  - Tipo: `text`, `numeric`, `date`, `boolean`
  - Obrigatório (`isRequired`)
  - Validações: min/max, minLength/maxLength, pattern

**Exemplo de field:**
```json
{
  "fieldName": "contratante",
  "displayName": "Contratante",
  "fieldType": "text",
  "isRequired": true,
  "description": "Nome completo da parte contratante",
  "validationRules": {
    "minLength": 3,
    "maxLength": 255
  }
}
```

---

### 2. Geração Automática de SQL

**Sistema gera automaticamente:**
```sql
CREATE TABLE IF NOT EXISTS contratos_prestacao (
  -- Colunas do sistema (obrigatórias)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  document_id UUID,
  processed_document_id UUID,
  extracted_at TIMESTAMP DEFAULT NOW(),
  extracted_by UUID,
  source_file_path TEXT,
  confidence_score DECIMAL(3,2),
  metadata JSONB,
  
  -- Campos customizados
  contratante TEXT NOT NULL,
  contratado TEXT NOT NULL,
  valor DECIMAL(15,2),
  prazo DATE,
  
  -- Foreign Keys
  CONSTRAINT fk_contratos_prestacao_org 
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_contratos_prestacao_source 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_contratos_prestacao_processed 
    FOREIGN KEY (processed_document_id) REFERENCES processed_documents(id)
);

-- Índices automáticos
CREATE INDEX idx_contratos_prestacao_org ON contratos_prestacao(organization_id);
CREATE INDEX idx_contratos_prestacao_doc ON contratos_prestacao(document_id);
```

---

### 3. Validações e Segurança

**Proteção contra SQL Injection:**
- ✅ Validação rigorosa de nomes (regex)
- ✅ Apenas tipos pré-definidos
- ✅ Nomes reservados bloqueados
- ✅ Parametrização de queries

**Nomes Reservados (não podem ser usados):**
- Colunas do sistema: `id`, `organization_id`, `metadata`, etc.
- SQL keywords: `select`, `insert`, `update`, `delete`, `table`, etc.
- PostgreSQL reserved: `user`, `role`, `schema`, `database`, etc.

**Regras de Nomenclatura:**
- ✅ Apenas `snake_case` (letras minúsculas, números, underscore)
- ✅ Deve começar com letra
- ✅ Máximo 63 caracteres
- ✅ Não pode começar com `pg_`
- ✅ Único por organização

---

### 4. Dual Storage (Tabela + RAG)

Quando documento é processado:

**1. Classificação IA:**
```typescript
const classification = await classifyDocument(markdown)
// Retorna: { contratante: "XYZ", valor: 50000, prazo: "2026-01-01", ... }
```

**2. Salva em Tabela Customizada:**
```typescript
await insertIntoCustomTable(schemaId, classification, {
  organizationId,
  documentId,
  processedDocumentId: templateId,
  extractedBy: userId,
  sourceFilePath: '/uploads/...',
  confidenceScore: 0.95
})
```

**3. Salva em RAG (paralelamente):**
```typescript
const chunks = chunkMarkdown(markdown)
const embeddings = await generateEmbeddings(chunks)
await storeChunks(templateId, chunksWithEmbeddings)
```

**Resultado:**
- ✅ Dados estruturados em SQL → Queries, relatórios, dashboards
- ✅ Dados em RAG → Busca semântica, IA generativa

---

### 5. APIs REST Completas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/admin/schemas` | Criar schema |
| GET | `/api/admin/schemas` | Listar schemas |
| GET | `/api/admin/schemas/:id` | Buscar schema |
| PATCH | `/api/admin/schemas/:id` | Atualizar schema |
| DELETE | `/api/admin/schemas/:id` | Deletar schema |
| POST | `/api/admin/schemas/:id/create-table` | Criar tabela física |
| GET | `/api/admin/schemas/:id/records` | Consultar registros |

---

### 6. Integração com Pipeline RAG

**Modificado `processFile()` em `rag-processor.ts`:**

```typescript
export async function processFile(
  filePath: string,
  onProgress?: ProgressCallback,
  options?: ProcessFileOptions  // ← NOVO
): Promise<{ success: boolean; templateId?: string }>
```

**Novo parâmetro `ProcessFileOptions`:**
```typescript
{
  documentId?: string          // ID do documento
  organizationId?: string      // ID da organização
  uploadedBy?: string          // ID do usuário
  customSchemaId?: string      // ← ID do schema customizado
}
```

**Fluxo:**
1. Se `customSchemaId` fornecido → insere em tabela customizada
2. Se erro na tabela → **continua RAG** (não falha)
3. RAG sempre executa (independente de schema)

---

## 🧪 Como Testar (Via API)

### 1. Criar Schema

```bash
curl -X POST http://localhost:3000/api/admin/schemas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contratos Test",
    "tableName": "contratos_test",
    "baseType": "document",
    "fields": [
      {
        "fieldName": "contratante",
        "displayName": "Contratante",
        "fieldType": "text",
        "isRequired": true
      },
      {
        "fieldName": "valor",
        "displayName": "Valor",
        "fieldType": "numeric",
        "isRequired": false
      }
    ]
  }'
```

### 2. Criar Tabela Física

```bash
curl -X POST http://localhost:3000/api/admin/schemas/<schema-id>/create-table
```

### 3. Upload com Schema

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "files[]=@test.pdf" \
  -F "organizationId=<org-id>"
```

### 4. Processar com Schema

```bash
curl -X POST http://localhost:3000/api/documents/<doc-id>/process \
  -H "Content-Type: application/json" \
  -d '{"customSchemaId": "<schema-id>"}'
```

### 5. Verificar Dados Extraídos

```bash
curl http://localhost:3000/api/admin/schemas/<schema-id>/records
```

**Ou via SQL direto:**
```sql
SELECT * FROM contratos_test 
WHERE organization_id = '<org-id>' 
ORDER BY extracted_at DESC;
```

---

## 📋 Pendências (Frontend)

### UIs Necessárias

1. **`/admin/schemas`** - Gerenciar Schemas
   - Lista de schemas
   - Botão criar novo
   - Ações: editar, ativar/desativar, deletar, criar tabela
   - Estatísticas: documentos processados, última utilização

2. **`/admin/schemas/new`** - Criar Schema
   - Form multi-step:
     - Passo 1: Nome, descrição, tipo base, categoria
     - Passo 2: Adicionar campos (field builder)
     - Passo 3: Preview do SQL gerado
     - Passo 4: Confirmar criação
   - Botão "Criar Tabela no Banco"

3. **`/upload`** - Modificar Upload
   - Adicionar dropdown de schemas disponíveis
   - Auto-seleção se houver schema padrão
   - Preview de campos que serão extraídos

4. **`/admin/schemas/:id/records`** - Visualizar Dados
   - Tabela paginada com dados extraídos
   - Filtros por campos customizados
   - Exportar CSV/Excel
   - Link para documento original

### Componentes

1. **`<SchemaList>`**
   - Table com lista de schemas
   - Badge de status (ativo, tabela criada, etc)
   - Menu de ações

2. **`<SchemaForm>`**
   - Formulário completo de criação/edição
   - Validação de nomes

3. **`<FieldBuilder>`**
   - Construtor drag-and-drop de campos
   - Preview de cada field
   - Validação de tipos

4. **`<SchemaSelector>`**
   - Dropdown para seleção de schema
   - Mostra campos do schema selecionado
   - Indicador de schema padrão

---

## 🚀 Próximos Passos Recomendados

### Curto Prazo
1. ✅ ~~Implementar backend (CONCLUÍDO)~~
2. ⏳ Implementar UI admin de schemas
3. ⏳ Implementar seletor de schema no upload
4. ⏳ Testar E2E completo (criar schema → upload → processar → consultar)

### Médio Prazo
5. Migração de schemas (ALTER TABLE ADD COLUMN)
6. Versionamento de schemas
7. Importação/exportação de definições (JSON/YAML)

### Longo Prazo
8. Relacionamentos customizados (FKs entre tabelas)
9. Webhooks pós-extração
10. Validação customizada (scripts JavaScript/Python)
11. Dashboards automáticos baseados em schemas

---

## ✅ Checklist de Implementação

### Backend
- ✅ Schema `document_schemas` definido
- ✅ Gerador de SQL implementado
- ✅ Validações de nomes e tipos
- ✅ CRUD de schemas
- ✅ Criação de tabelas físicas
- ✅ Inserção de dados customizados
- ✅ Integração com pipeline RAG
- ✅ APIs REST completas
- ✅ Consulta de registros
- ✅ Documentação técnica

### Frontend
- ⏳ Tela de gerenciamento de schemas
- ⏳ Formulário de criação de schema
- ⏳ Field builder visual
- ⏳ Seletor de schema no upload
- ⏳ Visualização de registros

### Testes
- ⏳ Teste E2E criar schema
- ⏳ Teste upload com schema
- ⏳ Teste extração e inserção
- ⏳ Teste validações de segurança
- ⏳ Teste multi-tenant

---

## 📝 Notas Importantes

1. **Segurança:** Todo SQL gerado é validado e parametrizado. Nomes de tabelas e campos passam por regex rigoroso.

2. **Multi-Tenancy:** Todas as tabelas customizadas têm `organization_id` obrigatório com FK para `organizations`.

3. **Resiliência:** Se erro ao inserir em tabela customizada, o processamento RAG **continua** (não falha).

4. **Backup:** Todos os dados extraídos são salvos em JSONB na coluna `metadata` (backup completo).

5. **Performance:** Índices automáticos em `organization_id`, `document_id`, `extracted_at` garantem queries rápidas.

6. **Flexibilidade:** Sistema suporta futuramente: SPED e CSV (apenas mudando `baseType`).

---

**Implementação Backend Concluída com Sucesso! ✅**  
**Próximo Passo:** Implementar frontend (UIs e componentes).

