# Índice da Documentação

Esta pasta contém toda a documentação do projeto de curadoria de documentos jurídicos.

## Documentos Principais

### [README.md](./README.md)
Visão geral completa do projeto, incluindo:
- Objetivo do projeto
- Estrutura do projeto
- Pipeline de processamento completo
- Arquivos de dados
- Lições aprendidas
- Próximos passos

### [QUICK_START.md](./QUICK_START.md)
Guia rápido para começar a usar o sistema:
- Pré-requisitos
- Execução passo a passo
- Troubleshooting básico
- Dicas práticas

## Documentação Técnica

### [ARQUITETURA.md](./ARQUITETURA.md)
Documentação arquitetural detalhada:
- Fluxo de dados
- Componentes do sistema
- Estrutura de dados
- Decisões de design
- Limitações atuais
- Melhorias planejadas

### [SCRIPTS.md](./SCRIPTS.md)
Documentação detalhada de cada script:
- Descrição de cada script
- Parâmetros e configuração
- Exemplos de uso
- Tratamento de erros
- Performance

### [DADOS.md](./DADOS.md)
Estrutura e formato dos dados:
- Schemas JSONL
- Formato CSV
- Estrutura do banco de dados
- Estatísticas típicas
- Validação de dados
- Utilitários de migração

## Como Usar Esta Documentação

1. **Começando:** Leia [QUICK_START.md](./QUICK_START.md)
2. **Entendendo o sistema:** Leia [README.md](./README.md)
3. **Profundidade técnica:** Consulte [ARQUITETURA.md](./ARQUITETURA.md)
4. **Usando scripts:** Veja [SCRIPTS.md](./SCRIPTS.md)
5. **Trabalhando com dados:** Consulte [DADOS.md](./DADOS.md)

## Estrutura do Projeto

```
lw-rag-system/              # Projeto principal
├── docs/                    # Esta pasta
│   ├── INDEX.md            # Este arquivo
│   ├── README.md           # Visão geral
│   ├── QUICK_START.md      # Guia rápido
│   ├── ARQUITETURA.md      # Arquitetura
│   ├── SCRIPTS.md          # Scripts
│   └── DADOS.md            # Estrutura de dados
├── extract_docs.py         # Scripts de processamento
├── filter_docs.py
├── classify_docs_v3.py
├── convert_to_csv_v2.py
├── build_datasets.py
├── create_embeddings.py
└── import_embeddings_supabase.py

list-docx/                  # Pasta separada com documentos DOCX
├── 01. Trabalhista/        # Documentos por área de direito
├── 04. Tributário/
├── 08. Previdenciário/
└── [outras pastas...]
```

**Localização dos documentos DOCX:**
- `/Users/william/development/legalwise/rag-system/list-docx`

## Contribuindo

Ao adicionar novos scripts ou modificar o pipeline:

1. Atualize [SCRIPTS.md](./SCRIPTS.md) com a documentação do novo script
2. Atualize [ARQUITETURA.md](./ARQUITETURA.md) se houver mudanças arquiteturais
3. Atualize [DADOS.md](./DADOS.md) se houver mudanças na estrutura de dados
4. Atualize [README.md](./README.md) se necessário

## Links Úteis

- [AI SDK Documentation](https://ai-sdk.dev/docs/ai-sdk-core/embeddings)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Drizzle ORM](https://orm.drizzle.team/)

