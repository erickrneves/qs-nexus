import { encoding_for_model } from 'tiktoken';

export interface Chunk {
  content: string;
  section?: string;
  role?: string;
  chunkIndex: number;
}

// Limite de segurança para chunks (abaixo do limite de 8192 do modelo)
const MAX_TOKENS_PER_CHUNK = 8000;

// Encoder para text-embedding-3-small (usa cl100k_base)
const encoder = encoding_for_model('text-embedding-3-small');

/**
 * Chunking inteligente que respeita estrutura Markdown
 */
export function chunkMarkdown(
  markdown: string,
  maxTokens: number = 800
): Chunk[] {
  const chunks: Chunk[] = [];
  
  // Divide por seções (H1, H2)
  const sectionRegex = /^(#{1,2})\s+(.+)$/gm;
  const sections: Array<{ level: number; title: string; start: number }> = [];
  
  let match;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    sections.push({
      level: match[1].length,
      title: match[2].trim(),
      start: match.index,
    });
  }

  // Se não há seções claras, usa chunking por parágrafos
  if (sections.length === 0) {
    const paragraphChunks = chunkByParagraphs(markdown, maxTokens);
    // Valida e divide chunks que excedem o limite de segurança
    const safeMaxTokens = Math.min(maxTokens, MAX_TOKENS_PER_CHUNK);
    return validateAndSplitChunks(paragraphChunks, safeMaxTokens);
  }

  // Chunking por seções
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const nextSection = sections[i + 1];
    const sectionStart = section.start;
    const sectionEnd = nextSection ? nextSection.start : markdown.length;
    
    const sectionContent = markdown.substring(sectionStart, sectionEnd);
    const role = inferRole(section.title);

    // Se a seção é pequena, adiciona como um chunk
    if (estimateTokens(sectionContent) <= maxTokens) {
      chunks.push({
        content: sectionContent,
        section: section.title,
        role,
        chunkIndex: chunks.length,
      });
    } else {
      // Se a seção é grande, divide em parágrafos
      const sectionChunks = chunkByParagraphs(sectionContent, maxTokens);
      sectionChunks.forEach((chunk, idx) => {
        chunks.push({
          ...chunk,
          section: section.title,
          role,
          chunkIndex: chunks.length,
        });
      });
    }
  }

  // Valida e divide chunks que excedem o limite de segurança
  const safeMaxTokens = Math.min(maxTokens, MAX_TOKENS_PER_CHUNK);
  return validateAndSplitChunks(chunks, safeMaxTokens);
}

/**
 * Chunking por parágrafos (fallback)
 */
function chunkByParagraphs(text: string, maxTokens: number): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    const currentTokens = estimateTokens(currentChunk);

    if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIndex++,
      });
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
    });
  }

  return chunks;
}

/**
 * Infere o papel/role de uma seção baseado no título
 */
function inferRole(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('fato') || title.includes('histórico')) return 'fatos';
  if (title.includes('direito') || title.includes('fundament')) return 'fundamentacao';
  if (title.includes('pedido') || title.includes('requer')) return 'pedido';
  if (title.includes('introdu') || title.includes('preliminar')) return 'intro';
  if (title.includes('conclus') || title.includes('final')) return 'conclusao';
  
  return 'outro';
}

/**
 * Conta tokens usando tiktoken (preciso)
 */
function countTokens(text: string): number {
  try {
    return encoder.encode(text).length;
  } catch (error) {
    // Fallback para estimativa se houver erro
    console.warn('Erro ao contar tokens com tiktoken, usando estimativa:', error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Estima tokens (mantido para compatibilidade, mas usa countTokens)
 */
function estimateTokens(text: string): number {
  return countTokens(text);
}

/**
 * Divide um chunk grande em chunks menores por sentenças
 */
function chunkBySentences(text: string, maxTokens: number): Chunk[] {
  const chunks: Chunk[] = [];
  // Divide por sentenças (terminadas com . ! ? seguido de espaço ou nova linha)
  const sentences = text.split(/([.!?]\s+|[.!?]\n+)/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceTokens = countTokens(sentence);
    const currentTokens = countTokens(currentChunk);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIndex++,
      });
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
    });
  }

  return chunks;
}

/**
 * Divide um chunk grande em chunks menores por caracteres (último recurso)
 */
function chunkByCharacters(text: string, maxTokens: number): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    // Tenta encontrar um ponto de quebra próximo ao limite
    let end = Math.min(start + maxTokens * 4, text.length); // Estimativa inicial
    
    // Ajusta para o limite exato de tokens
    while (end > start && countTokens(text.substring(start, end)) > maxTokens) {
      end = Math.max(start + 1, end - 100); // Reduz em incrementos, mas garante progresso
    }
    
    // Se ainda exceder, força divisão exata
    if (countTokens(text.substring(start, end)) > maxTokens) {
      // Encontra último espaço antes do limite
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) {
        end = lastSpace;
      } else {
        // Se não há espaço, força divisão em metade para garantir progresso
        end = Math.max(start + 1, Math.floor((start + end) / 2));
      }
    }

    // Garante que sempre avance
    if (end <= start) {
      end = start + 1;
    }

    const chunkContent = text.substring(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunkIndex: chunkIndex++,
      });
    }
    
    start = end;
  }

  return chunks;
}

/**
 * Valida e divide chunks que excedem o limite
 */
function validateAndSplitChunks(chunks: Chunk[], maxTokens: number): Chunk[] {
  const validatedChunks: Chunk[] = [];
  
  for (const chunk of chunks) {
    const tokenCount = countTokens(chunk.content);
    
    if (tokenCount <= maxTokens) {
      validatedChunks.push(chunk);
    } else {
      // Tenta dividir por sentenças primeiro
      const sentenceChunks = chunkBySentences(chunk.content, maxTokens);
      
      // Valida cada chunk de sentenças
      for (const sentenceChunk of sentenceChunks) {
        const sentenceTokenCount = countTokens(sentenceChunk.content);
        
        if (sentenceTokenCount <= maxTokens) {
          validatedChunks.push({
            ...sentenceChunk,
            section: chunk.section,
            role: chunk.role,
            chunkIndex: validatedChunks.length,
          });
        } else {
          // Último recurso: dividir por caracteres
          const charChunks = chunkByCharacters(sentenceChunk.content, maxTokens);
          charChunks.forEach((charChunk, idx) => {
            validatedChunks.push({
              ...charChunk,
              section: chunk.section,
              role: chunk.role,
              chunkIndex: validatedChunks.length,
            });
          });
        }
      }
    }
  }
  
  return validatedChunks;
}

