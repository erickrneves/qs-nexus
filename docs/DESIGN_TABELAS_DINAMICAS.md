# Design: Sistema de Tabelas Dinâmicas

## ✅ STATUS: IMPLEMENTADO

Última atualização: 2025-12-04

---

## Conceito

Admin pode criar **tabelas SQL reais** no PostgreSQL para armazenar dados extraídos de documentos.

**Exemplo**: 
- Admin cria tabela "contratos_prestacao" com campos `[contratante, valor, prazo]`
- Usuário faz upload de `contrato.pdf`
- IA extrai dados e salva em **AMBOS**:
  - ✅ Tabela SQL `contratos_prestacao` (dados estruturados, queries SQL)
  - ✅ `processed_documents` + `document_chunks` (RAG, busca semântica)

---

## Implementação Concluída

### ✅ Backend

**Schemas e Migrations:**
- ✅ `lib/db/schema/document-schemas.ts` - Definição da tabela `document_schemas`
- ✅ `drizzle/0002_create_document_schemas.sql` - Migration SQL

**Serviços Core:**
- ✅ `lib/services/table-generator.ts` - Gera SQL CREATE TABLE seguro
- ✅ `lib/services/schema-manager.ts` - CRUD de schemas customizados
- ✅ `lib/services/dynamic-data-extractor.ts` - Inserção de dados nas tabelas customizadas

**Integração com RAG:**
- ✅ `lib/services/rag-processor.ts` - Modificado para suportar `ProcessFileOptions` e chamar `insertIntoCustomTable`
- ✅ `app/api/documents/[id]/process/route.ts` - Busca schema ativo e passa para `processFile`

**APIs REST:**
- ✅ `POST /api/admin/schemas` - Criar schema
- ✅ `GET /api/admin/schemas` - Listar schemas
- ✅ `GET /api/admin/schemas/:id` - Buscar schema
- ✅ `PATCH /api/admin/schemas/:id` - Atualizar schema
- ✅ `DELETE /api/admin/schemas/:id` - Deletar schema
- ✅ `POST /api/admin/schemas/:id/create-table` - Criar tabela física no BD
- ✅ `GET /api/admin/schemas/:id/records` - Consultar registros da tabela

### 🔶 Frontend (Pendente)

**UIs Necessárias:**
- ⏳ `/admin/schemas` - Listar e gerenciar schemas
- ⏳ `/admin/schemas/new` - Criar novo schema
- ⏳ `/upload` - Seletor de schema no formulário de upload

**Componentes:**
- ⏳ `components/schemas/schema-form.tsx` - Formulário de criação/edição
- ⏳ `components/schemas/field-builder.tsx` - Constructor drag-and-drop de campos
- ⏳ `components/upload/schema-selector.tsx` - Dropdown de seleção

---

## Arquitetura

### 1. Registro de Schemas (Nova Tabela)

```sql
CREATE TABLE custom_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Identificação
  name VARCHAR(255) NOT NULL,  -- "Contratos de Prestação"
  table_name VARCHAR(63) NOT NULL,  -- "contratos_prestacao" (nome SQL)
  description TEXT,
  
  -- Vínculo ao tipo base
  base_type base_type_enum NOT NULL,  -- 'document' | 'sped' | 'csv'
  category document_category,  -- juridico | contabil | geral (opcional)
  
  -- Definição de campos
  fields JSONB NOT NULL,  -- Array de field definitions
  /*
    [{
      name: 'contratante',
      type: 'text',
      required: true,
      description: 'Nome do contratante'
    }, ...]
  */
  
  -- SQL gerado
  create_table_sql TEXT,  -- SQL do CREATE TABLE gerado
  table_created BOOLEAN DEFAULT false,  -- Tabela já foi criada?
  
  -- Configuração de IA
  classification_profile_id UUID,  -- Qual perfil usar para extrair dados
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, table_name)
);

CREATE TYPE base_type_enum AS ENUM ('document', 'sped', 'csv');
```

---

### 2. Field Types Permitidos

```typescript
type FieldType = 
  | 'text'      // VARCHAR(255) or TEXT
  | 'number'    // DECIMAL(15,2)
  | 'date'      // DATE
  | 'boolean'   // BOOLEAN
  | 'longtext'  // TEXT

interface FieldDefinition {
  name: string          // Nome do campo (snake_case)
  label: string         // Label amigável
  type: FieldType
  required: boolean
  description?: string
  
  // Validações opcionais
  minLength?: number    // Para text
  maxLength?: number    // Para text
  min?: number          // Para number
  max?: number          // Para number
  defaultValue?: any
}
```

