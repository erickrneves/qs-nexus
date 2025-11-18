# Arquitetura do Sistema de Curadoria

## Visão Geral

O sistema de curadoria processa documentos jurídicos DOCX através de um pipeline de ETL (Extract, Transform, Load) que prepara os dados para uso em um sistema RAG.

## Fluxo de Dados

```
DOCX Files
    ↓
[1] extract_docs.py
    ↓
docs_raw.jsonl (texto bruto)
    ↓
[2] filter_docs.py
    ↓
docs_filtered.jsonl (texto limpo)
    ↓
[3] classify_docs_v3.py
    ↓
classification_results.jsonl (metadados)
    ↓
[4] convert_to_csv_v2.py
    ↓
curadoria.csv
    ↓
[5] selecao_rag.csv (edição manual)
    ↓
[6] build_datasets.py
    ↓
dataset_gold.csv | dataset_silver.csv | dataset_curado.csv
    ↓
[7] create_embeddings.py
    ↓
embeddings.jsonl
    ↓
[8] import_embeddings_supabase.py
    ↓
PostgreSQL (Supabase) - Tabela lw_embeddings
```

## Componentes

### 1. Extração (Extract)

**Script:** `extract_docs.py`

- **Input:** Arquivos DOCX em `/Users/william/development/legalwise/rag-system/list-docx`
- **Output:** `docs_raw.jsonl`
- **Processo:**
  - Varredura recursiva de diretórios
  - Leitura de arquivos DOCX usando `python-docx`
  - Extração de texto de parágrafos
  - Contagem de palavras
  - Serialização em JSONL

### 2. Filtragem (Transform)

**Script:** `filter_docs.py`

- **Input:** `docs_raw.jsonl`
- **Output:** `docs_filtered.jsonl`
- **Processo:**
  - Filtragem por tamanho (300-25.000 palavras)
  - Remoção de outliers
  - Preservação de metadados

### 3. Classificação (Transform)

**Script:** `classify_docs_v3.py`

- **Input:** `docs_filtered.jsonl`
- **Output:** `classification_results.jsonl`
- **Processo:**
  - Chamadas à API OpenAI (GPT-4o-mini)
  - Classificação semântica de documentos
  - Extração de metadados estruturados
  - Suporte a retomada de processamento

**Metadados Extraídos:**
- Tipo de documento
- Área de direito
- Tipo (modelo vs. peça real)
- Qualidade (clareza, estrutura)
- Nível de risco
- Resumo

### 4. Conversão para CSV

**Script:** `convert_to_csv_v2.py`

- **Input:** `classification_results.jsonl`
- **Output:** `curadoria.csv`
- **Processo:**
  - Conversão de JSONL para CSV
  - Normalização de campos
  - Preparação para análise manual

### 5. Seleção Manual

**Arquivo:** `selecao_rag.csv`

- Processo manual de curadoria
- Adição de notas e flags de seleção
- Classificação GOLD/SILVER

### 6. Geração de Datasets

**Script:** `build_datasets.py`

- **Input:** `selecao_rag.csv`
- **Output:** `dataset_gold.csv`, `dataset_silver.csv`, `dataset_curado.csv`
- **Processo:**
  - Classificação automática por nota
  - Separação em tiers de qualidade
  - Geração de múltiplos datasets

### 7. Geração de Embeddings

**Script:** `create_embeddings.py`

- **Input:** `docs_filtered.jsonl` (ou dataset selecionado)
- **Output:** `embeddings.jsonl`
- **Processo:**
  - Chunking de documentos (4.000 caracteres)
  - Geração de embeddings via OpenAI
  - Batch processing (64 chunks/requisição)
  - Modelo: `text-embedding-3-small` (1536 dimensões)

### 8. Importação para Banco

**Script:** `import_embeddings_supabase.py`

- **Input:** `embeddings.jsonl`
- **Output:** Tabela PostgreSQL
- **Processo:**
  - Conexão com Supabase
  - Criação de tabela com pgvector
  - Importação em batches
  - Conversão de arrays para formato vector

## Estrutura de Dados

### JSONL (docs_raw.jsonl, docs_filtered.jsonl)
```json
{
  "id": "nome_arquivo.docx",
  "path": "/caminho/completo/arquivo.docx",
  "words": 1234,
  "text": "conteúdo extraído..."
}
```

### JSONL (classification_results.jsonl)
```json
{
  "id": "nome_arquivo.docx",
  "tipo_documento": "peticao_inicial",
  "area_direito": "civil",
  "modelo_ou_peca_real": "modelo",
  "qualidade_clareza": 8,
  "qualidade_estrutura": 7,
  "risco": 2,
  "resumo": "Resumo do documento..."
}
```

### JSONL (embeddings.jsonl)
```json
{
  "doc_id": "nome_arquivo.docx",
  "chunk_index": 0,
  "embedding": [0.123, -0.456, ...]
}
```

### CSV (curadoria.csv, selecao_rag.csv)
```csv
documento_id,tipo_documento,area_direito,modelo_ou_peca_real,qualidade_clareza,qualidade_estrutura,risco,resumo,NOTA,RAG GOLD,RAG SILVER
```

### Tabela PostgreSQL (lw_embeddings)
```sql
CREATE TABLE lw_embeddings (
    doc_id      text,
    chunk_index integer,
    content     text,
    embedding   vector(1536),
    created_at  timestamptz DEFAULT now()
);
```

## Decisões de Design

### Por que JSONL?
- Formato eficiente para processamento linha por linha
- Permite processamento incremental
- Não requer carregar todo o dataset em memória

### Por que Chunking?
- Limites de contexto da API OpenAI
- Melhor granularidade para busca vetorial
- Permite recuperação de trechos específicos

### Por que pgvector?
- Extensão PostgreSQL nativa para busca vetorial
- Suporte a operadores de similaridade (cosine, L2, inner product)
- Integração natural com PostgreSQL

### Por que Batch Processing?
- Redução de custos de API
- Melhor throughput
- Tratamento de rate limits

## Limitações Atuais

1. **Não converte para Markdown**
   - Processa texto puro extraído do DOCX
   - Perde formatação estrutural

2. **Classificação pode ser melhorada**
   - Critérios podem ser refinados
   - Prompt de classificação pode ser otimizado

3. **Dependência de Supabase**
   - Script de importação específico para Supabase
   - Precisa migrar para Neon do projeto principal

4. **Processamento Sequencial**
   - Classificação é sequencial (lenta para grandes volumes)
   - Embeddings já usam batch processing

## Melhorias Planejadas

1. **Conversão para Markdown**
   - Adicionar etapa de conversão DOCX → Markdown
   - Preservar estrutura (títulos, listas, etc.)

2. **Migração para AI SDK**
   - Usar `@ai-sdk/openai` em vez de OpenAI SDK direto
   - Melhor integração com o stack do projeto

3. **Integração com Neon + Drizzle**
   - Criar schema Drizzle para RAG
   - Migrações automáticas
   - Integração com sistema principal

4. **Processamento Paralelo**
   - Paralelizar classificação quando possível
   - Otimizar uso de API

