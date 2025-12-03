# Glossário Técnico Simplificado

Termos técnicos explicados de forma simples.

---

## A

### API (Application Programming Interface)
Forma que sistemas diferentes conversam entre si. Como um garçom que leva seu pedido à cozinha.

### Autenticação
Processo de verificar quem você é (login com email e senha).

---

## B

### Banco de Dados
Local onde guardamos todas as informações de forma organizada. Como um arquivo gigante bem organizado.

### Batch Processing
Processar várias coisas de uma vez, em lotes. Como lavar várias roupas juntas em vez de uma por uma.

---

## C

### Chunking / Chunks
Dividir um documento grande em pedaços menores. Como fatiar um bolo em pedaços para servir.

**Exemplo**: Um documento de 100 páginas vira 200 chunks de ~800 tokens cada.

**Por que fazemos isso?**
- Modelos de IA têm limite de quanto texto processam de uma vez
- Busca fica mais precisa (encontra o pedaço exato)
- Processamento fica mais rápido

### Classificação
Processo de identificar o tipo e características de um documento usando IA.

**O que a IA extrai:**
- Tipo de documento (contrato, petição, parecer, etc)
- Área (tributário, trabalhista, etc)
- Complexidade (simples, médio, complexo)
- Tags relevantes
- Resumo

### CSV (Comma-Separated Values)
Formato de planilha simples onde colunas são separadas por vírgula (ou ponto-e-vírgula).

```csv
Nome,Idade,Cidade
João,25,São Paulo
Maria,30,Rio de Janeiro
```

---

## D

### Delimitador
Caractere que separa colunas em um arquivo CSV. Pode ser:
- `,` (vírgula) - mais comum
- `;` (ponto-e-vírgula) - comum no Brasil
- `\t` (tab/tabulação)
- `|` (pipe)

### Demonstrações Financeiras
Relatórios contábeis principais:
- Balanço Patrimonial (BP)
- Demonstração do Resultado (DRE)
- Fluxo de Caixa (DFC)

---

## E

### Embedding / Vetor
Representação numérica de um texto que captura seu significado.

**Exemplo simplificado:**
- Texto: "O gato subiu no telhado"
- Vetor: [0.23, -0.45, 0.67, ... 1533 números mais]

**Por que usamos:**
- Permite buscar por significado, não só palavras exatas
- "cachorro" e "cão" têm vetores similares
- Busca encontra textos relacionados mesmo sem palavras iguais

### Encoding
Sistema de caracteres usado em um arquivo. Tipos comuns:
- **UTF-8**: Universal, suporta acentos e emojis
- **Latin1 / ISO-8859-1**: Antigo, acentuação limitada
- **Windows-1252**: Usado em Windows antigos

### ECD (Escrituração Contábil Digital)
Arquivo SPED com escrituração contábil completa da empresa.

**Contém:**
- Plano de contas
- Lançamentos contábeis
- Saldos de contas
- Balancetes

### ECF (Escrituração Contábil Fiscal)
Arquivo SPED com informações fiscais e apuração de tributos.

### EFD (Escrituração Fiscal Digital)
Arquivo SPED com informações de ICMS, IPI ou Contribuições (PIS/COFINS).

---

## H

### Hash
"Impressão digital" única de um arquivo. Mesmo conteúdo = mesmo hash.

**Exemplo:**
- Arquivo: "contrato.pdf"
- Hash: `a3d5f6e8...` (64 caracteres)

**Uso**: Detectar duplicatas e verificar integridade.

---

## I

### Ingestão
Processo completo de receber e processar um arquivo novo no sistema.

**Etapas:**
1. Upload
2. Validação
3. Conversão
4. Salvamento

---

## J

### JSONB
Formato de dados flexível que guarda informações estruturadas.

**Exemplo:**
```json
{
  "tipo": "contrato",
  "area": "trabalhista",
  "tags": ["CLT", "rescisão"],
  "qualidade": 85
}
```

---

## L

### Lançamento Contábil
Registro de uma operação financeira no sistema contábil.

**Exemplo:**
- Débito: Caixa - R$ 1.000
- Crédito: Vendas - R$ 1.000

---

## M

### Markdown
Formato de texto simples que vira formatação.

**Exemplo:**
```markdown
# Título Grande
## Título Médio
**Negrito**
*Itálico*
- Item de lista
```

### Metadados
"Dados sobre dados". Informações descritivas sobre um arquivo.

**Exemplo para documento:**
- Nome do arquivo
- Tamanho
- Data de criação
- Tipo de documento
- Tags

### Multi-tenant / Multi-tenancy
Sistema onde cada organização tem seus dados isolados. Como apartamentos no mesmo prédio.

---

## N

### Normalização
Converter dados de formatos diferentes para um formato padrão.

**Exemplo:**
- PDF → Markdown
- DOCX → Markdown
- TXT → Markdown

**Por que**: Facilita processamento uniforme.

---

## O

### Organização
Grupo/empresa no sistema. Cada organização vê apenas seus próprios dados.

---

## P

### Parse / Parsing
Ler e interpretar um arquivo estruturado.

**Exemplo - CSV:**
```
Nome,Idade
João,25
```
↓ Parse ↓
```
{
  headers: ["Nome", "Idade"],
  rows: [
    { Nome: "João", Idade: 25 }
  ]
}
```

### Pipeline
Sequência de etapas de processamento.

