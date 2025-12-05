/**
 * ECD Programmatic Extractor
 * 
 * Extração 100% PROGRAMÁTICA - SEM IA - CUSTO $0
 * 
 * Replica a lógica do pipeline Python para extrair:
 * - Balanço Patrimonial (BP) de 5 anos
 * - DRE de 5 anos
 * - Análise Horizontal (AH)
 * - Análise Vertical (AV)
 * 
 * Baseado em: pipeline_ecd_5_anos.py
 */

import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

// ========================================
// INTERFACES
// ========================================

export interface ECDExtractionResult {
  success: boolean
  bp?: ContaComAnalise[]
  dre?: ContaComAnalise[]
  metadata?: {
    anos: number[]
    empresa: string
    periodos: string[]
  }
  error?: string
  executionTime?: number
}

export interface ContaComAnalise {
  cod_cta: string
  cod_cta_ref: string
  cta: string
  
  // Saldos por ano (até 5 anos)
  saldos: Record<number, number>
  
  // Análise Horizontal (variação entre anos)
  ah_abs: Record<string, number> // '2020_2021_abs'
  ah_perc: Record<string, number> // '2020_2021_perc'
  
  // Análise Vertical (% sobre total)
  av_perc: Record<number, number> // { 2020: 15.5, 2021: 16.2 }
}

interface I051Row {
  COD_CTA: string
  COD_CTA_REF: string
}

interface I052Row {
  NIVEL: number
  COD_CTA: string
  COD_CTA_SUP?: string
  CTA: string
}

interface I155Row {
  DT_FIN: Date | string
  ANO: number
  COD_CTA: string
  VL_SLD_FIN: number
  IND_DC_FIN: string
  VL_SLD_FIN_TRAT: number
}

interface I355Row {
  DT_RES: Date | string
  ANO: number
  COD_CTA: string
  VL_CTA: number
  IND_DC: string
  VL_CTA_TRAT: number
}

// ========================================
// FUNÇÕES AUXILIARES (baseadas no Python)
// ========================================

/**
 * Limpar nomes de colunas (remover espaços)
 * Problema: arquivo SPED tem colunas como ' VL_SLD_FIN ' com espaços
 */
function cleanColumnNames(data: any[]): any[] {
  return data.map(row => {
    const cleanedRow: any = {}
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.trim()
      cleanedRow[cleanKey] = value
    }
    return cleanedRow
  })
}

/**
 * Preparar I051 - Plano Referencial
 */
function prepararI051(data: any[]): I051Row[] {
  const cleaned = cleanColumnNames(data)
  return cleaned.map(row => ({
    COD_CTA: String(row.COD_CTA || ''),
    COD_CTA_REF: String(row.COD_CTA_REF || ''),
  })).filter(row => row.COD_CTA && row.COD_CTA_REF)
}

/**
 * Preparar I052 - Hierarquia e Descrição de Contas
 */
function prepararI052(data: any[]): I052Row[] {
  const cleaned = cleanColumnNames(data)
  return cleaned.map(row => ({
    NIVEL: Number(row.NIVEL || 0),
    COD_CTA: String(row.COD_CTA || ''),
    COD_CTA_SUP: row.COD_CTA_SUP ? String(row.COD_CTA_SUP) : undefined,
    CTA: String(row.CTA || ''),
  })).filter(row => row.COD_CTA && row.CTA)
}

/**
 * Preparar I155 - Saldos Finais (Balanço Patrimonial)
 */
