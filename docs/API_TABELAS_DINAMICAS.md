# API Reference: Sistema de Tabelas Dinâmicas

## Endpoints Implementados

### 1. Criar Schema

```http
POST /api/admin/schemas
```

**Request Body:**
```json
{
  "name": "Contratos de Prestação de Serviços",
  "tableName": "contratos_prestacao",
  "description": "Contratos jurídicos de prestação de serviços",
  "baseType": "document",
  "category": "juridico",
  "fields": [
    {
      "fieldName": "contratante",
      "displayName": "Contratante",
      "fieldType": "text",
      "isRequired": true,
      "description": "Nome completo da parte contratante"
    },
    {
      "fieldName": "contratado",
      "displayName": "Contratado",
      "fieldType": "text",
      "isRequired": true
    },
    {
      "fieldName": "valor",
      "displayName": "Valor do Contrato",
      "fieldType": "numeric",
      "isRequired": false,
      "validationRules": {
        "min": 0
      }
    },
    {
      "fieldName": "prazo",
      "displayName": "Prazo",
      "fieldType": "date",
      "isRequired": false
    }
  ],
  "enableRag": true,
  "classificationProfileId": "uuid-do-perfil-opcional"
}
```

**Response 201:**
```json
{
  "schema": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Contratos de Prestação de Serviços",
    "tableName": "contratos_prestacao",
    "baseType": "document",
    "fields": [...],
    "sqlTableCreated": false,
    "sqlCreateStatement": "CREATE TABLE IF NOT EXISTS contratos_prestacao (...)",
    "createdAt": "2025-12-04T10:30:00Z"
  }
}
```

---

### 2. Listar Schemas

```http
GET /api/admin/schemas?baseType=document
```

**Query Params:**
- `baseType` (opcional): `document`, `sped` ou `csv`

**Response 200:**
```json
{
  "schemas": [
    {
      "id": "...",
      "name": "Contratos de Prestação de Serviços",
      "tableName": "contratos_prestacao",
      "baseType": "document",
      "sqlTableCreated": true,
      "isActive": true,
      "documentsProcessed": 42,
      "createdAt": "2025-12-04T10:30:00Z"
    },
    ...
  ]
}
```

---

### 3. Buscar Schema por ID

```http
GET /api/admin/schemas/:id
```

**Response 200:**
```json
{
  "schema": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Contratos de Prestação de Serviços",
    "tableName": "contratos_prestacao",
    "fields": [...],
    "sqlTableCreated": true,
    "sqlCreateStatement": "CREATE TABLE ...",
    "sqlTableCreatedAt": "2025-12-04T10:35:00Z"
  }
}
```

---

### 4. Criar Tabela Física

```http
POST /api/admin/schemas/:id/create-table
```

**Ação:** Executa o SQL `CREATE TABLE` no PostgreSQL.

**Response 200:**
```json
{
  "success": true
}
```

**Response 500 (se erro):**
```json
{
  "error": "Erro ao criar tabela no banco: relation already exists"
}
```

---

### 5. Atualizar Schema

```http
PATCH /api/admin/schemas/:id
```

