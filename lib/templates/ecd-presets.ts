/**
 * Templates Pré-definidos para SPED ECD
 * 
 * Regras de extração PROGRAMÁTICAS
 * SEM IA - CUSTO $0
 */

export const ECD_PRESETS = {
  ecd_bp_dre_5anos: {
    name: 'ECD - Balanço e DRE 5 Anos',
    description: 'Extração programática de BP e DRE com análise horizontal e vertical (últimos 5 anos)',
    category: 'contabil',
    baseType: 'sped',
    extractionMethod: 'programmatic',
    extractionRules: {
      // Abas obrigatórias do XLSX
      required_sheets: ['I051', 'I052', 'I155', 'I355'],
      
      // Configuração do Balanço Patrimonial
      bp: {
        source_sheet: 'I155', // Saldos finais
        filter: {
          cod_cta_ref_starts_with: ['1', '2'], // Ativo e Passivo
          month: 12, // Apenas dezembro
        },
        sinal_conversion: {
          D: '+', // Débito = positivo
          C: '-', // Crédito = negativo
        },
      },
      
      // Configuração da DRE
      dre: {
        source_sheet: 'I355', // Movimentações
        filter: {
          cod_cta_ref_starts_with: ['3'], // Contas de resultado
        },
        sinal_conversion: {
          D: '-', // Débito = negativo (despesa)
          C: '+', // Crédito = positivo (receita)
        },
      },
      
      // Referências
      references: {
        plano_referencial: 'I051',
        hierarquia: 'I052',
      },
      
      // Cálculos a realizar
      calculations: ['AH', 'AV'],
      
      // Análise Horizontal (AH)
      ah: {
        type: 'year_over_year',
        metrics: ['absolute', 'percentage'],
      },
      
      // Análise Vertical (AV)
      av: {
        bp_base: 'ativo_total', // Base = contas que começam com 1
        dre_base: 'receita_total', // Base = todas as contas de resultado
        format: 'percentage',
      },
    },
    fields: [
      {
        fieldName: 'bp',
        displayName: 'Balanço Patrimonial',
        fieldType: 'object_array',
        isRequired: true,
        description: 'Contas do BP com saldos de 5 anos + AH + AV',
        arrayItemName: 'conta',
        nestedSchema: [
          {
            fieldName: 'cod_cta',
            displayName: 'Código da Conta',
            fieldType: 'text',
            isRequired: true,
            description: 'Código contábil da conta',
          },
          {
            fieldName: 'cod_cta_ref',
            displayName: 'Código Referencial',
            fieldType: 'text',
            isRequired: true,
            description: 'Código do plano referencial',
          },
          {
            fieldName: 'cta',
            displayName: 'Descrição da Conta',
            fieldType: 'text',
            isRequired: true,
            description: 'Nome/descrição da conta contábil',
          },
          {
            fieldName: 'saldos',
            displayName: 'Saldos por Ano',
            fieldType: 'nested_object',
            isRequired: true,
            description: 'Objeto com saldos { 2020: 1000, 2021: 1500, ... }',
          },
          {
            fieldName: 'ah_abs',
            displayName: 'Análise Horizontal (Absoluta)',
            fieldType: 'nested_object',
            isRequired: false,
            description: 'Variação absoluta entre anos',
          },
          {
            fieldName: 'ah_perc',
            displayName: 'Análise Horizontal (%)',
            fieldType: 'nested_object',
            isRequired: false,
            description: 'Variação percentual entre anos',
          },
          {
            fieldName: 'av_perc',
            displayName: 'Análise Vertical (%)',
            fieldType: 'nested_object',
            isRequired: false,
            description: 'Percentual sobre o total por ano',
          },
        ],
      },
      {
        fieldName: 'dre',
        displayName: 'Demonstração do Resultado',
        fieldType: 'object_array',
        isRequired: true,
        description: 'Contas da DRE com saldos de 5 anos + AH + AV',
        arrayItemName: 'conta',
        nestedSchema: [
          {
            fieldName: 'cod_cta',
            displayName: 'Código da Conta',
            fieldType: 'text',
            isRequired: true,
            description: 'Código contábil da conta',
          },
          {
            fieldName: 'cod_cta_ref',
            displayName: 'Código Referencial',
            fieldType: 'text',
            isRequired: true,
            description: 'Código do plano referencial',
          },
          {
            fieldName: 'cta',
            displayName: 'Descrição da Conta',
            fieldType: 'text',
            isRequired: true,
            description: 'Nome/descrição da conta contábil',
          },
          {
            fieldName: 'saldos',
            displayName: 'Saldos por Ano',
            fieldType: 'nested_object',
            isRequired: true,
            description: 'Objeto com saldos { 2020: 1000, 2021: 1500, ... }',
          },
          {
            fieldName: 'ah_abs',
            displayName: 'Análise Horizontal (Absoluta)',
            fieldType: 'nested_object',
            isRequired: false,
            description: 'Variação absoluta entre anos',
          },
          {
            fieldName: 'ah_perc',
            displayName: 'Análise Horizontal (%)',
            fieldType: 'nested_object',
            isRequired: false,
            description: 'Variação percentual entre anos',
          },
          {
            fieldName: 'av_perc',
            displayName: 'Análise Vertical (%)',
            fieldType: 'nested_object',
            isRequired: false,
            description: 'Percentual sobre o total por ano',
          },
        ],
      },
      {
        fieldName: 'metadata',
        displayName: 'Metadados',
        fieldType: 'nested_object',
        isRequired: false,
        description: 'Informações sobre o processamento',
      },
    ],
  },
}

