# 🔄 Fluxo Completo de Processamento de Documentos

**Data:** 04/12/2025  
**Status:** ✅ Corrigido e Documentado

---

## 🎯 Problema Identificado

O sistema tinha **múltiplos problemas** no fluxo de processamento de documentos:

### 1. **Duas Tabelas de Documentos** 
- ❌ `documents` (nova, para documentos gerais)
- ❌ `document_files` (antiga, usada pelo RAG processor)
- ⚠️ **Duplicação e confusão** no código

### 2. **Upload Sem Processamento**
- ❌ Endpoint `/api/documents/upload` apenas salvava arquivo
- ❌ Nenhum processamento RAG era executado
- ❌ Documentos ficavam com status "pending" para sempre

### 3. **Arquivos Não Salvos**
- ❌ Diretório `public/uploads` não existia
- ❌ mkdir() falhava silenciosamente
- ❌ Registros criados no BD mas arquivos não no disco

---

## ✅ Correções Implementadas

### 1. **Endpoint de Upload Corrigido** (`/api/documents/upload`)

#### A. Verificação de Diretórios

```typescript
// ANTES - sem verificação
await mkdir(dir, { recursive: true })

// DEPOIS - com verificação
await mkdir(dir, { recursive: true })
if (!existsSync(dir)) {
  throw new Error(`Falha ao criar diretório: ${dir}`)
}
```

#### B. Verificação de Arquivo Salvo

```typescript
// ANTES - sem verificação
await writeFile(fullPath, buffer)

// DEPOIS - com verificação
await writeFile(fullPath, buffer)
if (!existsSync(fullPath)) {
  throw new Error(`Falha ao salvar arquivo: ${fullPath}`)
}
```

#### C. Processamento Automático

```typescript
// NOVO - processamento em background
processFile(fullPath, (progress) => {
  console.log(`[PROCESS ${doc.id}] [${progress.progress}%] ${progress.message}`)
}, {
  documentId: doc.id,
  organizationId,
  uploadedBy: session.user.id,
}).then(async (result) => {
  if (result.success) {
    await db.update(documents).set({
      status: 'completed',
      processedAt: new Date(),
    }).where(eq(documents.id, doc.id))
  } else {
    await db.update(documents).set({
      status: 'failed',
      errorMessage: result.error,
    }).where(eq(documents.id, doc.id))
  }
})
```

### 2. **Diretório de Uploads Criado**

```bash
mkdir -p public/uploads
```

### 3. **Script de Processamento Criado**

Script para processar documentos pendentes: `scripts/process-pending-documents.ts`

---

## 📋 Fluxo Completo Atual

### **Upload de Documento** 

```
1. Upload via /api/documents/upload
   ↓
2. Validação (tipo, tamanho, permissões)
   ↓
3. Cálculo de hash do arquivo
   ↓
4. Criação de diretórios (com verificação)
   ↓
5. Salvamento do arquivo (com verificação)
   ↓
6. Criação de registro no BD (tabela: documents)
   ↓
7. Processamento RAG iniciado em background
```

### **Processamento RAG** (Assíncrono)

```
1. Converter documento → Markdown
   ↓
2. Classificar com AI
   ↓
3. Extrair metadados
   ↓
4. Gerar chunks
   ↓
5. Gerar embeddings
   ↓
6. Armazenar em document_files + templates + chunks
   ↓
7. Atualizar status: 'completed'
```

---

## 🗂️ Estrutura de Tabelas

### Tabela 1: `documents` (Upload e Tracking)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  document_type TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tabela 2: `document_files` (RAG Processor)
```sql
CREATE TABLE document_files (
  id UUID PRIMARY KEY,
  organization_id UUID,
  created_by UUID,
  
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  
  status TEXT NOT NULL DEFAULT 'pending',
  words_count INTEGER,
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Nota:** `document_files` é criado durante o processamento RAG, não no upload.

---

## 🔄 Estados do Documento

### Upload (`documents` table)
1. **pending** - Arquivo enviado, aguardando processamento
2. **processing** - Processamento RAG em andamento  
3. **completed** - Processamento concluído com sucesso
4. **failed** - Erro no processamento

### RAG (`document_files` table)
1. **pending** - Arquivo rastreado, aguardando processamento
2. **processing** - Conversão/classificação em andamento
3. **completed** - Template e chunks criados
4. **rejected** - Arquivo rejeitado (muito pequeno, inválido, etc)

---

## 🧪 Como Testar

### 1. Teste de Upload

```bash
# Via interface
1. Acesse /documentos
2. Clique em "Upload de Documentos"
3. Selecione um arquivo .docx ou .pdf
4. Envie

