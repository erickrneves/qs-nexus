# Guia de Upload e Processamento de Arquivos

Este guia explica como fazer upload de arquivos e o que esperar em cada etapa do processamento.

## Tipos de Arquivos Suportados

O sistema aceita 3 tipos de arquivos:

### 📄 Documentos de Texto
- **Formatos**: PDF, DOCX, DOC, TXT
- **Uso**: Contratos, pareceres, petições, documentos jurídicos
- **Tamanho**: Mínimo 300 palavras, máximo 1.000.000 palavras

### 💼 SPED (Arquivos Contábeis/Fiscais)
- **Formatos**: TXT (arquivos SPED)
- **Tipos**: ECD, ECF, EFD-ICMS/IPI, EFD-Contribuições
- **Tamanho máximo**: 50 MB

### 📊 CSV (Planilhas)
- **Formatos**: CSV, TXT (com delimitadores)
- **Uso**: Dados tabulares, relatórios, exportações
- **Limite**: 10.000 linhas por arquivo

---

## Fluxo de Processamento

### Documentos de Texto (PDF/DOCX/TXT)

#### Etapa 1: Upload (0-10%)
- Arquivo é enviado ao servidor
- Sistema calcula hash SHA256 para prevenir duplicatas
- Valida extensão e tamanho do arquivo

**Tempo estimado**: 1-5 segundos

#### Etapa 2: Conversão para Markdown (10-20%)
- PDF → texto + estrutura preservada
- DOCX → conversão com formatação
- TXT → leitura direta
- Conta palavras para validação

**Tempo estimado**: 5-30 segundos (depende do tamanho)

#### Etapa 3: Filtro de Tamanho (20-40%)
- Verifica se documento tem tamanho adequado
- Rejeita se muito pequeno (< 300 palavras)
- Rejeita se muito grande (> 1.000.000 palavras)

**Tempo estimado**: < 1 segundo

#### Etapa 4: Classificação com IA (40-60%)
- Inteligência Artificial analisa o documento
- Identifica tipo (petição, contrato, parecer, etc)
- Extrai metadados estruturados
- Gera resumo otimizado

**Tempo estimado**: 10-30 segundos
**Custo**: ~$0.001 - $0.01 (depende do modelo)

#### Etapa 5: Geração de Chunks (60-75%)
- Divide documento em pedaços menores
- Cada chunk tem ~800 tokens
- Preserva contexto semântico

**Tempo estimado**: 2-10 segundos

#### Etapa 6: Geração de Embeddings (75-90%)
- Cria representações vetoriais (embeddings)
- Cada chunk vira um vetor de 1536 dimensões
- Permite busca semântica

**Tempo estimado**: 5-30 segundos (depende do número de chunks)

#### Etapa 7: Salvamento (90-100%)
- Salva documento processado no banco
- Armazena chunks com vetores
- Disponibiliza para busca

**Tempo estimado**: 2-5 segundos

**⏱️ Tempo total**: 25 segundos a 2 minutos

---

### SPED (Arquivos Contábeis)

#### Etapa 1: Upload (0-10%)
- Arquivo SPED enviado
- Validação de formato (.txt)
- Cálculo de hash

**Tempo estimado**: 1-5 segundos

#### Etapa 2: Parse do Arquivo (10-40%)
- Lê registros linha por linha
- Extrai informações estruturadas:
  - Plano de contas (C050)
  - Saldos contábeis (I150/I155)
  - Lançamentos (I200)
  - Partidas (I250)

**Tempo estimado**: 30 segundos a 3 minutos
**Velocidade**: ~3-5 MB/minuto

#### Etapa 3: Salvamento em Banco de Dados (40-70%)
- Insere contas, saldos e lançamentos
- Preserva relacionamentos
- Cria estrutura hierárquica

**Tempo estimado**: 20 segundos a 2 minutos

#### Etapa 4: Classificação com IA (70-95%)
- Analisa dados contábeis
- Identifica riscos e qualidade
- Gera resumo executivo

**Tempo estimado**: 10-20 segundos

#### Etapa 5: Chunking Contábil (95-97%)
- Cria chunks por conta contábil
- Gera resumos de demonstrações financeiras
- Agrupa informações relacionadas

**Tempo estimado**: 5-15 segundos

#### Etapa 6: Geração de Embeddings (97-99%)
- Cria vetores para busca
- Permite consultas contábeis via linguagem natural

**Tempo estimado**: 10-30 segundos

#### Etapa 7: Finalização (99-100%)
- Confirma processamento
- Envia notificação

**Tempo estimado**: 1 segundo

**⏱️ Tempo total**: 1-8 minutos

---

### CSV (Planilhas)

#### Etapa 1: Upload (0-10%)
- Arquivo CSV enviado
- Validação de formato