**Exemplo - Pipeline de Documentos:**
```
Upload → Conversão → Filtro → Classificação → Chunks → Embeddings → Salvamento
```

### Plano de Contas
Lista hierárquica de todas as contas contábeis de uma empresa.

**Exemplo:**
```
1. ATIVO
  1.1 Circulante
    1.1.1 Caixa
    1.1.2 Bancos
  1.2 Não Circulante
    1.2.1 Imobilizado
```

---

## R

### RAG (Retrieval-Augmented Generation)
Sistema que busca informações relevantes antes de gerar uma resposta.

**Como funciona:**
1. Você pergunta: "Qual o valor do contrato X?"
2. Sistema busca chunks relacionados a "contrato X"
3. IA lê os chunks encontrados
4. IA responde com base nos chunks

**Vantagem**: Respostas baseadas em seus documentos reais.

### Registro SPED
Linha em um arquivo SPED. Começa com código do tipo.

**Exemplo:**
```
|0000|LeiaFiscalCD|01012023|31012023|...
|C050|1.01.01|Caixa|S|...
|I155|1.01.01|5000.00|D|10000.00|...
```

---

## S

### Schema / Esquema
Estrutura que define quais campos um dado deve ter.

**Exemplo - Schema de Documento:**
```
{
  titulo: obrigatório, texto
  tipo: obrigatório, um de [contrato, petição, etc]
  tags: opcional, lista de textos
  qualidade: obrigatório, número de 0-100
}
```

### SPED (Sistema Público de Escrituração Digital)
Conjunto de arquivos digitais que substituem livros contábeis e fiscais.

**Tipos principais:**
- ECD: Contabilidade
- ECF: Fiscal
- EFD-ICMS/IPI: ICMS e IPI
- EFD-Contribuições: PIS e COFINS

### Status
Estado atual de um processamento.

- `pending`: Na fila, aguardando
- `processing`: Sendo processado agora
- `completed`: Concluído com sucesso
- `failed`: Falhou com erro

---

## T

### Template
Versão processada e classificada de um documento.

**Contém:**
- Markdown original
- Metadados extraídos pela IA
- Referência aos chunks
- Informações de processamento

### Token
Unidade básica de texto para IA. ~4 caracteres = 1 token.

**Exemplo:**
- "Olá, tudo bem?" ≈ 5 tokens
- 1 página de texto ≈ 400-600 tokens

**Limites:**
- Chunks: máximo 800 tokens
- Embeddings: máximo 8.192 tokens

### Truncamento
Cortar um texto que excede o limite de tamanho.

**Exemplo:**
- Texto original: 10.000 tokens
- Limite: 8.000 tokens
- Resultado: Primeiros 8.000 tokens

---

## U

### Upload
Enviar um arquivo do seu computador para o servidor.

---

## V

### Validação
Verificar se dados estão corretos e completos.

**Exemplo - Validação de Upload:**
- ✓ Arquivo tem extensão permitida?
- ✓ Tamanho está dentro do limite?
- ✓ Não é duplicata?

### Vetor / Embedding
Ver **Embedding** acima.

---

## W

### Webhook
Notificação automática quando algo acontece.

**Exemplo:**
- Arquivo terminou de processar → Sistema envia notificação

---

## Conceitos Importantes

### Busca Semântica vs Busca por Palavras

**Busca por Palavras (tradicional):**
- Procura: "cachorro"
- Encontra: apenas textos com "cachorro"
- Não encontra: "cão", "pet", "animal de estimação"

**Busca Semântica (com embeddings):**
- Procura: "cachorro"
- Encontra: textos sobre "cão", "pet", "animal", mesmo sem a palavra exata
- Entende significado, não só palavras

### Por que Markdown?

Markdown é escolhido porque:
1. ✅ Simples e legível
2. ✅ Preserva formatação (títulos, listas, etc)
3. ✅ Funciona bem com IA
4. ✅ Fácil de converter para outros formatos
5. ✅ Leve e eficiente

### Por que Chunks?

1. **Limite de Tokens**: IA só processa até 8.192 tokens por vez
2. **Precisão**: Busca encontra trecho exato, não documento inteiro
3. **Performance**: Processar pedaços pequenos é mais rápido
4. **Custo**: Menos tokens = menor custo de processamento

---

## Perguntas Frequentes

### Qual a diferença entre Template e Chunk?

- **Template**: Documento completo processado (metadados + markdown)
- **Chunk**: Pedaço pequeno do template (~800 tokens)

**Analogia:**
- Template = Livro inteiro
- Chunks = Páginas do livro

### Embeddings são necessários?

Sim, para:
- ✅ Busca semântica (por significado)
- ✅ Chat RAG (respostas baseadas em documentos)
- ✅ Recomendações automáticas

Sem embeddings, só busca por palavras exatas funciona.

### Por que alguns arquivos são rejeitados?

Arquivos muito pequenos (< 300 palavras) não têm conteúdo suficiente para:
- Classificação confiável
- Geração de chunks úteis
- Busca semântica efetiva

**Solução**: Combine arquivos pequenos ou adicione mais conteúdo.

---

## Recursos Adicionais

- [Guia de Upload](./upload-guide.md) - Como fazer upload e interpretar resultados
- [Arquitetura do Sistema](../architecture/ARQUITETURA.md) - Visão técnica completa

