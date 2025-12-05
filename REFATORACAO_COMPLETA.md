# Refatoração Completa do Fluxo de Documentos

## ✅ Status: IMPLEMENTADO

Data: 04/12/2025

---

## 🎯 Objetivo

Separar completamente o processamento de documentos em **2 jornadas distintas** e independentes:

### 1️⃣ NORMALIZAÇÃO (Estrutural - SEM IA)
- Upload do arquivo
- Pré-validação
- Escolha de template
- Validação/criação de tabela
- Salvamento na tabela customizada

### 2️⃣ CLASSIFICAÇÃO (Metadados - COM IA)
- Conversão para Markdown
- Extração de dados com IA
- Fragmentação (chunking)
- Vetorização (embeddings)
- Indexação para busca semântica

---

## 📁 Arquivos Criados/Modificados

### Schemas de Banco de Dados

#### ✅ `lib/db/schema/normalization-templates.ts` (NOVO)
Template puro de estrutura de dados (SEM IA):
- Define campos e tipos
- Nome da tabela SQL
- Controle de criação da tabela
- Helper para gerar SQL CREATE TABLE

#### ✅ `lib/db/schema/classification-configs.ts` (NOVO)
Configurações de IA (separadas):
- System prompt
- Model provider/name
- Temperatura
- Token limits
- Configurações de RAG

#### ✅ `lib/db/schema/documents.ts` (ATUALIZADO)
Adicionados campos de status duplo:
```typescript
// NORMALIZAÇÃO
normalizationTemplateId?: UUID
normalizationStatus: 'pending' | 'validating' | 'saving' | 'completed' | 'failed'
normalizationCompletedAt?: Timestamp
normalizationError?: Text
customTableName?: Text
customTableRecordId?: UUID

// CLASSIFICAÇÃO
classificationConfigId?: UUID
classificationStatus: 'pending' | 'extracting' | 'chunking' | 'embedding' | 'completed' | 'failed'
classificationCompletedAt?: Timestamp
classificationError?: Text
totalEmbeddings?: Integer
```

### Componentes de UI

#### ✅ `components/documents/normalization-wizard.tsx` (NOVO)
Wizard step-by-step com 5 etapas:
1. Upload de arquivo
2. Pré-validação (salva temp)
3. Escolha de template (mostra status da tabela)
4. Validação/criação de tabela
5. Salvamento final

#### ✅ `components/documents/classification-wizard.tsx` (NOVO)
Wizard automático com visualização de progresso:
- Extração de dados
- Fragmentação
- Vetorização
- Indexação
- Polling de progresso a cada 2 segundos

#### ✅ `components/documents/document-table.tsx` (ATUALIZADO)
Tabela com 2 dimensões visuais:
- Coluna "📋 Normalização" com badge de status
- Coluna "🤖 Classificação" com badge de status
- Coluna "Upload por" com nome do usuário

#### ✅ `app/(dashboard)/documentos/[id]/page.tsx` (ATUALIZADO)
Página de detalhes com 2 seções distintas:

**Seção 1: Normalização**
```
📋 Normalização (Estrutural)
├── ✓ Upload (arquivo salvo)
├── ✓ Pré-validação (hash: abc123)
├── ✓ Template: "Contratos de Prestação"
├── ✓ Tabela validada: contratos_prestacao
└── ✓ Dados salvos (ID: xyz-789)

Status: COMPLETO ✓
```

**Seção 2: Classificação**
```
🤖 Classificação (Metadados com IA)
├── ⏳ Extração (GPT-4 processando...)
├── ⏸ Fragmentação (aguardando)
├── ⏸ Vetorização (aguardando)
└── ⏸ Indexação (aguardando)

Status: EM PROGRESSO ⏳
[Botão: Iniciar Classificação com IA]
```

### Endpoints de API

#### ✅ Normalização
- `POST /api/documents/normalize/upload` - Pré-validação
- `GET /api/documents/normalize/templates` - Lista templates
- `POST /api/documents/normalize/validate-table` - Valida tabela
- `POST /api/documents/normalize/create-table` - Cria tabela
- `POST /api/documents/normalize/complete` - Salvamento final

#### ✅ Classificação
- `POST /api/documents/classify/start` - Inicia classificação
- `GET /api/documents/classify/progress` - Retorna progresso

### Processadores

#### ✅ `lib/services/normalization-processor.ts` (NOVO)
Processa normalização (estrutural):
- Valida arquivo e template
- Verifica existência de tabela
- Cria registro vazio na tabela customizada
- Atualiza status de normalização

#### ✅ `lib/services/classification-processor.ts` (NOVO)
Processa classificação (IA):
- Converte para Markdown
- Extrai dados com IA
- Atualiza tabela customizada com dados extraídos
- Fragmenta documento
- Gera embeddings
- Salva chunks no banco

### Scripts de Migração

#### ✅ `scripts/migrate-document-schemas-to-templates.ts`
Migra `document_schemas` existentes para:
- `normalization_templates` (sem campos de IA)
- `classification_configs` (só campos de IA)

#### ✅ `scripts/update-existing-documents-status.ts`
Atualiza documentos existentes com novos status:
- Define `normalizationStatus` baseado em `status`
- Define `classificationStatus` verificando se tem chunks

#### ✅ `scripts/create-default-templates.ts`
Cria templates padrão:
- "Documentos Gerais" (template + config de IA)
- "Contratos" (template + config de IA)

---

## 🚀 Como Usar

### 1. Aplicar Schemas no Banco

