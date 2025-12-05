/**
 * Gerador de Arquivos Excel (XLSX)
 * 
 * Gera planilhas Excel para BP e DRE com análise horizontal e vertical
 * Replica a funcionalidade do pipeline Python
 */

import * as XLSX from 'xlsx'

interface ContaComAnalise {
  cod_cta: string
  cod_cta_ref: string
  cta: string
  saldos: Record<number, number>
  ah_abs: Record<string, number>
  ah_perc: Record<string, number>
  av_perc: Record<number, number>
}

/**
 * Gerar XLSX para Balanço Patrimonial
 */
export function generateBPExcel(contas: ContaComAnalise[], anos: number[]): Buffer {
  // Preparar dados para a planilha
  const rows: any[] = []
  
  // Header
  const header: any = {
    COD_CTA: 'Código',
    COD_CTA_REF: 'Ref',
    CTA: 'Descrição',
  }
  
  // Adicionar colunas de saldos por ano
  anos.forEach(ano => {
    header[`SALDO_${ano}`] = ano
  })
  
  // Adicionar colunas de AH
  for (let i = 1; i < anos.length; i++) {
    const anoAnterior = anos[i - 1]
    const anoAtual = anos[i]
    header[`AH_${anoAnterior}_${anoAtual}_ABS`] = `AH ${anoAnterior}-${anoAtual} (R$)`
    header[`AH_${anoAnterior}_${anoAtual}_PERC`] = `AH ${anoAnterior}-${anoAtual} (%)`
  }
  
  // Adicionar colunas de AV
  anos.forEach(ano => {
    header[`AV_${ano}_PERC`] = `AV ${ano} (%)`
  })
  
  rows.push(header)
  
  // Dados
  contas.forEach(conta => {
    const row: any = {
      COD_CTA: conta.cod_cta,
      COD_CTA_REF: conta.cod_cta_ref,
      CTA: conta.cta,
    }
    
    // Saldos
    anos.forEach(ano => {
      row[`SALDO_${ano}`] = conta.saldos[ano] || 0
    })
    
    // AH
    for (let i = 1; i < anos.length; i++) {
      const anoAnterior = anos[i - 1]
      const anoAtual = anos[i]
      const key = `${anoAnterior}_${anoAtual}`
      row[`AH_${key}_ABS`] = conta.ah_abs[`${key}_abs`] || 0
      row[`AH_${key}_PERC`] = conta.ah_perc[`${key}_perc`] || 0
    }
    
    // AV
    anos.forEach(ano => {
      row[`AV_${ano}_PERC`] = conta.av_perc[ano] || 0
    })
    
    rows.push(row)
  })
  
  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true })
  
  // Definir larguras de colunas
  const colWidths = [
    { wch: 15 }, // COD_CTA
    { wch: 10 }, // COD_CTA_REF
    { wch: 50 }, // CTA
  ]
  
  // Larguras para saldos e análises
  anos.forEach(() => colWidths.push({ wch: 15 })) // Saldos
  for (let i = 1; i < anos.length; i++) {
    colWidths.push({ wch: 15 }) // AH ABS
    colWidths.push({ wch: 12 }) // AH PERC
  }
  anos.forEach(() => colWidths.push({ wch: 12 })) // AV PERC
  
  ws['!cols'] = colWidths
  
  // Adicionar ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Balanço Patrimonial')
  
  // Gerar buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

/**
 * Gerar XLSX para DRE
 */
export function generateDREExcel(contas: ContaComAnalise[], anos: number[]): Buffer {
  // Preparar dados para a planilha
  const rows: any[] = []
  
  // Header
  const header: any = {
    COD_CTA: 'Código',
    COD_CTA_REF: 'Ref',
    CTA: 'Descrição',
  }
  
  // Adicionar colunas de saldos por ano
  anos.forEach(ano => {
    header[`SALDO_${ano}`] = ano
  })
  
  // Adicionar colunas de AH
  for (let i = 1; i < anos.length; i++) {
    const anoAnterior = anos[i - 1]
    const anoAtual = anos[i]
    header[`AH_${anoAnterior}_${anoAtual}_ABS`] = `AH ${anoAnterior}-${anoAtual} (R$)`
    header[`AH_${anoAnterior}_${anoAtual}_PERC`] = `AH ${anoAnterior}-${anoAtual} (%)`
  }
  
  // Adicionar colunas de AV
  anos.forEach(ano => {
    header[`AV_${ano}_PERC`] = `AV ${ano} (%)`
  })
  
  rows.push(header)
  
  // Dados
  contas.forEach(conta => {
    const row: any = {
      COD_CTA: conta.cod_cta,
      COD_CTA_REF: conta.cod_cta_ref,
      CTA: conta.cta,
    }
    
    // Saldos
    anos.forEach(ano => {
      row[`SALDO_${ano}`] = conta.saldos[ano] || 0
    })
    
    // AH
    for (let i = 1; i < anos.length; i++) {
      const anoAnterior = anos[i - 1]
      const anoAtual = anos[i]
      const key = `${anoAnterior}_${anoAtual}`
      row[`AH_${key}_ABS`] = conta.ah_abs[`${key}_abs`] || 0
      row[`AH_${key}_PERC`] = conta.ah_perc[`${key}_perc`] || 0
    }
    
    // AV
    anos.forEach(ano => {
      row[`AV_${ano}_PERC`] = conta.av_perc[ano] || 0
    })
    
    rows.push(row)
  })
  
  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true })
  
  // Definir larguras de colunas
  const colWidths = [
    { wch: 15 }, // COD_CTA
    { wch: 10 }, // COD_CTA_REF
    { wch: 50 }, // CTA
  ]
  
  // Larguras para saldos e análises
  anos.forEach(() => colWidths.push({ wch: 15 })) // Saldos
  for (let i = 1; i < anos.length; i++) {
    colWidths.push({ wch: 15 }) // AH ABS
    colWidths.push({ wch: 12 }) // AH PERC
  }
  anos.forEach(() => colWidths.push({ wch: 12 })) // AV PERC
  
  ws['!cols'] = colWidths
  
  // Adicionar ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'DRE')
  
  // Gerar buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

