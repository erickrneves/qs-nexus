/**
 * Exportação centralizada de Workers
 * Para inicializar todos os workers do sistema
 */

import workflowWorker from './workflow-worker'
import spedProcessingWorker from './sped-processing-worker'
import embeddingWorker from './embedding-worker'

export const workers = {
  workflowWorker,
  spedProcessingWorker,
  embeddingWorker,
}

/**
 * Inicia todos os workers
 */
export function startAllWorkers() {
  console.log('[Workers] Iniciando todos os workers...')
  
  // Workers já estão iniciados ao serem importados
  // Esta função serve para logging e eventual configuração adicional
  
  console.log('[Workers] ✓ Workflow Worker')
  console.log('[Workers] ✓ SPED Processing Worker')
  console.log('[Workers] ✓ Embedding Worker')
  console.log('[Workers] Todos workers iniciados com sucesso')
}

/**
 * Para todos os workers
 */
export async function stopAllWorkers() {
  console.log('[Workers] Parando todos os workers...')
  
  await Promise.all([
    workflowWorker.close(),
    spedProcessingWorker.close(),
    embeddingWorker.close(),
  ])
  
  console.log('[Workers] Todos workers parados')
}

export default workers

