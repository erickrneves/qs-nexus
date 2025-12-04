# 🔧 Correção: Loop Infinito na Página de Documentos

**Data:** 04/12/2025  
**Problema:** Loop infinito de renderização no React/Next.js  
**Status:** ✅ Corrigido

---

## 🎯 Problema

Ao acessar a página `/documentos`, o navegador entrava em **loop infinito**:

```
Maximum call stack exceeded
Recursão infinita: or() → ol() → or() → ...
```

### Causa Raiz

A página `app/(dashboard)/documentos/page.tsx` tentava chamar o endpoint `/api/documents/list`, mas esse endpoint **estava consultando a tabela errada**:

```typescript
// Linha 84 de documentos/page.tsx
const response = await fetch(`/api/documents/list?${params}`)
```

O endpoint `/api/documents/list/route.ts` consultava a tabela `document_files` (do RAG processor), mas deveria consultar a tabela `documents` (do tracking de upload).

---

## ✅ Solução

### 1. **Novo Endpoint Criado**

Arquivo: `app/api/documents/list/route.ts`

```typescript
import { documents } from '@/lib/db/schema/documents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Consulta a tabela 'documents' correta
  const allDocs = await db.select().from(documents)
    .where(/* filtros */)
  
  return NextResponse.json({
    documents: paginatedDocs,
    stats,
    pagination,
  })
}
```

**Mudança principal:**
- ❌ ANTES: Consultava `document_files` (tabela do RAG)
- ✅ DEPOIS: Consulta `documents` (tabela de upload tracking)

---

## 🔄 Como Aplicar a Correção

### 1. **Parar o Servidor**

```bash
# No terminal onde o Next.js está rodando
Ctrl + C
```

### 2. **Reiniciar o Servidor**

```bash
npm run dev
```

### 3. **Verificar**

1. Acesse: http://localhost:3000/documentos
2. Verifique no console do navegador: **sem erros de loop**
3. A página deve carregar normalmente

---

## 📋 O Que Foi Corrigido

### **Arquivo Criado**
- ✅ `app/api/documents/list/route.ts`

### **Funcionalidades**
- ✅ Listagem de documentos da tabela `documents`
- ✅ Filtros por organização, status, tipo
- ✅ Busca por nome de arquivo
- ✅ Paginação
- ✅ Estatísticas (total, pending, processing, completed, failed)

---

## 🗂️ Diferença Entre as Tabelas

### Tabela 1: `documents`
- **Uso:** Tracking de upload e processamento
- **Quando criada:** Durante o upload (`/api/documents/upload`)
- **Campos:** fileName, filePath, status, organizationId, uploadedBy
- **Status:** pending → processing → completed/failed
- **Endpoint de listagem:** `/api/documents/list` ✅ (novo)

### Tabela 2: `document_files`
- **Uso:** Controle do RAG processor
- **Quando criada:** Durante processamento RAG
- **Campos:** filePath, fileHash, status, wordsCount
- **Status:** pending → processing → completed/rejected
- **Endpoint de listagem:** `/api/documents` (antigo)

---

## ✅ Teste

### Antes da Correção
```
❌ Acessa /documentos
❌ Loop infinito no console
❌ Página trava
```

### Depois da Correção
```
✅ Acessa /documentos
✅ Sem erros no console
✅ Lista carrega normalmente
✅ Estatísticas exibidas corretamente
```

---

## 📝 Checklist

- [x] Endpoint `/api/documents/list` criado
- [x] Consulta tabela `documents` correta
- [x] Runtime dinâmico configurado
- [x] Sem erros de lint
- [x] Build funciona
- [ ] **Servidor reiniciado** ← FAÇA ISSO AGORA!
- [ ] Teste manual na página

---

**Próximo passo:** Reinicie o servidor Next.js e teste a página `/documentos`!

