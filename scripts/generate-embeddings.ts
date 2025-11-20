import * as dotenv from 'dotenv';
import { db } from '../lib/db/index.js';
import { templates, templateChunks } from '../lib/db/schema/rag.js';
import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { chunkMarkdown } from '../lib/services/chunker.js';
import { generateEmbeddings } from '../lib/services/embedding-generator.js';
import { storeChunks } from '../lib/services/store-embeddings.js';
import { ConcurrencyPool, Task } from '../lib/utils/concurrency-pool.js';

dotenv.config({ path: '.env.local' });

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '64');
const MAX_TOKENS = parseInt(process.env.CHUNK_MAX_TOKENS || '800');
const EMBED_CONCURRENCY = parseInt(process.env.EMBED_CONCURRENCY || '2', 10);

interface EmbedResult {
  templateId: string;
  success: boolean;
  skipped?: boolean;
  chunksCount?: number;
  truncatedChunksCount?: number;
  error?: string;
  errorType?: 'token_limit' | 'other';
}

/**
 * Gera embeddings para um template individual
 */
async function generateEmbeddingsTask(template: InferSelectModel<typeof templates>): Promise<EmbedResult> {
  // Verifica se já tem chunks com embeddings
  const existingChunks = await db
    .select()
    .from(templateChunks)
    .where(eq(templateChunks.templateId, template.id))
    .limit(1);

  if (existingChunks.length > 0) {
    return {
      templateId: template.id,
      success: true,
      skipped: true,
    };
  }

  // Gera chunks
  const chunks = chunkMarkdown(template.markdown, MAX_TOKENS);
  
  if (chunks.length === 0) {
    return {
      templateId: template.id,
      success: true,
      skipped: true,
    };
  }

  // Gera embeddings em batch
  const texts = chunks.map(c => c.content);
  
  try {
    const embeddingResults = await generateEmbeddings(texts, BATCH_SIZE, template.id);

    // Conta chunks truncados
    const truncatedCount = embeddingResults.filter(r => r.wasTruncated).length;

    // Combina chunks com embeddings
    const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddingResults[idx].embedding,
    }));

    // Armazena chunks com embeddings no banco
    await storeChunks(template.id, chunksWithEmbeddings);

    return {
      templateId: template.id,
      success: true,
      skipped: false,
      chunksCount: chunksWithEmbeddings.length,
      truncatedChunksCount: truncatedCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTokenLimitError = errorMessage.includes('maximum context length') || 
                              errorMessage.includes('8192 tokens');
    
    return {
      templateId: template.id,
      success: false,
      error: errorMessage,
      errorType: isTokenLimitError ? 'token_limit' : 'other',
    };
  }
}

async function main() {
  console.log('🔍 Gerando embeddings...');
  
  const allTemplates = await db.select().from(templates);
  
  console.log(`📄 Processando ${allTemplates.length} templates`);
  console.log(`⚙️  Usando ${EMBED_CONCURRENCY} workers paralelos\n`);

  // Cria pool de concorrência
  const pool = new ConcurrencyPool<EmbedResult>({
    maxConcurrency: EMBED_CONCURRENCY,
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    onProgress: (stats) => {
      const progress = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100) 
        : 0;
      process.stdout.write(
        `\r📊 Progresso: ${stats.completed}/${stats.total} (${progress}%) | ` +
        `Em processamento: ${stats.inProgress} | Falhas: ${stats.failed}`
      );
    },
  });

  // Cria tarefas para cada template
  const tasks: Task<EmbedResult>[] = allTemplates.map((template) => ({
    id: `embed-${template.id}`,
    execute: () => generateEmbeddingsTask(template),
  }));

  pool.addBatch(tasks);

  // Processa todas as tarefas
  const startTime = Date.now();
  const results = await pool.processAll();
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Analisa resultados
  const processed = results.filter(r => r.success && !r.result?.skipped).length;
  const skipped = results.filter(r => r.success && r.result?.skipped).length;
  const errors = results.filter(r => !r.success).length;
  const tokenLimitErrors = results.filter(r => !r.success && r.result?.errorType === 'token_limit').length;
  const otherErrors = results.filter(r => !r.success && r.result?.errorType === 'other').length;
  const totalChunks = results
    .filter(r => r.success && r.result?.chunksCount)
    .reduce((sum, r) => sum + (r.result?.chunksCount || 0), 0);
  const totalTruncated = results
    .filter(r => r.success && r.result?.truncatedChunksCount)
    .reduce((sum, r) => sum + (r.result?.truncatedChunksCount || 0), 0);

  // Templates com problemas
  const problematicTemplates = results
    .filter(r => !r.success)
    .map(r => r.result?.templateId)
    .filter((id): id is string => id !== undefined);

  console.log(`\n\n✅ Geração de embeddings concluída em ${duration}s`);
  console.log(`   ✓ Processados: ${processed}`);
  console.log(`   ⊘ Pulados: ${skipped}`);
  console.log(`   ✗ Erros: ${errors}`);
  if (tokenLimitErrors > 0) {
    console.log(`      - Limite de tokens: ${tokenLimitErrors}`);
  }
  if (otherErrors > 0) {
    console.log(`      - Outros erros: ${otherErrors}`);
  }
  if (totalChunks > 0) {
    console.log(`   📦 Total de chunks: ${totalChunks}`);
  }
  if (totalTruncated > 0) {
    console.log(`   ⚠️  Chunks truncados: ${totalTruncated}`);
  }
  
  if (problematicTemplates.length > 0) {
    console.log(`\n   🔍 Templates com problemas (${problematicTemplates.length}):`);
    problematicTemplates.slice(0, 10).forEach(id => {
      const result = results.find(r => r.result?.templateId === id);
      const errorType = result?.result?.errorType === 'token_limit' ? 'limite de tokens' : 'outro erro';
      console.log(`      - ${id.substring(0, 8)}... (${errorType})`);
    });
    if (problematicTemplates.length > 10) {
      console.log(`      ... e mais ${problematicTemplates.length - 10} templates`);
    }
  }
}

main().catch(console.error);

