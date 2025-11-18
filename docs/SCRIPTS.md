# Documentação dos Scripts

## Scripts de Processamento

### extract_docs.py

Extrai texto de arquivos DOCX e gera um arquivo JSONL.

**Dependências:**
- `python-docx`
- `tqdm`

**Uso:**
```bash
python extract_docs.py
```

**Configuração:**
- `BASE_DIR`: Diretório base para busca (padrão: `/Users/william/development/legalwise/rag-system/list-docx`)
- `OUTPUT_FILE`: Nome do arquivo de saída (padrão: `docs_raw.jsonl`)

**Output:**
- Arquivo `docs_raw.jsonl` com uma linha JSON por documento

**Tratamento de Erros:**
- Ignora arquivos corrompidos
- Continua processamento mesmo com falhas individuais

---

### filter_docs.py

Filtra documentos por tamanho, removendo outliers.

**Dependências:**
- Nenhuma (biblioteca padrão)

**Uso:**
```bash
python filter_docs.py
```

**Configuração:**
- `MIN_WORDS`: Mínimo de palavras (padrão: 300)
- `MAX_WORDS`: Máximo de palavras (padrão: 25.000)
- `INPUT_FILE`: Arquivo de entrada (padrão: `docs_raw.jsonl`)
- `OUTPUT_FILE`: Arquivo de saída (padrão: `docs_filtered.jsonl`)

**Output:**
- Arquivo `docs_filtered.jsonl` com documentos filtrados
- Estatísticas no console (total, mantidos, descartados)

---

### classify_docs_v3.py

Classifica documentos usando OpenAI GPT-4o-mini.

**Dependências:**
- `openai`

**Uso:**
```bash
python classify_docs_v3.py
```

**Configuração:**
- `INPUT_FILE`: Arquivo de entrada (padrão: `docs_filtered.jsonl`)
- `OUTPUT_FILE`: Arquivo de saída (padrão: `classification_results.jsonl`)
- `MAX_CHARS`: Limite de caracteres por documento (padrão: 12.000)
- `MODEL`: Modelo OpenAI (padrão: `gpt-4o-mini`)

**Características:**
- Suporta retomada (não reprocessa documentos já classificados)
- Retry automático em caso de erro
- Rate limiting implícito (processamento sequencial)

**Output:**
- Arquivo `classification_results.jsonl` com classificações
- Logs de progresso no console

**Variáveis de Ambiente:**
- `OPENAI_API_KEY`: Chave da API OpenAI (obrigatória)

---

### convert_to_csv_v2.py

Converte resultados de classificação de JSONL para CSV.

**Dependências:**
- Nenhuma (biblioteca padrão)

**Uso:**
```bash
python convert_to_csv_v2.py
```

**Configuração:**
- `INPUT_FILE`: Arquivo de entrada (padrão: `classification_results.jsonl`)
- `OUTPUT_FILE`: Arquivo de saída (padrão: `curadoria.csv`)

**Output:**
- Arquivo CSV com colunas padronizadas
- Estatísticas de conversão

---

### build_datasets.py

Gera datasets GOLD, SILVER e CURADO a partir da seleção RAG.

**Dependências:**
- Nenhuma (biblioteca padrão)

**Uso:**
```bash
python build_datasets.py
```

**Configuração:**
- `INPUT_FILE`: Arquivo de entrada (padrão: `selecao_rag.csv`)

**Lógica de Classificação:**
- **GOLD:** nota > 60
- **SILVER:** 56 ≤ nota < 60
- **CURADO:** GOLD + SILVER

**Output:**
- `dataset_gold.csv`
- `dataset_silver.csv`
- `dataset_curado.csv`

**Características:**
- Detecta automaticamente o delimitador do CSV (`,` ou `;`)
- Recalcula flags RAG_GOLD e RAG_SILVER baseado na nota
- Trata formatação brasileira de números (vírgula como decimal)

---

### create_embeddings.py

Gera embeddings para chunks de documentos.

**Dependências:**
- `openai`
- `tqdm`

**Uso:**
```bash
python create_embeddings.py
```