**Tempo estimado**: 1-3 segundos

#### Etapa 2: Parse do Arquivo (10-30%)
- Detecta delimitador automaticamente (`,` `;` `\t` `|`)
- Detecta encoding (UTF-8, Latin1, etc)
- Identifica cabeçalhos
- Lê linhas (máximo 10.000)

**Tempo estimado**: 5-20 segundos

#### Etapa 3: Salvamento em Banco (30-45%)
- Insere dados em tabelas
- Preserva tipos de dados

**Tempo estimado**: 5-15 segundos

#### Etapa 4: Análise de Estrutura (45-60%)
- Analisa colunas (tipos, valores únicos)
- Calcula estatísticas (min, max, média)
- Detecta dados ausentes
- Gera markdown estruturado

**Tempo estimado**: 3-10 segundos

#### Etapa 5: Classificação com IA (60-75%)
- Identifica tipo de dados (vendas, estoque, etc)
- Avalia qualidade dos dados
- Sugere possíveis usos

**Tempo estimado**: 10-20 segundos

#### Etapa 6: Geração de Chunks (75-85%)
- Divide informações em chunks
- Preserva contexto de colunas

**Tempo estimado**: 2-5 segundos

#### Etapa 7: Geração de Embeddings (85-100%)
- Cria vetores para busca
- Permite consultas via linguagem natural

**Tempo estimado**: 5-15 segundos

**⏱️ Tempo total**: 30 segundos a 1,5 minutos

---

## Interpretando Resultados

### Status de Processamento

- **⏳ Aguardando**: Arquivo na fila de processamento
- **🔄 Processando**: Em processamento ativo
- **✅ Concluído**: Processamento bem-sucedido
- **❌ Falhou**: Erro no processamento

### Mensagens Comuns

#### ✅ Sucesso
- "Conversão concluída"
- "Classificação concluída"
- "Embeddings gerados"
- "Processamento RAG concluído"

#### ⚠️ Avisos
- "Arquivo já processado anteriormente" (duplicata detectada)
- "Truncamento aplicado" (documento muito longo, foi cortado)
- "Chunks truncados" (alguns pedaços eram muito grandes)

#### ❌ Erros
- "Muito pequeno: 150 palavras (mínimo: 300)" → Documento rejeitado
- "Arquivo muito grande: 52 MB (máximo: 50 MB)" → Excede limite
- "Formato inválido" → Tipo de arquivo não suportado
- "Erro ao processar arquivo" → Problema técnico (contate suporte)

---

## Troubleshooting

### Problema: Upload falha imediatamente

**Causas possíveis**:
- Arquivo muito grande
- Formato não suportado
- Conexão instável

**Solução**:
1. Verifique o tamanho do arquivo
2. Confirme a extensão (.pdf, .docx, .txt, .csv)
3. Tente novamente com conexão estável

### Problema: Processamento travado em uma etapa

**Causas possíveis**:
- Arquivo corrompido
- Estrutura muito complexa
- Limite de API excedido

**Solução**:
1. Aguarde 2-3 minutos
2. Atualize a página
3. Se persistir, faça upload novamente

### Problema: "Classificação retornou dados vazios"

**Causas possíveis**:
- Documento sem conteúdo relevante
- Muitas imagens (PDF)
- Texto ilegível

**Solução**:
1. Verifique se o documento tem texto
2. Para PDFs com imagens, use OCR antes
3. Tente converter para outro formato

### Problema: CSV não reconhece colunas

**Causas possíveis**:
- Delimitador não detectado
- Arquivo sem cabeçalho
- Encoding incorreto

**Solução**:
1. Especifique o delimitador manualmente
2. Marque "Sem cabeçalho" se aplicável
3. Converta para UTF-8 antes do upload

---

## Dicas de Performance

### Para Documentos Grandes (> 100 páginas)
- Aguarde 1-2 minutos de processamento
- Evite múltiplos uploads simultâneos
- Prefira horários de menor uso

### Para Lotes de Arquivos
- Faça upload em grupos de 5-10 arquivos
- Aguarde conclusão antes do próximo lote
- Use organizações separadas para projetos diferentes

### Para SPED Grandes (> 20 MB)
- Tempo de processamento: 5-10 minutos
- Mantenha a aba aberta durante processamento
- Você receberá notificação ao concluir

---

## Próximos Passos

Após o processamento bem-sucedido:

1. **Busque documentos** usando linguagem natural
2. **Visualize chunks** gerados para cada arquivo
3. **Explore metadados** extraídos pela IA
4. **Use no Chat RAG** para fazer perguntas sobre os dados

---

## Suporte

Se encontrar problemas não listados aqui:
1. Verifique o console do navegador (F12) para erros
2. Anote a mensagem de erro exata
3. Entre em contato com o suporte técnico