---

### 3. Geração Automática de SQL

**Serviço**: `lib/services/dynamic-table-generator.ts`

```typescript
function generateCreateTableSQL(
  schema: CustomSchema,
  organizationId: string
): string {
  const tableName = schema.tableName
  const fields = schema.fields as FieldDefinition[]
  
  const columns = fields.map(field => {
    let colDef = `${field.name} `
    
    switch (field.type) {
      case 'text':
        colDef += field.maxLength && field.maxLength <= 255 
          ? `VARCHAR(${field.maxLength})` 
          : 'TEXT'
        break
      case 'longtext':
        colDef += 'TEXT'
        break
      case 'number':
        colDef += 'DECIMAL(15,2)'
        break
      case 'date':
        colDef += 'DATE'
        break
      case 'boolean':
        colDef += 'BOOLEAN'
        break
    }
    
    if (field.required) colDef += ' NOT NULL'
    if (field.defaultValue) colDef += ` DEFAULT '${field.defaultValue}'`
    
    return colDef
  })
  
  // Colunas obrigatórias do sistema
  const systemColumns = [
    'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'organization_id UUID NOT NULL',
    'document_id UUID',  // FK para documents/sped_files/csv_imports
    'processed_document_id UUID',  // FK para processed_documents
    'extracted_at TIMESTAMP DEFAULT NOW()',
    'extracted_by UUID',
    'source_file_path TEXT',
    'confidence_score DECIMAL(3,2)',  // 0.00 a 1.00
    'metadata JSONB'  // Metadados extras
  ]
  
  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${systemColumns.join(',\n      ')},
      ${columns.join(',\n      ')},
      
      CONSTRAINT fk_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
      CONSTRAINT fk_processed_document
        FOREIGN KEY (processed_document_id)
        REFERENCES processed_documents(id) ON DELETE SET NULL
    );
    
    CREATE INDEX idx_${tableName}_org ON ${tableName}(organization_id);
    CREATE INDEX idx_${tableName}_doc ON ${tableName}(document_id);
    CREATE INDEX idx_${tableName}_processed ON ${tableName}(processed_document_id);
  `
}
```

---

### 4. Inserção de Dados

**Após classificação com IA**, sistema insere dados em AMBAS as tabelas:

```typescript
// 1. Salva em processed_documents (RAG)
const processedDoc = await db
  .insert(processedDocuments)
  .values({
    documentFileId,
    title: extracted.title,
    markdown,
    metadata: extracted  // TODOS os dados extraídos
  })
  .returning()

// 2. Salva na tabela customizada
const schema = await getCustomSchema(schemaId)
const tableName = schema.tableName

// Monta valores dinamicamente
const values = {
  organization_id: orgId,
  document_id: documentId,
  processed_document_id: processedDoc.id,
  extracted_by: userId,
  confidence_score: extracted.confidence || 0.95,
  metadata: extracted,  // Backup em JSON
  // Campos customizados
  ...extractFieldValues(extracted, schema.fields)
}

// Executa INSERT
await db.execute(sql.raw(`
  INSERT INTO ${tableName} 
    (${Object.keys(values).join(', ')})
  VALUES
    (${Object.keys(values).map((_, i) => `$${i+1}`).join(', ')})
`, Object.values(values)))
```

---

### 5. Fluxo Completo

```
Admin cria schema "Contratos"
  ↓
Sistema gera CREATE TABLE SQL
  ↓
Admin ativa tabela
  ↓
Sistema executa CREATE TABLE no BD
  ↓
──────────────────────────────
Usuário faz upload de contrato.pdf
  ↓
Sistema detecta tipo: "Contratos"
  ↓
Usuário confirma ou escolhe no dropdown
  ↓
Sistema processa:
  ├─ Conversão: PDF → Markdown
  ├─ Classificação: IA extrai {contratante, valor, prazo}
  ├─ INSERT em tabela "contratos_prestacao" ✅
  ├─ INSERT em "processed_documents" ✅
  ├─ Chunking: Markdown → chunks
  ├─ Embeddings: chunks → vetores
  └─ INSERT em "document_chunks" ✅
  ↓
