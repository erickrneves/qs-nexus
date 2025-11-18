# Guia Rápido de Início

## Pré-requisitos

1. **Python 3.9+**
2. **Bibliotecas Python:**
   ```bash
   pip install python-docx openai tqdm psycopg2-binary
   ```
3. **Chave da API OpenAI:**
   ```bash
   export OPENAI_API_KEY="sua-chave-aqui"
   ```

## Execução Rápida

### 1. Extrair Documentos

```bash
python extract_docs.py
```

**Resultado:** `docs_raw.jsonl`

### 2. Filtrar Documentos

```bash
python filter_docs.py
```

**Resultado:** `docs_filtered.jsonl`

### 3. Classificar Documentos

```bash
# Certifique-se de ter OPENAI_API_KEY configurada
python classify_docs_v3.py
```

**Resultado:** `classification_results.jsonl`

**Tempo estimado:** ~1-2 minutos por documento (processamento sequencial)

### 4. Converter para CSV

```bash
python convert_to_csv_v2.py
```

**Resultado:** `curadoria.csv`

### 5. Seleção Manual

1. Abra `curadoria.csv` em Excel ou editor de planilhas
2. Adicione colunas:
   - `NOTA`: Calcule baseado em qualidade_clareza, qualidade_estrutura, risco
   - `RAG GOLD`: "SIM" ou "NÃO" (nota > 60)
   - `RAG SILVER`: "SIM" ou "NÃO" (56 ≤ nota < 60)
3. Salve como `selecao_rag.csv`

### 6. Gerar Datasets

```bash
python build_datasets.py
```

**Resultado:** 
- `dataset_gold.csv`
- `dataset_silver.csv`
- `dataset_curado.csv`

### 7. Gerar Embeddings

```bash
python create_embeddings.py
```

**Resultado:** `embeddings.jsonl`

**Tempo estimado:** ~10-30 segundos por 1000 chunks

### 8. Importar para Banco (Opcional)

```bash
# Edite import_embeddings_supabase.py com suas credenciais
python import_embeddings_supabase.py
```

## Pipeline Completo (Script Único)

Você pode criar um script que executa tudo:

```bash
#!/bin/bash
python extract_docs.py && \
python filter_docs.py && \
python classify_docs_v3.py && \
python convert_to_csv_v2.py && \
echo "Agora edite curadoria.csv e salve como selecao_rag.csv" && \
python build_datasets.py && \
python create_embeddings.py
```

## Verificação Rápida

### Verificar se arquivos foram gerados

```bash
ls -lh *.jsonl *.csv
```

### Verificar número de documentos

```bash
# Contar linhas em JSONL
wc -l docs_filtered.jsonl

# Contar linhas em CSV (menos header)
tail -n +2 curadoria.csv | wc -l
```

### Verificar um documento

```python
import json

# Ler primeiro documento
with open("docs_filtered.jsonl", "r") as f:
    first_line = f.readline()
    doc = json.loads(first_line)
    print(f"ID: {doc['id']}")
    print(f"Palavras: {doc['words']}")
    print(f"Texto (primeiros 200 chars): {doc['text'][:200]}")
```

## Troubleshooting

### Erro: "OPENAI_API_KEY not found"

```bash
export OPENAI_API_KEY="sua-chave"
# ou crie arquivo .env e use python-dotenv
```

### Erro: "ModuleNotFoundError"

```bash
pip install python-docx openai tqdm psycopg2-binary
```

### Erro: "File not found"

Certifique-se de estar no diretório correto:
```bash
cd /caminho/para/legalwise-curadoria-modelos
```

### Classificação muito lenta

- Processamento é sequencial por design (evita rate limits)
- Pode levar horas para grandes volumes
- Script suporta retomada (não reprocessa documentos já classificados)

### Erro ao importar para banco

1. Verifique credenciais em `import_embeddings_supabase.py`
2. Verifique se extensão pgvector está habilitada:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Verifique conectividade de rede

## Próximos Passos

Após executar o pipeline:

1. **Revisar datasets gerados**
   - Verificar qualidade dos documentos GOLD/SILVER
   - Ajustar critérios se necessário

2. **Preparar para Markdown**
   - Planejar conversão DOCX → Markdown
   - Atualizar pipeline

3. **Integrar com sistema principal**
   - Criar schema Drizzle
   - Migrar importação para Neon
   - Integrar com AI SDK

## Dicas

- **Backup:** Faça backup dos arquivos JSONL intermediários
- **Incremental:** Scripts suportam retomada (não reprocessam dados existentes)
- **Monitoramento:** Acompanhe logs no console para identificar problemas
- **Validação:** Valide dados antes de prosseguir para próxima etapa

## Recursos Adicionais

- [README.md](./README.md) - Visão geral completa
- [ARQUITETURA.md](./ARQUITETURA.md) - Detalhes arquiteturais
- [SCRIPTS.md](./SCRIPTS.md) - Documentação detalhada dos scripts
- [DADOS.md](./DADOS.md) - Estrutura de dados

