import { z } from 'zod'

/**
 * Schema de classificação para documentos jurídicos (DOCX, PDF, TXT)
 * Baseado no schema atual do sistema
 */
export const DocxClassificationSchema = z.object({
  // Identificação do Documento
  title: z.string().describe('Título descritivo do documento'),
  docType: z.enum([
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
  ]).describe('Tipo de documento jurídico'),
  
  // Classificação Jurídica
  area: z.enum([
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
  ]).describe('Área principal do direito'),
  
  jurisdiction: z.string().describe('Jurisdição ou esfera (federal, estadual, municipal, etc)'),
  
  complexity: z.enum(['baixa', 'media', 'alta']).describe('Nível de complexidade técnica'),
  
  // Metadados Extraídos
  parties: z.array(
    z.object({
      name: z.string().describe('Nome da parte'),
      role: z.enum(['autor', 'reu', 'terceiro', 'advogado', 'juiz', 'outro']).describe('Papel no processo/documento'),
    })
  ).optional().describe('Partes envolvidas no documento'),
  
  dates: z.array(
    z.object({
      type: z.string().describe('Tipo de data (ex: distribuicao, protocolo, julgamento)'),
      date: z.string().describe('Data no formato YYYY-MM-DD'),
    })
  ).optional().describe('Datas relevantes mencionadas'),
  
  amounts: z.array(
    z.object({
      type: z.string().describe('Tipo de valor (ex: causa, multa, honorarios)'),
      value: z.number().describe('Valor numérico'),
      currency: z.string().default('BRL').describe('Moeda'),
    })
  ).optional().describe('Valores monetários mencionados'),
  
  // Conteúdo e Estrutura
  sections: z.array(
    z.object({
      name: z.string().describe('Nome da seção'),
      role: z.enum(['intro', 'fundamentacao', 'pedido', 'fatos', 'direito', 'conclusao', 'outro']).describe('Papel da seção'),
    })
  ).optional().describe('Estrutura de seções do documento'),
  
  // Análise e Qualidade
  tags: z.array(z.string()).describe('Tags para categorização e busca semântica'),
  summary: z.string().describe('Resumo de 2-3 linhas otimizado para embedding'),
  keyPoints: z.array(z.string()).optional().describe('Pontos-chave do documento'),
  
  qualityScore: z.number().min(0).max(100).describe('Nota de qualidade (0-100) baseada em clareza, estrutura e completude'),
  
  // Classificação de Valor
  isGold: z.boolean().default(false).describe('Documento de alta qualidade, modelo exemplar'),
  isSilver: z.boolean().default(false).describe('Documento de boa qualidade, útil como referência'),
})

export type DocxClassification = z.infer<typeof DocxClassificationSchema>

