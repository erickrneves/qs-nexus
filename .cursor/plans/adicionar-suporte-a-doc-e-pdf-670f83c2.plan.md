<!-- 670f83c2-ff59-41df-a2c0-e61019a2ed97 e75f52cf-9d08-4c08-b784-521ab20b0ffa -->
# Plano: Adicionar Suporte a Arquivos .doc e .pdf

## Análise Atual

O sistema atualmente:

- ✅ Aceita apenas `.docx` em todos os pontos (upload, processamento, validações)
- ✅ Usa `mammoth` para converter DOCX → Markdown
- ❌ Não suporta `.doc` (formato binário antigo do Word)
- ❌ Não suporta `.pdf`

## Estratégia de Implementação

### 1. Bibliotecas Necessárias

**Estratégia Principal - Preservação de Formatação:**

- **Pandoc** (via CLI) - Ferramenta mais poderosa para preservar formatação ao converter para Markdown
  - Suporta `.doc` → Markdown (preserva formatação)
  - Suporta `.pdf` → Markdown (preserva estrutura, tabelas, títulos)
  - Suporta `.docx` → Markdown (já usado via mammoth, mas Pandoc pode ser melhor)
  - Requer instalação do sistema: `brew install pandoc` (macOS) ou `apt-get install pandoc` (Linux)

**Fallbacks (se Pandoc não disponível ou falhar):**

- **Para `.doc`**: `libreoffice` CLI para converter .doc → .docx, depois usar mammoth
- **Para `.pdf`**: `pdfjs-dist` (Mozilla) - melhor que pdf-parse para preservar estrutura
  - Alternativa: `pdf-parse` (mais simples, mas perde mais formatação)

**Wrapper Node.js para Pandoc:**

- `pandoc` (npm) - wrapper Node.js para executar Pandoc via CLI

### 2. Arquitetura Proposta

Criar um serviço unificado de conversão que:

- Detecta o tipo de arquivo pela extensão
- Roteia para o conversor apropriado
- Retorna sempre Markdown (formato canônico do sistema)
- Mantém compatibilidade com o fluxo existente

### 3. Arquivos a Modificar

#### Novos Arquivos:

- `lib/services/document-converter.ts` - Serviço unificado de conversão
- `lib/workers/document-converter-worker.ts` - Worker atualizado para múltiplos formatos

#### Arquivos a Atualizar:

- `lib/services/docx-converter.ts` - Refatorar para usar o novo serviço unificado
- `lib/workers/docx-converter-worker.ts` - Atualizar para suportar múltiplos formatos
- `lib/services/rag-processor.ts` - Atualizar mensagens de progresso
- `scripts/process-documents.ts` - Atualizar busca de arquivos e validações
- `app/api/upload/route.ts` - Aceitar .doc e .pdf
- `components/upload/file-upload.tsx` - Aceitar .doc e .pdf no frontend
- `app/api/documents/[id]/reprocess-full/route.ts` - Aceitar .doc e .pdf
- `app/(dashboard)/files/[id]/page.tsx` - Aceitar .doc e .pdf

### 4. Implementação Detalhada

#### Etapa 1: Instalar Dependências

```bash
npm install pdf-parse textract
# ou para .doc: usar libreoffice via CLI (requer instalação do sistema)
```

#### Etapa 2: Criar Serviço Unificado de Conversão

- Criar `lib/services/document-converter.ts` com funções:
  - `detectFileType(filePath: string): 'docx' | 'doc' | 'pdf'`
  - `convertToMarkdown(filePath: string): Promise<ConversionResult>`
  - `convertDocxToMarkdown(filePath: string)` - existente, manter
  - `convertDocToMarkdown(filePath: string)` - novo
  - `convertPdfToMarkdown(filePath: string)` - novo

#### Etapa 3: Atualizar Worker Thread

- Atualizar `lib/workers/docx-converter-worker.ts` para `document-converter-worker.ts`
- Suportar múltiplos formatos no worker
- Manter isolamento de processamento

#### Etapa 4: Atualizar Validações

- Remover validações hardcoded de `.docx`
- Aceitar `.doc`, `.docx`, `.pdf` em:
  - Upload API
  - Componente de upload
  - Scripts de processamento
  - Reprocessamento

#### Etapa 5: Atualizar Busca de Arquivos

- `scripts/process-documents.ts`: função `findDocxFiles` → `findDocumentFiles`
- Buscar `.doc`, `.docx`, `.pdf`

#### Etapa 6: Atualizar Documentação

- `docs/README.md` - mencionar suporte a múltiplos formatos
- `docs/architecture/ARQUITETURA.md` - atualizar pipeline
- `docs/guides/dashboard.md` - atualizar instruções de upload

### 5. Considerações Técnicas

**Para `.doc`:**

- Formato binário antigo, mais difícil de processar
- Opção 1: `textract` (Node.js puro, mas pode ter limitações)
- Opção 2: `libreoffice --headless --convert-to docx` (requer instalação)
- Opção 3: Converter via API externa (não recomendado)

**Para `.pdf`:**

- `pdf-parse` é simples e eficaz para texto
- Pode perder formatação complexa (tabelas, imagens)
- Adequado para documentos jurídicos (principalmente texto)

**Compatibilidade:**

- Manter retrocompatibilidade com `.docx` existente
- Pipeline após conversão permanece igual (Markdown → classificação → chunks → embeddings)

### 6. Testes Necessários

- Testar conversão de `.doc` para Markdown
- Testar conversão de `.pdf` para Markdown
- Verificar que pipeline completo funciona (conversão → classificação → chunks → embeddings)
- Testar upload via dashboard
- Testar processamento via scripts
- Verificar tratamento de erros (arquivos corrompidos)

### 7. Limitações Conhecidas

- `.doc`: Pode ter limitações dependendo da biblioteca escolhida
- `.pdf`: Pode perder formatação complexa (tabelas, imagens)
- Ambos: Conversão pode ser mais lenta que `.docx` direto

## Decisões Pendentes

1. **Biblioteca para `.doc`**: `textract` (Node.js) vs `libreoffice` CLI (mais confiável mas requer instalação)
2. **Estratégia de fallback**: Se `.doc` falhar, tentar converter para `.docx` primeiro?

## Próximos Passos

Após aprovação do plano:

1. Instalar dependências
2. Implementar serviço unificado de conversão
3. Atualizar worker thread
4. Atualizar validações e uploads
5. Testar com arquivos reais
6. Atualizar documentação

### To-dos

- [ ] Instalar dependências: pdf-parse e textract (ou definir estratégia para .doc)
- [ ] Criar lib/services/document-converter.ts com suporte a docx, doc e pdf
- [ ] Atualizar lib/workers/docx-converter-worker.ts para suportar múltiplos formatos
- [ ] Atualizar lib/services/rag-processor.ts para usar novo conversor unificado
- [ ] Atualizar scripts/process-documents.ts para buscar .doc, .docx e .pdf
- [ ] Atualizar app/api/upload/route.ts para aceitar .doc e .pdf
- [ ] Atualizar components/upload/file-upload.tsx para aceitar .doc e .pdf
- [ ] Atualizar app/api/documents/[id]/reprocess-full/route.ts para aceitar .doc e .pdf
- [ ] Atualizar app/(dashboard)/files/[id]/page.tsx para aceitar .doc e .pdf
- [ ] Atualizar documentação em docs/ para mencionar suporte a múltiplos formatos