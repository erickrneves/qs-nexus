# Estrutura de Dados

## Formato JSONL

Todos os arquivos intermediários usam formato JSONL (JSON Lines), onde cada linha é um objeto JSON válido.

### Vantagens do JSONL
- Processamento linha por linha (não precisa carregar tudo em memória)
- Permite processamento incremental
- Fácil de validar e debugar
- Suporta streaming

### Exemplo de Leitura
```python
import json

with open("docs_filtered.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        doc = json.loads(line.strip())
        # processar doc
```

## Schemas de Dados

### docs_raw.jsonl / docs_filtered.jsonl

```json
{
  "id": "string",           // Nome do arquivo
  "path": "string",         // Caminho completo do arquivo
  "words": 1234,            // Contagem de palavras
  "text": "string"          // Texto extraído do DOCX
}
```

**Campos:**
- `id`: Identificador único (nome do arquivo)
- `path`: Caminho completo do arquivo original
- `words`: Número de palavras no documento
- `text`: Conteúdo textual extraído

### classification_results.jsonl

```json
{
  "id": "string",                    // ID do documento
  "tipo_documento": "string",        // peticao_inicial | contestacao | recurso | parecer | contrato | modelo_generico | outro
  "area_direito": "string",          // civil | trabalhista | tributario | empresarial | consumidor | penal | administrativo | previdenciario | outro
  "modelo_ou_peca_real": "string",   // modelo | peca_real
  "qualidade_clareza": 1-10,        // Nota de clareza
  "qualidade_estrutura": 1-10,       // Nota de estrutura
  "risco": 1-5,                      // Nível de risco (1=baixo, 5=alto)
  "resumo": "string"                  // Resumo de até 2 linhas
}
```

**Valores Possíveis:**

**tipo_documento:**
- `peticao_inicial`: Petição inicial
- `contestacao`: Contestação
- `recurso`: Recurso
- `parecer`: Parecer
- `contrato`: Contrato
- `modelo_generico`: Modelo genérico
- `outro`: Outro tipo

**area_direito:**
- `civil`: Direito Civil
- `trabalhista`: Direito Trabalhista
- `tributario`: Direito Tributário
- `empresarial`: Direito Empresarial
- `consumidor`: Direito do Consumidor
- `penal`: Direito Penal
- `administrativo`: Direito Administrativo
- `previdenciario`: Direito Previdenciário
- `outro`: Outra área

**modelo_ou_peca_real:**
- `modelo`: Documento modelo/template
- `peca_real`: Peça jurídica real

### embeddings.jsonl

```json
{
  "doc_id": "string",        // ID do documento original
  "chunk_index": 0,         // Índice do chunk no documento
  "embedding": [0.123, ...]  // Array de 1536 números (vetor de embedding)
}
```

**Características:**
- Cada documento pode ter múltiplos chunks
- `chunk_index` começa em 0
- `embedding` é um array de 1536 números (float)
- Modelo usado: `text-embedding-3-small`

## Formato CSV

### curadoria.csv

```csv
documento_id,tipo_documento,area_direito,modelo_ou_peca_real,qualidade_clareza,qualidade_estrutura,risco,resumo
```

**Colunas:**
- `documento_id`: ID do documento
- `tipo_documento`: Tipo do documento
- `area_direito`: Área de direito
- `modelo_ou_peca_real`: Tipo (modelo ou peça real)
- `qualidade_clareza`: Nota de 1 a 10
- `qualidade_estrutura`: Nota de 1 a 10
- `risco`: Nota de 1 a 5
- `resumo`: Resumo do documento

### selecao_rag.csv

Adiciona colunas ao `curadoria.csv`:

```csv
documento_id,tipo_documento,...,resumo,NOTA,RAG GOLD,RAG SILVER
```

**Colunas Adicionais:**
- `NOTA`: Nota calculada (pode usar vírgula como decimal: "56,25")
- `RAG GOLD`: "SIM" ou "NÃO" - indica se é dataset GOLD
- `RAG SILVER`: "SIM" ou "NÃO" - indica se é dataset SILVER

**Delimitador:**
- Pode ser vírgula (`,`) ou ponto-e-vírgula (`;`)
- Script `build_datasets.py` detecta automaticamente

