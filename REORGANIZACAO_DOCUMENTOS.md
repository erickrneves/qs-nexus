# 📋 Reorganização do Fluxo de Documentos

**Data:** 04/12/2025  
**Objetivo:** Simplificar e tornar mais claro o fluxo de upload e processamento de documentos

---

## 🎯 Problema Identificado

O sistema estava confuso com:
- Múltiplas abas (SPED, CSV, Documentos) na mesma página
- Nomenclatura técnica ("schemas") pouco intuitiva
- Falta de visualização clara do estágio de processamento
- Impossibilidade de ver detalhes do processamento de cada documento

---

## ✅ Mudanças Implementadas

### 1. **Página de Upload Simplificada** (`/upload`)

**Antes:**
- Tabs com SPED, CSV e Documentos misturados
- Interface confusa
- Múltiplos fluxos diferentes

**Depois:**
- **Foco exclusivo em Documentos**
- Interface em 3 passos claros:
  1. Selecionar arquivos
  2. Escolher Template de Normalização
  3. Processar
- Alert informativo explicando o processo
- Visual limpo e intuitivo

**Arquivos Alterados:**
- `app/(dashboard)/upload/page.tsx` - Simplificado drasticamente

---

### 2. **Nomenclatura Atualizada**

**Antes:** "Schema de Documento"
**Depois:** "Template de Normalização"

**Justificativa:** 
- Mais claro e intuitivo
- Explica melhor o propósito: é um *template* que define *como normalizar* os dados

**Arquivos Alterados:**
- `components/upload/schema-selector.tsx` - Todos os textos atualizados

---

### 3. **Visualização de Estágios de Processamento**

**Novo Componente:** `DocumentProcessingStages`

Mostra visualmente cada etapa do processamento:
1. 📤 **Upload** - Arquivo recebido e salvo
2. 🔄 **Conversão** - PDF/DOCX → Markdown
3. 🤖 **Classificação Inteligente** - IA extrai dados usando Template
4. ✂️ **Fragmentação** - Divisão em chunks
5. 🧮 **Vetorização** - Geração de embeddings
6. 💾 **Indexação** - Armazenamento no banco

**Features:**
- ✅ Indicadores visuais de status (completo, em progresso, falhou, pendente)
- ✅ Linha de conexão entre estágios
- ✅ Mensagens de erro detalhadas
- ✅ Timestamps de conclusão
- ✅ Animações para estágios em progresso

**Arquivos Criados:**
- `components/documents/document-processing-stages.tsx`

---

### 4. **Página de Detalhes do Documento**

**Nova Página:** `/documentos/[id]`

Mostra tudo sobre um documento:
- **Header** com nome do arquivo, status e ações
- **Cards de Informação:**
  - Tamanho do arquivo
  - Data de upload
  - Data de processamento
  - Quem enviou
- **Estatísticas:**
  - Número de fragmentos criados
  - Total de tokens processados
- **Fluxo Visual:** Componente `DocumentProcessingStages` mostrando cada etapa
- **Ações:**
  - Download
  - Reprocessar
  - Deletar

**Auto-refresh:** 
- A página atualiza automaticamente a cada 3 segundos se o documento estiver sendo processado

**Arquivos Criados:**
- `app/(dashboard)/documentos/[id]/page.tsx`
- `app/api/documents/[id]/route.ts` (API endpoint)

---

### 5. **Tabela de Documentos Aprimorada**

**Novo botão:** "Ver Detalhes" em cada linha

**Antes:**
- Apenas dropdown com ações
- Sem acesso rápido aos detalhes

**Depois:**
- Botão "Ver Detalhes" visível e destacado
- Link direto para página de detalhes
- Mantém dropdown para outras ações

**Arquivos Alterados:**
- `components/documents/document-table.tsx`

---

## 🗺️ Novo Fluxo do Usuário

### Upload de Documento

```
1. Usuário acessa /upload
   ↓
2. Seleciona arquivos (PDF, DOCX, DOC, TXT)
   ↓
3. Sistema mostra "Template de Normalização" recomendado
   ↓
4. Usuário confirma ou escolhe outro template
   ↓
5. Clica "Enviar e Processar"
   ↓
6. Sistema salva arquivo e inicia processamento automático
   ↓
7. Usuário é redirecionado para /documentos
```

### Acompanhamento do Processamento

```
1. Usuário vê documento na lista com status
   ↓
2. Clica "Ver Detalhes"
   ↓
3. Acessa página /documentos/[id]
   ↓
4. Visualiza fluxo completo com estágios
   ↓
5. Página auto-atualiza durante processamento
   ↓
6. Quando completo, mostra estatísticas finais
```

---

## 📊 Estágios de Processamento Detalhados

### 1. Upload
- **O que faz:** Recebe arquivo e salva no disco
- **Tecnologia:** Node.js fs, SHA-256 hash
- **Output:** Arquivo em `public/uploads/{org}/{year}/{month}/{hash}-{nome}`