function prepararI155(data: any[]): I155Row[] {
  const cleaned = cleanColumnNames(data)
  const rows: I155Row[] = []
  
  for (const row of cleaned) {
    let dtFin: Date
    
    // Converter DT_FIN para Date
    if (row.DT_FIN instanceof Date) {
      dtFin = row.DT_FIN
    } else if (typeof row.DT_FIN === 'string') {
      dtFin = new Date(row.DT_FIN)
    } else if (typeof row.DT_FIN === 'number') {
      // Excel serial date
      dtFin = XLSX.SSF.parse_date_code(row.DT_FIN)
    } else {
      continue
    }
    
    // Manter apenas dezembro (mês 12)
    if (dtFin.getMonth() !== 11) continue
    
    const ano = dtFin.getFullYear()
    const vlSldFin = Number(row.VL_SLD_FIN || 0)
    const indDcFin = String(row.IND_DC_FIN || '').toUpperCase()
    
    // Conversão de sinal: D = positivo, C = negativo
    const vlSldFinTrat = indDcFin === 'D' ? vlSldFin : -vlSldFin
    
    rows.push({
      DT_FIN: dtFin,
      ANO: ano,
      COD_CTA: String(row.COD_CTA || ''),
      VL_SLD_FIN: vlSldFin,
      IND_DC_FIN: indDcFin,
      VL_SLD_FIN_TRAT: vlSldFinTrat,
    })
  }
  
  return rows.filter(row => row.COD_CTA)
}

/**
 * Preparar I355 - Movimentações (DRE)
 */
function prepararI355(data: any[]): I355Row[] {
  const cleaned = cleanColumnNames(data)
  const rows: I355Row[] = []
  
  for (const row of cleaned) {
    let dtRes: Date
    
    // Converter DT_RES para Date
    if (row.DT_RES instanceof Date) {
      dtRes = row.DT_RES
    } else if (typeof row.DT_RES === 'string') {
      dtRes = new Date(row.DT_RES)
    } else if (typeof row.DT_RES === 'number') {
      // Excel serial date
      dtRes = XLSX.SSF.parse_date_code(row.DT_RES)
    } else {
      continue
    }
    
    const ano = dtRes.getFullYear()
    const vlCta = Number(row.VL_CTA || 0)
    const indDc = String(row.IND_DC || '').toUpperCase()
    
    // Conversão de sinal para DRE: D = negativo, C = positivo
    const vlCtaTrat = indDc === 'D' ? -vlCta : vlCta
    
    rows.push({
      DT_RES: dtRes,
      ANO: ano,
      COD_CTA: String(row.COD_CTA || ''),
      VL_CTA: vlCta,
      IND_DC: indDc,
      VL_CTA_TRAT: vlCtaTrat,
    })
  }
  
  return rows.filter(row => row.COD_CTA)
}

/**
 * Montar Balanço Patrimonial
 */
function montarBP(
  i051: I051Row[],
  i052: I052Row[],
  i155: I155Row[]
): Record<string, ContaComAnalise> {
  const contas: Record<string, ContaComAnalise> = {}
  
  // Criar índices para lookup rápido
  const i051Map = new Map(i051.map(r => [r.COD_CTA, r.COD_CTA_REF]))
  const i052Map = new Map(i052.map(r => [r.COD_CTA, r.CTA]))
  
  // Processar cada saldo
  for (const saldo of i155) {
    const codCtaRef = i051Map.get(saldo.COD_CTA)
    if (!codCtaRef) continue
    
    // Filtrar apenas contas patrimoniais (COD_CTA_REF começa com 1 ou 2)
    if (!codCtaRef.startsWith('1') && !codCtaRef.startsWith('2')) continue
    
    const cta = i052Map.get(saldo.COD_CTA) || ''
    const key = `${saldo.COD_CTA}_${codCtaRef}`
    
    if (!contas[key]) {
      contas[key] = {
        cod_cta: saldo.COD_CTA,
        cod_cta_ref: codCtaRef,
        cta,
        saldos: {},
        ah_abs: {},
        ah_perc: {},
        av_perc: {},
      }
    }
    
    // Acumular saldo do ano
    contas[key].saldos[saldo.ANO] = (contas[key].saldos[saldo.ANO] || 0) + saldo.VL_SLD_FIN_TRAT
  }
  
  return contas
}

/**
 * Montar DRE
 */