### dataset_gold.csv, dataset_silver.csv, dataset_curado.csv

Mesma estrutura do `selecao_rag.csv`, mas filtrados:
- `dataset_gold.csv`: Apenas documentos com `RAG GOLD = "SIM"`
- `dataset_silver.csv`: Apenas documentos com `RAG SILVER = "SIM"`
- `dataset_curado.csv`: Documentos GOLD + SILVER

## Banco de Dados

### Tabela: lw_embeddings

```sql
CREATE TABLE lw_embeddings (
    doc_id      text,              -- ID do documento
    chunk_index integer,           -- Índice do chunk
    content     text,              -- Texto do chunk
    embedding   vector(1536),       -- Vetor de embedding (pgvector)
    created_at  timestamptz DEFAULT now()
);
```

**Índices Recomendados:**
```sql
-- Índice para busca por documento
CREATE INDEX idx_lw_embeddings_doc_id ON lw_embeddings(doc_id);

-- Índice para busca vetorial (HNSW)
CREATE INDEX idx_lw_embeddings_vector ON lw_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

**Operações de Busca:**
```sql
-- Busca por similaridade (cosine)
SELECT doc_id, chunk_index, content, 
       1 - (embedding <=> $1::vector) as similarity
FROM lw_embeddings
ORDER BY embedding <=> $1::vector
LIMIT 10;

-- Busca por documento
SELECT * FROM lw_embeddings 
WHERE doc_id = 'nome_arquivo.docx'
ORDER BY chunk_index;
```

## Estatísticas Típicas

### Volumes Esperados

- **Documentos brutos:** ~10.000-50.000 arquivos DOCX
- **Documentos filtrados:** ~80-90% dos brutos (após remoção de outliers)
- **Documentos classificados:** Mesmo número dos filtrados
- **Chunks por documento:** 1-10 (depende do tamanho)
- **Total de chunks:** ~50.000-200.000

### Tamanhos de Arquivo

- `docs_raw.jsonl`: ~500MB - 2GB
- `docs_filtered.jsonl`: ~450MB - 1.8GB
- `classification_results.jsonl`: ~10-50MB
- `embeddings.jsonl`: ~200MB - 1GB (depende do número de chunks)
- CSVs: ~5-20MB cada

### Dimensões de Embeddings

- **Modelo:** `text-embedding-3-small`
- **Dimensões:** 1536
- **Tipo:** Float32
- **Tamanho por embedding:** ~6KB (1536 * 4 bytes)

## Validação de Dados

### Verificar Integridade do JSONL

```python
import json

def validate_jsonl(filepath):
    errors = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                json.loads(line.strip())
            except json.JSONDecodeError as e:
                errors.append(f"Linha {i}: {e}")
    return errors
```

### Verificar Chunks

```python
import json
from collections import defaultdict

def check_chunks(filepath):
    doc_chunks = defaultdict(list)
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            chunk = json.loads(line)
            doc_chunks[chunk['doc_id']].append(chunk['chunk_index'])
    
    # Verificar se chunks são sequenciais
    for doc_id, indices in doc_chunks.items():
        indices.sort()
        expected = list(range(len(indices)))
        if indices != expected:
            print(f"AVISO: {doc_id} tem chunks não sequenciais")
```

## Migração de Dados

### Converter JSONL para CSV

```python
import json
import csv

def jsonl_to_csv(jsonl_file, csv_file):
    with open(jsonl_file, 'r', encoding='utf-8') as fin, \
         open(csv_file, 'w', newline='', encoding='utf-8') as fout:
        writer = csv.DictWriter(fout, fieldnames=['id', 'text'])
        writer.writeheader()
        for line in fin:
            doc = json.loads(line)
            writer.writerow({'id': doc['id'], 'text': doc['text']})
```

### Converter CSV para JSONL

```python
import csv
import json

def csv_to_jsonl(csv_file, jsonl_file):
    with open(csv_file, 'r', encoding='utf-8') as fin, \
         open(jsonl_file, 'w', encoding='utf-8') as fout:
        reader = csv.DictReader(fin)
        for row in reader:
            fout.write(json.dumps(row, ensure_ascii=False) + '\n')
```