**Configuração:**
- `INPUT_FILE`: Arquivo de entrada (padrão: `docs_filtered.jsonl`)
- `OUTPUT_FILE`: Arquivo de saída (padrão: `embeddings.jsonl`)
- `MODEL`: Modelo de embedding (padrão: `text-embedding-3-small`)
- `BATCH_SIZE`: Tamanho do batch (padrão: 64)
- `MAX_CHARS`: Tamanho máximo do chunk (padrão: 4.000)

**Processo:**
1. Lê documentos do JSONL
2. Divide cada documento em chunks
3. Processa chunks em batches
4. Gera embeddings via API OpenAI
5. Salva resultados em JSONL

**Output:**
- Arquivo `embeddings.jsonl` com chunks e embeddings
- Estatísticas de processamento

**Variáveis de Ambiente:**
- `OPENAI_API_KEY`: Chave da API OpenAI (obrigatória)

---

### import_embeddings_supabase.py

Importa embeddings para banco de dados Supabase.

**Dependências:**
- `psycopg2`

**Uso:**
```bash
python import_embeddings_supabase.py
```

**Configuração:**
- `DB_CONFIG`: Configuração do banco (editar no script)
- `EMBEDDINGS_FILE`: Arquivo de entrada (padrão: `embeddings.jsonl`)
- `BATCH_SIZE`: Tamanho do batch de inserção (padrão: 500)

**Estrutura da Tabela:**
```sql
CREATE TABLE IF NOT EXISTS lw_embeddings (
    doc_id      text,
    chunk_index integer,
    content     text,
    embedding   vector(1536),
    created_at  timestamptz DEFAULT now()
);
```

**Características:**
- Cria tabela automaticamente se não existir
- Importação em batches para performance
- Conversão automática de arrays para formato pgvector
- Transações para garantir consistência

**Nota:** Este script está configurado para Supabase. Precisa ser adaptado para Neon.

---

## Scripts Auxiliares

### check_batch.py, debug_batch.py, prepare_batch.py, run_batch.py

Scripts relacionados ao processamento em batch da OpenAI. Não documentados em detalhe, mas parecem ser utilitários para gerenciar requisições em batch da API OpenAI.

---

## Ordem de Execução Recomendada

1. **Extração:**
   ```bash
   python extract_docs.py
   ```

2. **Filtragem:**
   ```bash
   python filter_docs.py
   ```

3. **Classificação:**
   ```bash
   python classify_docs_v3.py
   ```

4. **Conversão para CSV:**
   ```bash
   python convert_to_csv_v2.py
   ```

5. **Seleção Manual:**
   - Editar `curadoria.csv` manualmente
   - Adicionar colunas `NOTA`, `RAG GOLD`, `RAG SILVER`
   - Salvar como `selecao_rag.csv`

6. **Geração de Datasets:**
   ```bash
   python build_datasets.py
   ```

7. **Geração de Embeddings:**
   ```bash
   python create_embeddings.py
   ```

8. **Importação para Banco:**
   ```bash
   python import_embeddings_supabase.py
   ```

---

## Tratamento de Erros

### Erros Comuns

1. **Arquivo não encontrado:**
   - Verificar se o arquivo de entrada existe
   - Verificar caminhos relativos

2. **Erro de API OpenAI:**
   - Verificar variável de ambiente `OPENAI_API_KEY`
   - Verificar rate limits
   - Scripts têm retry automático

3. **Erro de conexão com banco:**
   - Verificar credenciais em `DB_CONFIG`
   - Verificar conectividade de rede
   - Verificar se extensão pgvector está habilitada

### Logs

Todos os scripts geram logs no console indicando:
- Progresso do processamento
- Erros encontrados
- Estatísticas finais

---

## Performance

### Tempos Estimados (dependem do volume)

- **Extração:** ~1-2 min por 1000 documentos
- **Filtragem:** ~10-30 segundos
- **Classificação:** ~1-2 min por documento (sequencial)
- **Conversão CSV:** ~5-10 segundos
- **Geração de Datasets:** ~5-10 segundos
- **Embeddings:** ~10-30 segundos por 1000 chunks
- **Importação:** ~1-2 min por 10.000 embeddings

### Otimizações Possíveis

- Paralelizar classificação (com cuidado com rate limits)
- Usar batch API da OpenAI para classificação
- Otimizar queries de banco de dados
- Usar processamento assíncrono

