/**
 * Templates Pré-definidos para Documentos Jurídicos
 * 
 * Regras de extração PROGRAMÁTICAS (regex)
 * SEM IA - CUSTO $0
 */

export const LEGAL_DOCUMENT_PRESETS = {
  lei_federal: {
    name: 'Lei Federal - Extração Programática',
    description: 'Template otimizado para leis federais brasileiras. Extração 100% programática (sem IA, custo $0).',
    category: 'juridico',
    extractionMethod: 'programmatic',
    extractionRules: {
      // Artigos: "Art. 1º" ou "Art. 1o" ou "Art. 1"
      artigos: {
        pattern: '(?:^|\\n\\s*)Art\\.\\s*(\\d+)[ºª°]?\\.?\\s*',
        extractor: 'legal_article',
      },
      // Parágrafos: "§ 1º" ou "§ único"
      paragrafos: {
        pattern: '§\\s*(\\d+|único)[ºª°]?\\.?\\s*',
        extractor: 'legal_paragraph',
      },
      // Incisos: "I -" ou "II –" ou "III —"
      incisos: {
        pattern: '([IVX]+)\\s*[-–—]\\s*',
        extractor: 'legal_inciso',
      },
      // Alíneas: "a)" ou "b)"
      alineas: {
        pattern: '([a-z])\\)\\s*',
        extractor: 'legal_alinea',
      },
      // Metadados da lei
      metadata: {
        numero_lei: {
          pattern: 'Lei\\s+n[ºª°]?\\s*(\\d+[.,]?\\d*)',
          type: 'text',
        },
        data_sancao: {
          pattern: 'de\\s+(\\d{1,2})\\s+de\\s+([a-z]+)\\s+de\\s+(\\d{4})',
          type: 'date',
        },
        origem: {
          pattern: '(Presidência da República|Congresso Nacional|Senado Federal)',
          type: 'text',
        },
      },
    },
    fields: [
      {
        fieldName: 'numero_lei',
        fieldType: 'text',
        isRequired: true,
        description: 'Número da lei (ex: 10.833)',
      },
      {
        fieldName: 'data_sancao',
        fieldType: 'text',
        isRequired: false,
        description: 'Data de sanção da lei',
      },
      {
        fieldName: 'origem',
        fieldType: 'text',
        isRequired: false,
        description: 'Origem da lei (Presidência, Congresso, etc)',
      },
      {
        fieldName: 'artigos',
        fieldType: 'object_array',
        isRequired: true,
        description: 'Artigos da lei com estrutura hierárquica completa',
        arrayItemName: 'artigo',
        nestedSchema: [
          {
            fieldName: 'numero',
            fieldType: 'number',
            isRequired: true,
            description: 'Número do artigo',
          },
          {
            fieldName: 'caput',
            fieldType: 'text',
            isRequired: true,
            description: 'Texto principal do artigo',
          },
          {
            fieldName: 'paragrafos',
            fieldType: 'object_array',
            isRequired: false,
            description: 'Parágrafos do artigo',
            arrayItemName: 'paragrafo',
            nestedSchema: [
              {
                fieldName: 'numero',
                fieldType: 'text',
                isRequired: true,
                description: 'Número do parágrafo',
              },
              {
                fieldName: 'texto',
                fieldType: 'text',
                isRequired: true,
                description: 'Texto do parágrafo',
              },
              {
                fieldName: 'incisos',
                fieldType: 'object_array',
                isRequired: false,
                description: 'Incisos do parágrafo',
                arrayItemName: 'inciso',
                nestedSchema: [
                  {
                    fieldName: 'numero',
                    fieldType: 'text',
                    isRequired: true,
                    description: 'Número romano do inciso',
                  },
                  {
                    fieldName: 'texto',
                    fieldType: 'text',
                    isRequired: true,
                    description: 'Texto do inciso',
                  },
                  {
                    fieldName: 'alineas',
                    fieldType: 'object_array',
                    isRequired: false,
                    description: 'Alíneas do inciso',
                    arrayItemName: 'alinea',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  
  decreto: {
    name: 'Decreto - Extração Programática',
    description: 'Template para decretos federais/estaduais/municipais. Extração 100% programática.',
    category: 'juridico',
    extractionMethod: 'programmatic',
    extractionRules: {
      artigos: {
        pattern: '(?:^|\\n\\s*)Art\\.\\s*(\\d+)[ºª°]?\\.?\\s*',
        extractor: 'legal_article',
      },
      paragrafos: {
        pattern: '§\\s*(\\d+|único)[ºª°]?\\.?\\s*',
        extractor: 'legal_paragraph',
      },
      incisos: {
        pattern: '([IVX]+)\\s*[-–—]\\s*',
        extractor: 'legal_inciso',
      },
      metadata: {
        numero_decreto: {
          pattern: 'Decreto\\s+n[ºª°]?\\s*(\\d+[.,]?\\d*)',
          type: 'text',
        },
        data_publicacao: {
          pattern: 'de\\s+(\\d{1,2})\\s+de\\s+([a-z]+)\\s+de\\s+(\\d{4})',
          type: 'date',
        },
      },
    },
    fields: [
      {
        fieldName: 'numero_decreto',
        fieldType: 'text',
        isRequired: true,
        description: 'Número do decreto',
      },
      {
        fieldName: 'data_publicacao',
        fieldType: 'text',
        isRequired: false,
        description: 'Data de publicação',
      },
      {
        fieldName: 'artigos',
        fieldType: 'object_array',
        isRequired: true,
        description: 'Artigos do decreto',
        arrayItemName: 'artigo',
      },
    ],
  },
}

