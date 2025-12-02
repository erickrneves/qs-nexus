/**
 * System Prompt para classificação de documentos jurídicos
 */
export const DOCX_CLASSIFICATION_PROMPT = `Você é um assistente especializado em analisar e classificar documentos jurídicos.

Sua tarefa é extrair metadados estruturados de documentos jurídicos (petições, contratos, pareceres, sentenças, etc.) para facilitar busca semântica e organização.

## ANÁLISE OBRIGATÓRIA:

### 1. IDENTIFICAÇÃO DO DOCUMENTO
- Tipo de documento (petição, contrato, parecer, etc)
- Área do direito (tributário, trabalhista, civil, etc)
- Título descritivo e preciso

### 2. CLASSIFICAÇÃO TÉCNICA
- **Jurisdição**: Federal, Estadual, Municipal, ou outro
- **Complexidade**:
  - Baixa: Documentos simples, rotineiros
  - Média: Documentos com questões moderadamente complexas
  - Alta: Documentos com questões técnicas sofisticadas

### 3. EXTRAÇÃO DE METADADOS

**Partes Envolvidas**:
- Identifique pessoas/empresas mencionadas
- Classifique papel: autor, réu, terceiro, advogado, juiz, etc

**Datas Relevantes**:
- Distribuição, protocolo, julgamento, prazos
- Formato: YYYY-MM-DD

**Valores Monetários**:
- Valor da causa, multas, honorários, etc
- Sempre em BRL (salvo menção explícita de outra moeda)

**Estrutura do Documento**:
- Identifique seções principais (introdução, fundamentação, pedidos, etc)
- Classifique papel de cada seção

### 4. ANÁLISE DE CONTEÚDO

**Tags** (5-10 palavras-chave):
- Termos jurídicos relevantes
- Temas principais
- Precedentes ou leis citadas
- Evite termos genéricos; seja específico

**Resumo** (2-3 linhas):
- Objetivo e conciso
- Otimizado para embedding semântico
- Capture a essência do documento

**Pontos-Chave** (3-5 itens):
- Principais argumentos ou decisões
- Teses jurídicas
- Resultados ou pedidos

### 5. AVALIAÇÃO DE QUALIDADE

**Quality Score (0-100)**:
- 90-100: Excelente estrutura, argumentação clara, bem fundamentado
- 70-89: Boa qualidade, estrutura adequada, fundamentação sólida
- 50-69: Qualidade média, estrutura básica, fundamentação superficial
- 0-49: Baixa qualidade, mal estruturado, pouca fundamentação

**Classificação de Valor**:
- **Gold**: Documento exemplar, pode servir de modelo
- **Silver**: Documento útil como referência
- Nenhum: Documento comum

## DIRETRIZES:

1. Seja preciso e objetivo nas classificações
2. Use terminologia jurídica brasileira correta
3. Se informações não estiverem disponíveis, use valores padrão ou omita campos opcionais
4. Priorize clareza e utilidade para busca semântica
5. Identifique corretamente a área e tipo de documento

## FORMATO DE SAÍDA:

Retorne um objeto JSON estruturado conforme o schema fornecido, com todos os campos obrigatórios preenchidos de forma precisa.
`

/**
 * Template fields para schema de documentos jurídicos
 * Define os campos que serão salvos no banco
 */
export const DOCX_SCHEMA_FIELDS: any[] = [
  {
    name: 'title',
    type: 'string',
    label: 'Título',
    required: true,
    description: 'Título descritivo do documento',
  },
  {
    name: 'docType',
    type: 'enum',
    label: 'Tipo de Documento',
    required: true,
    options: [
      'peticao_inicial',
      'contestacao',
      'recurso',
      'agravo',
      'contrato',
      'parecer',
      'procuracao',
      'sentenca',
      'acordao',
      'despacho',
      'outro',
    ],
    description: 'Categoria do documento jurídico',
  },
  {
    name: 'area',
    type: 'enum',
    label: 'Área do Direito',
    required: true,
    options: [
      'tributario',
      'trabalhista',
      'civil',
      'empresarial',
      'consumidor',
      'familia',
      'previdenciario',
      'penal',
      'administrativo',
      'constitucional',
      'outro',
    ],
    description: 'Área principal do direito abordada',
  },
  {
    name: 'jurisdiction',
    type: 'string',
    label: 'Jurisdição',
    required: false,
    description: 'Esfera de atuação (federal, estadual, municipal)',
  },
  {
    name: 'complexity',
    type: 'enum',
    label: 'Complexidade',
    required: true,
    options: ['baixa', 'media', 'alta'],
    description: 'Nível de complexidade técnica',
  },
  {
    name: 'parties',
    type: 'array',
    label: 'Partes Envolvidas',
    required: false,
    description: 'Lista de partes envolvidas no documento',
  },
  {
    name: 'dates',
    type: 'array',
    label: 'Datas Relevantes',
    required: false,
    description: 'Datas importantes mencionadas',
  },
  {
    name: 'amounts',
    type: 'array',
    label: 'Valores Monetários',
    required: false,
    description: 'Valores mencionados no documento',
  },
  {
    name: 'tags',
    type: 'array',
    label: 'Tags',
    required: true,
    description: 'Palavras-chave para categorização',
  },
  {
    name: 'summary',
    type: 'string',
    label: 'Resumo',
    required: true,
    description: 'Resumo conciso para embedding (2-3 linhas)',
  },
  {
    name: 'keyPoints',
    type: 'array',
    label: 'Pontos-Chave',
    required: false,
    description: 'Principais pontos do documento',
  },
  {
    name: 'qualityScore',
    type: 'number',
    label: 'Nota de Qualidade',
    required: true,
    description: 'Score de 0-100 baseado em qualidade técnica',
  },
]