function montarDRE(
  i051: I051Row[],
  i052: I052Row[],
  i355: I355Row[]
): Record<string, ContaComAnalise> {
  const contas: Record<string, ContaComAnalise> = {}
  
  // Criar índices para lookup rápido
  const i051Map = new Map(i051.map(r => [r.COD_CTA, r.COD_CTA_REF]))
  const i052Map = new Map(i052.map(r => [r.COD_CTA, r.CTA]))
  
  // Processar cada movimentação
  for (const mov of i355) {
    const codCtaRef = i051Map.get(mov.COD_CTA)
    if (!codCtaRef) continue
    
    // Filtrar apenas contas de resultado (COD_CTA_REF começa com 3)
    if (!codCtaRef.startsWith('3')) continue
    
    const cta = i052Map.get(mov.COD_CTA) || ''
    const key = `${mov.COD_CTA}_${codCtaRef}`
    
    if (!contas[key]) {
      contas[key] = {
        cod_cta: mov.COD_CTA,
        cod_cta_ref: codCtaRef,
        cta,
        saldos: {},
        ah_abs: {},
        ah_perc: {},
        av_perc: {},
      }
    }
    
    // Acumular saldo do ano
    contas[key].saldos[mov.ANO] = (contas[key].saldos[mov.ANO] || 0) + mov.VL_CTA_TRAT
  }
  
  return contas
}

/**
 * Adicionar Análise Horizontal
 */
function adicionarAnaliseHorizontal(contas: Record<string, ContaComAnalise>): void {
  for (const conta of Object.values(contas)) {
    const anos = Object.keys(conta.saldos).map(Number).sort()
    
    for (let i = 1; i < anos.length; i++) {
      const anoAnterior = anos[i - 1]
      const anoAtual = anos[i]
      
      const saldoAnterior = conta.saldos[anoAnterior] || 0
      const saldoAtual = conta.saldos[anoAtual] || 0
      
      const diff = saldoAtual - saldoAnterior
      const perc = saldoAnterior !== 0 ? diff / saldoAnterior : 0
      
      const key = `${anoAnterior}_${anoAtual}`
      conta.ah_abs[key + '_abs'] = diff
      conta.ah_perc[key + '_perc'] = perc
    }
  }
}

/**
 * Adicionar Análise Vertical
 */
