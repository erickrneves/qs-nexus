# Documentação do Projeto de Curadoria de Documentos Jurídicos

Este projeto implementa um pipeline completo para processar, classificar e preparar documentos jurídicos (petições, recursos, procurações, etc.) para uso em um sistema RAG (Retrieval-Augmented Generation).

## Objetivo

O objetivo principal é criar um sistema RAG que sirva como base de conhecimento para treinar um agente de IA a gerar documentos jurídicos. Os documentos DOCX servem como exemplos/templates de como um documento jurídico deve ser estruturado.

## Estrutura do Projeto

O projeto está organizado em pastas por área de direito:
- `01. Trabalhista/` até `25. Contratos/`
- Cada pasta contém documentos DOCX organizados por tipo de peça jurídica

## Pipeline de Processamento

O pipeline atual segue os seguintes passos:

### 1. Extração de Documentos (`extract_docs.py`)

**Arquivo de entrada:** Documentos DOCX nas pastas do projeto  
**Arquivo de saída:** `docs_raw.jsonl`

**O que faz:**
- Varre recursivamente todas as subpastas procurando arquivos `.docx`
- Extrai o texto de cada documento usando a biblioteca `python-docx`
- Gera um arquivo JSONL onde cada linha contém:
  - `id`: nome do arquivo
  - `path`: caminho completo do arquivo
  - `words`: contagem de palavras
  - `text`: conteúdo extraído do documento

**Uso:**
```bash
python extract_docs.py
```

### 2. Filtragem de Documentos (`filter_docs.py`)

**Arquivo de entrada:** `docs_raw.jsonl`  
**Arquivo de saída:** `docs_filtered.jsonl`

**O que faz:**
- Remove outliers (documentos muito pequenos ou muito grandes)
- Critérios de filtragem:
  - **Mínimo:** 300 palavras (documentos muito pequenos são descartados)
  - **Máximo:** 25.000 palavras (documentos muito grandes são descartados)
- Mantém apenas documentos dentro desses limites

**Uso:**
```bash
python filter_docs.py
```

### 3. Classificação de Documentos (`classify_docs_v3.py`)

**Arquivo de entrada:** `docs_filtered.jsonl`  
**Arquivo de saída:** `classification_results.jsonl`

**O que faz:**
- Utiliza a API da OpenAI (GPT-4o-mini) para classificar cada documento
- Para cada documento, extrai:
  - `tipo_documento`: peticao_inicial | contestacao | recurso | parecer | contrato | modelo_generico | outro
  - `area_direito`: civil | trabalhista | tributario | empresarial | consumidor | penal | administrativo | previdenciario | outro
  - `modelo_ou_peca_real`: modelo | peca_real
  - `qualidade_clareza`: nota de 1 a 10
  - `qualidade_estrutura`: nota de 1 a 10
  - `risco`: nota de 1 a 5 (1 = baixíssimo, 5 = alto risco/teses frágeis)
  - `resumo`: resumo de até 2 linhas do conteúdo

**Características:**
- Processa documentos sequencialmente
- Suporta retomada (não reprocessa documentos já classificados)
- Limita o texto enviado a 12.000 caracteres por documento
- Tratamento de erros com retry automático

**Uso:**
```bash
python classify_docs_v3.py
```

### 4. Conversão para CSV (`convert_to_csv_v2.py`)

**Arquivo de entrada:** `classification_results.jsonl`  
**Arquivo de saída:** `curadoria.csv`

**O que faz:**
- Converte o JSONL de classificação para formato CSV
- Colunas geradas:
  - documento_id
  - tipo_documento
  - area_direito
  - modelo_ou_peca_real
  - qualidade_clareza
  - qualidade_estrutura
  - risco
  - resumo

**Uso:**
```bash
python convert_to_csv_v2.py
```

### 5. Seleção para RAG (`selecao_rag.csv`)

**Arquivo de entrada:** `curadoria.csv` (processado manualmente)  
**Arquivo de saída:** `selecao_rag.csv`

**O que faz:**
- Arquivo CSV manualmente editado com colunas adicionais:
  - `NOTA`: nota calculada (baseada em qualidade_clareza, qualidade_estrutura, risco)
  - `RAG GOLD`: indicação se o documento deve ser usado no dataset GOLD
  - `RAG SILVER`: indicação se o documento deve ser usado no dataset SILVER

### 6. Geração de Datasets (`build_datasets.py`)

**Arquivo de entrada:** `selecao_rag.csv`  
**Arquivos de saída:** 
- `dataset_gold.csv`
- `dataset_silver.csv`
- `dataset_curado.csv` (GOLD + SILVER)

**O que faz:**
- Lê o arquivo `selecao_rag.csv`
- Classifica documentos baseado na coluna `NOTA`:
  - **GOLD:** nota > 60
  - **SILVER:** 56 ≤ nota < 60
- Gera três arquivos CSV separados
- Adiciona colunas `RAG_GOLD` e `RAG_SILVER` automaticamente

**Uso:**
```bash
python build_datasets.py
```

