#!/usr/bin/env tsx
/**
 * Executa todos os testes de validação dos pipelines
 */

import { spawn } from 'child_process'
import { join } from 'path'

interface TestSuite {
  name: string
  script: string
  description: string
}

const testSuites: TestSuite[] = [
  {
    name: 'Documentos',
    script: 'test-document-pipeline.ts',
    description: 'Pipeline completo de documentos (PDF/DOCX/TXT)'
  },
  {
    name: 'SPED',
    script: 'test-sped-pipeline.ts',
    description: 'Pipeline de SPED (arquivos contábeis)'
  },
  {
    name: 'CSV',
    script: 'test-csv-pipeline.ts',
    description: 'Pipeline de CSV'
  }
]

async function runTest(suite: TestSuite): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const scriptPath = join(__dirname, suite.script)
    const proc = spawn('tsx', [scriptPath], {
      stdio: 'pipe',
      env: process.env
    })

    let output = ''

    proc.stdout?.on('data', (data) => {
      output += data.toString()
    })

    proc.stderr?.on('data', (data) => {
      output += data.toString()
    })

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output
      })
    })
  })
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🧪 SUITE DE TESTES - VALIDAÇÃO DE PIPELINES DE DADOS')
  console.log('='.repeat(70) + '\n')

  const results: Array<{ suite: TestSuite; success: boolean; output: string }> = []

  for (const suite of testSuites) {
    console.log(`\n📦 Executando: ${suite.name}`)
    console.log(`   ${suite.description}`)
    console.log('   ' + '-'.repeat(66))

    const result = await runTest(suite)
    results.push({ suite, ...result })

    console.log(result.output)
  }

  // Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO GERAL')
  console.log('='.repeat(70))

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => r.success === false).length

  results.forEach(r => {
    const status = r.success ? '✅ PASSOU' : '❌ FALHOU'
    console.log(`${status} - ${r.suite.name}`)
  })

  console.log(`\n🎯 Total: ${results.length} suites`)
  console.log(`✅ Aprovadas: ${passed}`)
  console.log(`❌ Falhadas: ${failed}`)

  const successRate = ((passed / results.length) * 100).toFixed(1)
  console.log(`📈 Taxa de sucesso: ${successRate}%`)

  console.log('\n')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