# Verifique nos logs do servidor
grep "\[UPLOAD\]" logs/*.log
grep "\[PROCESS\]" logs/*.log
```

### 2. Verificar Processamento

```bash
# Execute o script de verificação
npx tsx scripts/process-pending-documents.ts

# Verifique no banco
psql $DATABASE_URL -c "SELECT id, file_name, status FROM documents ORDER BY created_at DESC LIMIT 5;"
```

### 3. Verificar Arquivos no Disco

```bash
ls -lh public/uploads/*/2025/12/
```

---

## 📊 Resultados Esperados

### Upload Bem-Sucedido
```
✅ Arquivo salvo em public/uploads/{org}/{year}/{month}/{hash}-{file}
✅ Registro criado em documents com status 'pending'
✅ Processamento iniciado em background
✅ Após processamento: status → 'completed'
✅ Registro criado em document_files
✅ Template criado em templates
✅ Chunks criados em template_chunks com embeddings
```

### Logs Esperados
```
[UPLOAD] Processando arquivo: contrato.docx
[UPLOAD] Hash calculado: abc123
[UPLOAD] Criando diretório: /path/to/uploads/org-id/2025/12
[UPLOAD] Diretório criado com sucesso
[UPLOAD] Arquivo salvo em disco: /full/path/file.docx
[UPLOAD] Documento salvo no BD: uuid-123
[UPLOAD] Iniciando processamento em background...
[PROCESS uuid-123] [10%] Convertendo documento para Markdown...
[PROCESS uuid-123] [40%] Classificando documento...
[PROCESS uuid-123] [75%] Gerando chunks...
[PROCESS uuid-123] [90%] Gerando embeddings...
[PROCESS uuid-123] [100%] Processamento concluído
[PROCESS uuid-123] ✅ Processamento concluído
```

---

## 🔧 Arquivos Modificados

### 1. **API Endpoints**
- ✅ `app/api/documents/upload/route.ts`
  - Adicionado processamento automático em background
  - Verificação de diretórios e arquivos
  - Logging aprimorado

### 2. **Componentes**
- ✅ `components/documents/document-upload-dialog.tsx`
  - SPED usa `/api/ingest/sped` (correção anterior)
  - Documentos usam `/api/documents/upload`

### 3. **Scripts**
- ✅ `scripts/process-pending-documents.ts` (novo)
- ✅ `scripts/check-sped-data.ts` (novo)
- ✅ `scripts/check-pending-sped.ts` (novo)

### 4. **Documentação**
- ✅ `FLUXO_PROCESSAMENTO_DOCUMENTOS.md` (este arquivo)
- ✅ `CORRECAO_UPLOAD_SPED.md`
- ✅ `RESUMO_CORRECAO.md`

---

## 🚨 Problemas Conhecidos

### 1. **Documentos Pendentes Antigos**
Os 3 documentos criados antes da correção estão com status "pending" e **não têm arquivos no disco**.

**Solução:**
```sql
UPDATE documents 
SET status = 'failed', 
    error_message = 'Arquivo não encontrado (upload anterior à correção)'
WHERE status = 'pending' 
  AND created_at < '2025-12-04 13:50:00';
```

### 2. **Duas Tabelas de Documentos**
Mantivemos as duas tabelas por compatibilidade:
- `documents` - Upload tracking
- `document_files` - RAG processor

**Melhoria futura:** Unificar em uma única tabela.

---

## 📝 Checklist de Validação

- [x] Diretório `public/uploads` criado
- [x] Endpoint `/api/documents/upload` corrigido
- [x] Processamento automático implementado
- [x] Verificações de erro adicionadas
- [x] Logging aprimorado
- [x] Script de processamento criado
- [x] Documentação completa
- [ ] **Teste manual pendente**
- [ ] Limpeza de documentos antigos

---

## 🎯 Próximos Passos

1. **Teste manual**: Fazer upload de um documento real
2. **Monitorar logs**: Verificar se processamento funciona
3. **Limpar pendentes**: Marcar documentos antigos como failed
4. **Unificar tabelas**: Considerar migração futura para tabela única

---

**Autor:** AI Assistant  
**Data:** 04/12/2025  
**Status:** ✅ Pronto para teste