### 2. Conversão
- **O que faz:** Transforma PDF/DOCX em Markdown
- **Tecnologia:** 
  - PDF: `pdf-parse` ou Pandoc
  - DOCX: `mammoth`
  - DOC: `textract` ou LibreOffice
- **Output:** String Markdown normalizada

### 3. Classificação Inteligente
- **O que faz:** IA extrai dados estruturados
- **Tecnologia:** GPT-4 ou Gemini Pro
- **Input:** Markdown + Template de Normalização
- **Output:** JSON com campos extraídos

### 4. Fragmentação
- **O que faz:** Divide documento em chunks menores
- **Tecnologia:** Custom chunker
- **Parâmetros:** Max 800 tokens por chunk
- **Output:** Array de fragmentos

### 5. Vetorização
- **O que faz:** Gera embeddings para busca semântica
- **Tecnologia:** OpenAI `text-embedding-3-small`
- **Output:** Vetores de 1536 dimensões

### 6. Indexação
- **O que faz:** Salva tudo no banco de dados
- **Tecnologia:** PostgreSQL + pgvector
- **Output:** 
  - Tabela customizada (dados estruturados)
  - Tabela RAG (fragmentos + embeddings)

---

## 🎨 Interface Visual

### Cores e Estados

**Pending (Pendente):**
- 🔴 Badge cinza
- Ícone: Circle vazio
- Cor de fundo: Cinza claro

**Processing (Processando):**
- 🔵 Badge azul
- Ícone: Loader animado
- Cor de fundo: Azul claro
- Linha conectora azul

**Completed (Completo):**
- 🟢 Badge verde
- Ícone: CheckCircle
- Cor de fundo: Verde claro
- Linha conectora verde

**Failed (Erro):**
- 🔴 Badge vermelho
- Ícone: XCircle
- Cor de fundo: Vermelho claro
- Alert com mensagem de erro

---

## 🔧 Arquivos Criados/Modificados

### Criados:
1. `components/documents/document-processing-stages.tsx` - Componente visual de estágios
2. `app/(dashboard)/documentos/[id]/page.tsx` - Página de detalhes
3. `app/api/documents/[id]/route.ts` - API endpoint para detalhes
4. `REORGANIZACAO_DOCUMENTOS.md` - Esta documentação

### Modificados:
1. `app/(dashboard)/upload/page.tsx` - Simplificado para só documentos
2. `components/upload/schema-selector.tsx` - Nomenclatura atualizada
3. `components/documents/document-table.tsx` - Botão "Ver Detalhes"

---

## 🚀 Como Testar

### 1. Upload de Documento

```bash
1. Acesse http://localhost:3000/upload
2. Selecione um arquivo PDF ou DOCX
3. Verifique se o Template é recomendado automaticamente
4. Clique "Enviar e Processar"
5. Aguarde redirecionamento para /documentos
```

### 2. Visualização de Detalhes

```bash
1. Na lista de documentos
2. Clique "Ver Detalhes" em qualquer documento
3. Observe o fluxo visual de processamento
4. Se estiver processando, página atualiza automaticamente
5. Verifique estatísticas quando completo
```

### 3. Reprocessamento

```bash
1. Na página de detalhes de um documento
2. Clique "Reprocessar"
3. Observe estágios sendo executados novamente
```

---

## 📝 Próximos Passos (Futuro)

### Melhorias Sugeridas:

1. **WebSocket para updates em tempo real**
   - Eliminar polling a cada 3 segundos
   - Updates instantâneos do progresso

2. **Mais detalhes por estágio**
   - Mostrar progresso % dentro de cada estágio
   - Logs detalhados de cada operação

3. **Visualização do Markdown**
   - Preview do Markdown gerado na conversão
   - Highlight das entidades extraídas

4. **Edição de dados extraídos**
   - Permitir usuário corrigir dados classificados
   - Re-indexar após edição

5. **Comparação de Templates**
   - Processar mesmo documento com templates diferentes
   - Comparar resultados lado a lado

6. **Analytics de Processamento**
   - Tempo médio por estágio
   - Taxa de sucesso/falha
   - Templates mais usados

---

## ✅ Checklist de Validação

- [x] Página de upload simplificada
- [x] Nomenclatura clara ("Template de Normalização")
- [x] Componente visual de estágios criado
- [x] Página de detalhes funcionando
- [x] API endpoint de detalhes criado
- [x] Botão "Ver Detalhes" na tabela
- [x] Auto-refresh durante processamento
- [x] Documentação completa

---

## 🎯 Resultado Final

**Antes:**
- Fluxo confuso
- Nomenclatura técnica
- Sem visibilidade do processamento
- Interface sobrecarregada

**Depois:**
- ✅ Fluxo claro em 3 passos
- ✅ Linguagem intuitiva
- ✅ Visualização completa de cada etapa
- ✅ Interface focada e limpa
- ✅ Página dedicada para detalhes
- ✅ Acompanhamento em tempo real

---

**Mantido por:** Equipe de Desenvolvimento  
**Última atualização:** 04/12/2025  
**Status:** ✅ Implementado e Testado