Resultado:
  ✅ Dados estruturados em SQL (queries, relatórios)
  ✅ Dados em RAG (busca semântica)
```

---

### 6. Vincular aos 3 Tipos Base

Cada schema customizado vinculado a:

**Tipo 1: Documentos**
- Processa PDFs, DOCXs, TXTs
- Extrai via IA
- Exemplo: "Contratos", "Petições", "Atas"

**Tipo 2: SPED**
- Processa arquivos SPED
- Extrai dados contábeis já parseados
- Exemplo: "Balanços Patrimoniais", "DREs", "Fluxos de Caixa"
- Campos podem vir de: plano de contas, saldos, lançamentos

**Tipo 3: CSV**
- Processa CSVs
- Mapeia colunas do CSV para campos da tabela
- Exemplo: "Vendas", "Estoque", "Folha de Pagamento"
- Admin mapeia: CSV col "Valor Total" → campo "valor"

---

### 7. Campos Obrigatórios (Sistema)

Toda tabela customizada TEM que ter:

```sql
-- Metadados do sistema (sempre incluídos)
id UUID PRIMARY KEY
organization_id UUID NOT NULL
document_id UUID  -- FK para documents/sped_files/csv_imports
processed_document_id UUID  -- FK para processed_documents
extracted_at TIMESTAMP
extracted_by UUID
source_file_path TEXT
confidence_score DECIMAL(3,2)  -- Confiança da extração (0-1)
metadata JSONB  -- Backup completo dos dados extraídos

-- Campos customizados do admin
contratante TEXT  ← exemplo
valor DECIMAL(15,2)  ← exemplo
prazo DATE  ← exemplo
```

**Admin NUNCA pode**:
- Deletar campos do sistema
- Criar campos com nomes reservados (id, organization_id, etc)
- Usar tipos SQL não permitidos

---

## Estrutura de Arquivos

```
lib/db/schema/dynamic-schemas.ts    # Schema registry
lib/services/schema-manager.ts      # CRUD de schemas
lib/services/table-generator.ts     # Gera CREATE TABLE SQL
lib/services/data-extractor.ts      # Extrai dados + insere em tabelas
app/api/admin/schemas/route.ts      # API CRUD schemas
app/api/admin/schemas/[id]/create-table/route.ts  # Cria tabela física
app/(dashboard)/admin/schemas/page.tsx            # UI gerenciar schemas
app/(dashboard)/admin/schemas/new/page.tsx        # UI criar schema
components/schemas/schema-form.tsx                # Form de schema
components/schemas/field-builder.tsx              # Construtor de campos
components/upload/schema-selector.tsx             # Seletor no upload
```

---

## Implementação

### Tarefa 1: Schema Registry (BD)
- Criar tabela `custom_schemas`
- Criar enum `base_type_enum`
- Migration SQL

### Tarefa 2: Table Generator
- `lib/services/table-generator.ts`
- Gera SQL válido e seguro
- Valida nomes (SQL injection prevention)
- Adiciona colunas do sistema

### Tarefa 3: Schema Manager
- `lib/services/schema-manager.ts`
- CRUD de schemas
- Executar CREATE TABLE
- Validar schemas

### Tarefa 4: Data Extractor
- `lib/services/data-extractor.ts`
- Extrai dados da classificação IA
- Insere em tabela customizada
- Insere em processed_documents (RAG)

### Tarefa 5: Admin UI - Gerenciar Schemas
- Lista de schemas
- Botão criar novo
- Editar/ativar/desativar
- Ver tabela criada (preview SQL)

### Tarefa 6: Admin UI - Criar Schema
- Form multi-step:
  1. Nome + tipo base + categoria
  2. Adicionar campos (type, required, etc)
  3. Preview SQL gerado
  4. Confirmar criação
- Botão "Criar Tabela no Banco"

### Tarefa 7: Upload UI - Seletor de Schema
- Auto-detecção baseada em conteúdo
- Dropdown com schemas disponíveis
- Preview de campos que serão extraídos

### Tarefa 8: Integração com Pipeline
- Modificar `lib/services/rag-processor.ts`
- Após classificação, inserir em tabela customizada
- Manter inserção em RAG

### Tarefa 9: Testes
- Criar schema de teste
- Upload de documento
- Verificar dados em ambas tabelas
- Query SQL + RAG query

---

## Começando implementação...