function adicionarAnaliseVertical(
  contas: Record<string, ContaComAnalise>,
  tipo: 'BP' | 'DRE'
): void {
  // Identificar anos presentes
  const anosSet = new Set<number>()
  Object.values(contas).forEach(c => {
    Object.keys(c.saldos).forEach(ano => anosSet.add(Number(ano)))
  })
  const anos = Array.from(anosSet).sort()
  
  // Calcular base para cada ano
  for (const ano of anos) {
    let base = 0
    
    if (tipo === 'BP') {
      // Base = total das contas de ativo (COD_CTA_REF começando com 1)
      base = Object.values(contas)
        .filter(c => c.cod_cta_ref.startsWith('1'))
        .reduce((sum, c) => sum + (c.saldos[ano] || 0), 0)
    } else {
      // Base = total das contas de resultado (COD_CTA_REF começando com 3)
      base = Object.values(contas)
        .reduce((sum, c) => sum + Math.abs(c.saldos[ano] || 0), 0)
    }
    
    // Calcular AV% para cada conta nesse ano
    for (const conta of Object.values(contas)) {
      const saldo = conta.saldos[ano] || 0
      conta.av_perc[ano] = base !== 0 ? saldo / base : 0
    }
  }
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

/**
 * Extrair BP e DRE de arquivo XLSX ECD
 * CUSTO: $0.00 (sem IA)
 */
export async function extractECDProgrammatically(
  filePath: string,
  onProgress?: (progress: number, message: string) => void
): Promise<ECDExtractionResult> {
  const startTime = Date.now()
  
  try {
    onProgress?.(10, 'Lendo arquivo XLSX...')
    console.log('[ECD] Lendo arquivo:', filePath)
    
    // 1. Ler arquivo XLSX
    const fileBuffer = readFileSync(filePath)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true })
    
    console.log('[ECD] Abas encontradas:', workbook.SheetNames)
    
    // 2. Validar abas obrigatórias
    const requiredSheets = ['I051', 'I052', 'I155', 'I355']
    for (const sheet of requiredSheets) {
      if (!workbook.SheetNames.includes(sheet)) {
        throw new Error(`Aba obrigatória não encontrada: ${sheet}`)
      }
    }
    
    onProgress?.(20, 'Validação concluída. Preparando dados...')
    
    // 3. Extrair dados de cada aba
    console.log('[ECD] Extraindo I051...')
    const i051Data = XLSX.utils.sheet_to_json(workbook.Sheets['I051'])
    const i051 = prepararI051(i051Data)
    console.log(`[ECD] I051: ${i051.length} registros`)
    
    console.log('[ECD] Extraindo I052...')
    const i052Data = XLSX.utils.sheet_to_json(workbook.Sheets['I052'])
    const i052 = prepararI052(i052Data)
    console.log(`[ECD] I052: ${i052.length} registros`)
    
    onProgress?.(40, 'Processando saldos do Balanço Patrimonial...')
    console.log('[ECD] Extraindo I155...')
    const i155Data = XLSX.utils.sheet_to_json(workbook.Sheets['I155'])
    const i155 = prepararI155(i155Data)
    console.log(`[ECD] I155: ${i155.length} saldos de dezembro`)
    
    onProgress?.(50, 'Processando movimentações da DRE...')
    console.log('[ECD] Extraindo I355...')
    const i355Data = XLSX.utils.sheet_to_json(workbook.Sheets['I355'])
    const i355 = prepararI355(i355Data)
    console.log(`[ECD] I355: ${i355.length} movimentações`)
    
    // 4. Montar BP
    onProgress?.(60, 'Montando Balanço Patrimonial...')
    console.log('[ECD] Montando BP...')
    const bpMap = montarBP(i051, i052, i155)
    console.log(`[ECD] BP: ${Object.keys(bpMap).length} contas`)
    
    // 5. Montar DRE
    onProgress?.(70, 'Montando DRE...')
    console.log('[ECD] Montando DRE...')
    const dreMap = montarDRE(i051, i052, i355)
    console.log(`[ECD] DRE: ${Object.keys(dreMap).length} contas`)
    
    // 6. Calcular Análise Horizontal
    onProgress?.(80, 'Calculando Análise Horizontal...')
    console.log('[ECD] Calculando AH...')
    adicionarAnaliseHorizontal(bpMap)
    adicionarAnaliseHorizontal(dreMap)
    
    // 7. Calcular Análise Vertical
    onProgress?.(90, 'Calculando Análise Vertical...')
    console.log('[ECD] Calculando AV...')
    adicionarAnaliseVertical(bpMap, 'BP')
    adicionarAnaliseVertical(dreMap, 'DRE')
    
    onProgress?.(100, 'Extração concluída!')
    
    const bp = Object.values(bpMap)
    const dre = Object.values(dreMap)
    
    // Identificar anos processados
    const anosSet = new Set<number>()
    bp.forEach(c => Object.keys(c.saldos).forEach(a => anosSet.add(Number(a))))
    const anos = Array.from(anosSet).sort()
    
    const executionTime = Date.now() - startTime
    
    console.log('[ECD] ✅ Extração concluída!')
    console.log(`[ECD] Tempo: ${executionTime}ms`)
    console.log(`[ECD] BP: ${bp.length} contas`)
    console.log(`[ECD] DRE: ${dre.length} contas`)
    console.log(`[ECD] Anos: ${anos.join(', ')}`)
    console.log(`[ECD] 💰 Custo: $0.00 (sem IA!)`)
    
    return {
      success: true,
      bp,
      dre,
      metadata: {
        anos,
        empresa: '', // Pode ser extraído de outra aba se necessário
        periodos: anos.map(a => `${a}`),
      },
      executionTime,
    }
  } catch (error) {
    console.error('[ECD] ❌ Erro na extração:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