### 7. Geração de Embeddings (`create_embeddings.py`)

**Arquivo de entrada:** `docs_filtered.jsonl` (ou arquivo similar com documentos selecionados)  
**Arquivo de saída:** `embeddings.jsonl`

**O que faz:**
- Divide cada documento em chunks de até 4.000 caracteres
- Gera embeddings usando o modelo `text-embedding-3-small` da OpenAI
- Processa em batches de 64 chunks por requisição
- Cada linha do JSONL contém:
  - `doc_id`: ID do documento original
  - `chunk_index`: índice do chunk no documento
  - `embedding`: vetor de embedding (1536 dimensões)

**Uso:**
```bash
python create_embeddings.py
```

### 8. Importação para Banco de Dados (`import_embeddings_supabase.py`)

**Arquivo de entrada:** `embeddings.jsonl`  
**Destino:** Banco de dados Supabase (PostgreSQL com pgvector)

**O que faz:**
- Conecta ao banco Supabase
- Cria a tabela `lw_embeddings` se não existir:
  - `doc_id` (text)
  - `chunk_index` (integer)
  - `content` (text)
  - `embedding` (vector(1536))
  - `created_at` (timestamptz)
- Importa embeddings em batches de 500 registros
- Converte arrays de embeddings para formato pgvector

**Uso:**
```bash
python import_embeddings_supabase.py
```

**Nota:** Este script está configurado para Supabase, mas o objetivo é migrar para o banco Neon do projeto principal.

## Arquivos de Dados

### Arquivos Intermediários (JSONL)
- `docs_raw.jsonl`: Todos os documentos DOCX convertidos para texto
- `docs_filtered.jsonl`: Documentos filtrados (sem outliers)
- `classification_results.jsonl`: Resultados da classificação pela OpenAI
- `embeddings.jsonl`: Chunks com seus embeddings

### Arquivos de Classificação (CSV)
- `curadoria.csv`: Classificação básica dos documentos
- `selecao_rag.csv`: Classificação com seleção manual para RAG
- `dataset_gold.csv`: Documentos de alta qualidade (nota > 60)
- `dataset_silver.csv`: Documentos de qualidade média (56 ≤ nota < 60)
- `dataset_curado.csv`: Documentos curados (GOLD + SILVER)

## Lições Aprendidas

Conforme documentado pelo colaborador anterior:

1. **Deveria ter aplicado markdown a tudo antes de rodar**
   - Os documentos deveriam ser convertidos para markdown antes do processamento
   - Isso facilitaria o uso pelo agente de IA que gera documentos em markdown

2. **Deveria ter escolhido melhor os critérios de classificação**
   - Os critérios atuais são: doc_id, tipo_documento, area_direito, modelo_ou_peca_real, qualidade_clareza, qualidade_estrutura, risco, resumo, nota
   - Alguns critérios podem ser melhorados ou adicionados

## Próximos Passos (Planejados)

1. **Melhorar a classificação dos documentos**
   - Refinar os critérios de classificação
   - Melhorar o prompt de classificação

2. **Converter para Markdown antes do processamento**
   - Adicionar etapa de conversão DOCX → Markdown
   - Processar markdown em vez de texto puro

3. **Usar AI SDK para embeddings**
   - Migrar de OpenAI SDK direto para AI SDK
   - Seguir documentação: https://ai-sdk.dev/docs/ai-sdk-core/embeddings

4. **Integrar com banco de dados Neon**
   - Criar migrações Drizzle para tabelas de RAG
   - Habilitar extensão pgvector no Neon
   - Migrar importação de embeddings para o sistema principal

## Dependências

Principais bibliotecas Python utilizadas:
- `python-docx`: Extração de texto de arquivos DOCX
- `openai`: API da OpenAI para classificação e embeddings
- `tqdm`: Barras de progresso
- `psycopg2`: Conexão com PostgreSQL
- `csv`: Manipulação de arquivos CSV
- `json`: Manipulação de JSON/JSONL

## Estrutura de Diretórios

```
legalwise-curadoria-modelos/
├── docs/                          # Documentação (esta pasta)
├── 01. Trabalhista/               # Documentos trabalhistas
├── 04. Tributário/                # Documentos tributários
├── 07. Consumidor/                # Documentos de direito do consumidor
├── 08. Previdenciário/            # Documentos previdenciários
├── 13. Civil/                     # Documentos de direito civil
├── 14. Comercial/                  # Documentos comerciais
├── 18. Empresarial e Societário/  # Documentos empresariais
├── 25. Contratos/                  # Contratos diversos
├── extract_docs.py                # Script de extração
├── filter_docs.py                 # Script de filtragem
├── classify_docs_v3.py            # Script de classificação
├── convert_to_csv_v2.py          # Conversão para CSV
├── build_datasets.py              # Geração de datasets
├── create_embeddings.py           # Geração de embeddings
├── import_embeddings_supabase.py  # Importação para Supabase
└── [arquivos de dados .jsonl e .csv]
```