**Request Body (campos opcionais):**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "fields": [...],  // ⚠️ Só se tabela NÃO foi criada
  "isActive": false
}
```

**Restrição:** Não é possível alterar `fields` se `sqlTableCreated === true`.

**Response 200:**
```json
{
  "schema": {...}
}
```

---

### 6. Deletar Schema

```http
DELETE /api/admin/schemas/:id?dropTable=true
```

**Query Params:**
- `dropTable` (opcional): Se `true`, executa `DROP TABLE CASCADE` antes de deletar o schema

**Response 200:**
```json
{
  "success": true,
  "tableDropped": true
}
```

---

### 7. Consultar Registros da Tabela

```http
GET /api/admin/schemas/:id/records?limit=100&offset=0&orderBy=created_at&orderDirection=DESC
```

**Query Params:**
- `limit` (padrão: 100): Máximo de registros
- `offset` (padrão: 0): Offset de paginação
- `orderBy` (padrão: `extracted_at`): Campo para ordenar
- `orderDirection` (`ASC` | `DESC`): Direção da ordenação
- **Filtros dinâmicos**: Qualquer outro param é usado como filtro (ex: `?contratante=XYZ`)

**Response 200:**
```json
{
  "schema": {
    "id": "...",
    "name": "Contratos de Prestação de Serviços",
    "tableName": "contratos_prestacao"
  },
  "records": [
    {
      "id": "record-uuid",
      "organization_id": "org-uuid",
      "document_id": "doc-uuid",
      "processed_document_id": "template-uuid",
      "contratante": "Empresa XYZ Ltda",
      "contratado": "João da Silva",
      "valor": 50000.00,
      "prazo": "2026-01-01",
      "extracted_at": "2025-12-04T15:00:00Z",
      "confidence_score": 0.95,
      "metadata": {...}
    },
    ...
  ],
  "total": 42
}
```

---

## Fluxo de Upload com Schema Customizado

### 1. Upload de Documento

```http
POST /api/documents/upload
```

**FormData:**
- `files[]`: Arquivo(s)
- `organizationId`: UUID da organização
- `customSchemaId` (opcional): UUID do schema desejado

**Response 200:**
```json
{
  "uploadedFiles": [
    {
      "id": "doc-uuid",
      "fileName": "contrato.pdf",
      "status": "pending"
    }
  ]
}
```

---

### 2. Processar Documento

```http
POST /api/documents/:id/process
```

**Request Body (opcional):**
```json
{
  "customSchemaId": "schema-uuid"
}
```

**Comportamento:**
1. Se `customSchemaId` fornecido → usa esse schema
2. Se não → busca schema padrão ativo para `baseType=document` da organização
3. Se não houver schema → processa apenas RAG (sem tabela customizada)

**Response 200:**
```json
{
  "message": "Processamento iniciado",
  "documentId": "doc-uuid",
  "status": "processing"
}
```

---

## Field Types Suportados

| Type | SQL Type | Descrição | Validações |
|------|----------|-----------|------------|
| `text` | `VARCHAR(n)` ou `TEXT` | Texto curto/longo | `minLength`, `maxLength`, `pattern` |
| `numeric` | `DECIMAL(15,2)` | Número decimal | `min`, `max` |
| `date` | `DATE` | Data (YYYY-MM-DD) | - |
| `boolean` | `BOOLEAN` | Verdadeiro/Falso | - |

---

## Colunas do Sistema (Sempre Incluídas)

Toda tabela customizada possui:

```sql
id UUID PRIMARY KEY
organization_id UUID NOT NULL
document_id UUID -- FK para documents/sped_files/csv_imports
processed_document_id UUID -- FK para templates
extracted_at TIMESTAMP DEFAULT NOW()
extracted_by UUID
source_file_path TEXT
confidence_score DECIMAL(3,2) -- 0.00 a 1.00
metadata JSONB -- Backup completo dos dados extraídos
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

**Usuário NÃO pode:**
- Deletar essas colunas
- Criar campos com nomes reservados
- Modificar tipos dessas colunas

---

## Segurança e Validações

### Validação de Nomes

**Table Name:**
- Deve começar com letra minúscula
- Apenas letras, números e underscore (`snake_case`)
- Máximo 63 caracteres
- Não pode começar com `pg_` (reservado PostgreSQL)
- Único por organização

**Field Name:**
- Mesmas regras de table name
- Não pode usar nomes reservados (ver `RESERVED_FIELD_NAMES`)

### SQL Injection Prevention

- ✅ Todos os nomes validados com regex rigoroso
- ✅ Apenas tipos de dados pré-definidos permitidos
- ✅ Uso de `sql.raw()` com parametrização quando necessário
- ✅ Validação de comandos SQL antes de executar

### Multi-Tenancy

- ✅ Todas as queries filtram por `organization_id`
- ✅ Constraint FK garante isolamento
- ✅ Índices otimizados para filtro por organização

---

## Exemplo Completo: Criar e Usar Schema

### Passo 1: Criar Schema

```bash
curl -X POST https://qs-nexus.com/api/admin/schemas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Contratos Jurídicos",
    "tableName": "contratos_juridicos",
    "baseType": "document",
    "category": "juridico",
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

### Passo 2: Criar Tabela Física

```bash
curl -X POST https://qs-nexus.com/api/admin/schemas/<schema-id>/create-table \
  -H "Authorization: Bearer <token>"
```

### Passo 3: Upload com Schema

```bash
curl -X POST https://qs-nexus.com/api/documents/upload \
  -F "files[]=@contrato.pdf" \
  -F "organizationId=<org-id>" \
  -F "customSchemaId=<schema-id>"
```

### Passo 4: Processar

```bash
curl -X POST https://qs-nexus.com/api/documents/<doc-id>/process \
  -H "Authorization: Bearer <token>"
```

### Passo 5: Consultar Dados Extraídos

```bash
curl -X GET "https://qs-nexus.com/api/admin/schemas/<schema-id>/records?limit=10" \
  -H "Authorization: Bearer <token>"
```

---

## Próximos Passos

### Frontend (Pendente)

- [ ] Tela `/admin/schemas` - CRUD de schemas
- [ ] Componente `<FieldBuilder>` - Construtor visual de campos
- [ ] Seletor de schema no formulário de upload
- [ ] Visualização de registros extraídos

### Funcionalidades Futuras

- [ ] Migração de schemas (ALTER TABLE)
- [ ] Versionamento de schemas
- [ ] Importação/exportação de definições
- [ ] Relacionamentos (FKs customizadas)
- [ ] Webhooks pós-extração
- [ ] Validação customizada (scripts)