```bash
cd /Users/ern/Downloads/qs-nexus
npx drizzle-kit push --config drizzle.config.ts
```

### 2. Criar Templates Padrão

```bash
npx tsx scripts/create-default-templates.ts
```

### 3. Migrar Dados Existentes (Opcional)

```bash
# Migrar schemas antigos para nova arquitetura
npx tsx scripts/migrate-document-schemas-to-templates.ts

# Atualizar status de documentos existentes
npx tsx scripts/update-existing-documents-status.ts
```

### 4. Testar Nova Interface

1. Acesse: http://localhost:3000/documentos
2. Clique em "Upload"
3. Siga o wizard de 5 etapas
4. Após normalização, vá em "Ver Detalhes"
5. Clique em "Iniciar Classificação com IA"
6. Acompanhe progresso em tempo real

---

## 🎨 Experiência do Usuário

### Tela Principal de Documentos

| Arquivo | Upload por | Tamanho | 📋 Normalização | 🤖 Classificação | Data |
|---------|-----------|---------|-----------------|------------------|------|
| contrato.pdf | João Silva | 2.5 MB | ✓ Salvo | ✓ Completo | Há 2 horas |
| relatorio.docx | Maria Santos | 1.8 MB | ✓ Salvo | ⏳ Extraindo | Há 1 hora |
| nota.txt | Pedro Costa | 45 KB | Pendente | Pendente | Há 5 min |

### Upload com Wizard

```
[============================== 80% ==============================]

Step 1: Upload              ✓
Step 2: Pré-validação       ✓
Step 3: Template            ✓
Step 4: Tabela              → (em progresso)
Step 5: Salvamento          ○

┌─────────────────────────────────────────────────────┐
│ Template: Contratos                                  │
│ Tabela: contratos                                    │
│ Status: ⚠️ Tabela precisa ser criada                │
│                                                      │
│ [Voltar]  [Criar Tabela]                           │
└─────────────────────────────────────────────────────┘
```

### Página de Detalhes

```
contrato_prestacao_servicos.pdf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 NORMALIZAÇÃO (Estrutural)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Upload           Hash: a3f2c8...
  ✓ Pré-validação    Arquivo validado
  ✓ Template         Template: Contratos
  ✓ Tabela validada  Tabela: contratos
  ✓ Dados salvos     ID: xyz-789
  
  Status: COMPLETO ✓

🤖 CLASSIFICAÇÃO (Metadados com IA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⏳ Extração       GPT-4 processando...
  ⏸ Fragmentação    Aguardando
  ⏸ Vetorização     Aguardando
  ⏸ Indexação       Aguardando
  
  Status: EM PROGRESSO ⏳
  
  [▶ Iniciar Classificação com IA]
```

---

## 🔧 Próximos Passos (Opcional)

1. **Integração com Filas**: Adicionar jobs em background (BullMQ, Redis)
2. **Webhooks**: Notificar quando processamento completar
3. **Retry Logic**: Tentar novamente automaticamente em caso de erro
4. **Custos de IA**: Rastrear custo por documento
5. **Templates Compartilhados**: Permitir templates entre organizações
6. **Versionamento**: Versionar templates e configs
7. **Audit Trail**: Log detalhado de cada etapa
8. **Visualização de Dados Extraídos**: Mostrar preview dos dados extraídos

---

## 📊 Métricas de Sucesso

- ✅ Separação completa: Normalização vs Classificação
- ✅ Wizard intuitivo de 5 etapas
- ✅ Visualização em tempo real do progresso
- ✅ Usuário vê "Upload por" em todos os lugares
- ✅ Templates sem IA (estrutura pura)
- ✅ Configs de IA separadas
- ✅ Tabelas dinâmicas criadas on-demand
- ✅ 2 dimensões claramente visíveis na UI

---

## 🐛 Possíveis Problemas e Soluções

### Problema: Tabela não existe
**Solução**: Usar endpoint `/api/documents/normalize/create-table`

### Problema: Classificação não inicia
**Solução**: Verificar se `normalizationStatus` = 'completed'

### Problema: Erro ao gerar SQL
**Solução**: Verificar campos do template em `normalization_templates.fields`

### Problema: Upload por mostra "Desconhecido"
**Solução**: Verificar join com `ragUsers` no endpoint `/api/documents/list`

---

## 📝 Notas Técnicas

### Diferença entre `documents` e `document_files`

- **`documents`**: Tabela principal com metadata + status duplo
- **`document_files`**: Tabela de RAG (legado) com chunks/embeddings
- **Relacionamento**: 1 documento → 1 document_file → N chunks

### Status Legado vs. Novo

| Legado | Normalização | Classificação |
|--------|--------------|---------------|
| pending | pending | pending |
| processing | completed | extracting/chunking/embedding |
| completed | completed | completed |
| failed | failed OU completed | pending OU failed |

### Ordem de Processamento

```
Upload → Pré-validação → Template → Tabela → Salvamento
   ↓                                              ↓
pending                                    normalization: completed
                                                  ↓
                                         Extração → Chunking → Embedding → Indexação
                                                                                ↓
                                                                    classification: completed
```

---

## 🎉 Conclusão

Refatoração **100% implementada** e pronta para uso!

O sistema agora possui:
- ✅ Separação clara entre estrutura e IA
- ✅ Interface intuitiva com wizard
- ✅ Visualização transparente do progresso
- ✅ Arquitetura escalável e mantível

**Próximo passo**: Testar localmente e validar fluxo completo!

