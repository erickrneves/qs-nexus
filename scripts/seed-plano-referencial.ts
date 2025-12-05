#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import XLSX from 'xlsx'
import { ecdPlanoReferencial } from '@/lib/db/schema/ecd-plano-referencial'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Função para calcular o nível hierárquico baseado no código
function calcularNivel(codCtaRef: string): number {
  const codStr = String(codCtaRef)
  // Contar pontos para determinar profundidade
  const pontos = (codStr.match(/\./g) || []).length
  return pontos + 1
}

// Função para classificar o tipo de conta baseado no nível
function classificarTipoConta(nivel: number): string {
  if (nivel === 1) return 'sintética'
  if (nivel === 2) return 'agregadora'
  if (nivel === 3) return 'intermediária'
  if (nivel === 4) return 'subgrupo'
  return 'analítica' // 5+
}

async function seedPlanoReferencial() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } })
  const db = drizzle(sql)

  console.log('📚 Iniciando seed do Plano Referencial ECD...')

  try {
    // 1. Ler arquivo do Balanço Patrimonial
    console.log('\n📖 Lendo plano_referencial_bp.xlsx...')
    const bpWorkbook = XLSX.readFile('plano_referencial_bp.xlsx')
    const bpSheet = bpWorkbook.Sheets[bpWorkbook.SheetNames[0]]
    const bpData = XLSX.utils.sheet_to_json(bpSheet) as Array<{ COD_CTA_REF: string | number; 'DESCRIÇÃO': string }>

    console.log(`   ✓ ${bpData.length} contas do BP carregadas`)

    // 2. Ler arquivo da DRE
    console.log('📖 Lendo plano_referencial_dre.xlsx...')
    const dreWorkbook = XLSX.readFile('plano_referencial_dre.xlsx')
    const dreSheet = dreWorkbook.Sheets[dreWorkbook.SheetNames[0]]
    const dreData = XLSX.utils.sheet_to_json(dreSheet) as Array<{ COD_CTA_REF: string | number; 'DESCRIÇÃO': string }>

    console.log(`   ✓ ${dreData.length} contas da DRE carregadas`)

    // 3. Preparar dados do BP
    const bpRecords = bpData.map(row => {
      const codCtaRef = String(row.COD_CTA_REF)
      const nivel = calcularNivel(codCtaRef)
      const tipoConta = classificarTipoConta(nivel)

      return {
        codCtaRef,
        descricao: row['DESCRIÇÃO'],
        tipo: 'BP',
        nivel,
        tipoConta,
      }
    })

    // 4. Preparar dados da DRE
    const dreRecords = dreData.map(row => {
      const codCtaRef = String(row.COD_CTA_REF)
      const nivel = calcularNivel(codCtaRef)
      const tipoConta = classificarTipoConta(nivel)

      return {
        codCtaRef,
        descricao: row['DESCRIÇÃO'],
        tipo: 'DRE',
        nivel,
        tipoConta,
      }
    })

    // 5. Limpar tabela existente
    console.log('\n🗑️  Limpando dados existentes...')
    await db.delete(ecdPlanoReferencial)

    // 6. Inserir BP em lotes
    console.log('💾 Inserindo contas do Balanço Patrimonial...')
    const batchSize = 100
    for (let i = 0; i < bpRecords.length; i += batchSize) {
      const batch = bpRecords.slice(i, i + batchSize)
      await db.insert(ecdPlanoReferencial).values(batch)
      console.log(`   ✓ ${Math.min(i + batchSize, bpRecords.length)}/${bpRecords.length} inseridas`)
    }

    // 7. Inserir DRE em lotes
    console.log('💾 Inserindo contas da DRE...')
    for (let i = 0; i < dreRecords.length; i += batchSize) {
      const batch = dreRecords.slice(i, i + batchSize)
      await db.insert(ecdPlanoReferencial).values(batch)
      console.log(`   ✓ ${Math.min(i + batchSize, dreRecords.length)}/${dreRecords.length} inseridas`)
    }

    // 8. Estatísticas finais
    console.log('\n📊 Estatísticas do Plano Referencial:')
    console.log(`   • Total de contas BP: ${bpRecords.length}`)
    console.log(`   • Total de contas DRE: ${dreRecords.length}`)
    console.log(`   • Total geral: ${bpRecords.length + dreRecords.length}`)

    // Contar por nível
    const bpPorNivel = bpRecords.reduce((acc, r) => {
      acc[r.nivel] = (acc[r.nivel] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const drePorNivel = dreRecords.reduce((acc, r) => {
      acc[r.nivel] = (acc[r.nivel] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    console.log('\n   Distribuição por nível (BP):')
    Object.keys(bpPorNivel).sort().forEach(nivel => {
      const tipo = classificarTipoConta(Number(nivel))
      console.log(`   • Nível ${nivel} (${tipo}): ${bpPorNivel[Number(nivel)]} contas`)
    })

    console.log('\n   Distribuição por nível (DRE):')
    Object.keys(drePorNivel).sort().forEach(nivel => {
      const tipo = classificarTipoConta(Number(nivel))
      console.log(`   • Nível ${nivel} (${tipo}): ${drePorNivel[Number(nivel)]} contas`)
    })

  } catch (error) {
    console.error('❌ Erro ao popular plano referencial:', error)
    throw error
  } finally {
    await sql.end()
  }
}

seedPlanoReferencial()
  .then(() => {
    console.log('\n✅ Seed do Plano Referencial concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro:', error)
    process.exit(1)
  })

