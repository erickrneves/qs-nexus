/**
 * Pool de concorrência para gerenciar processamento paralelo
 * com limite de workers simultâneos e retry logic
 */

export interface Task<T> {
  id: string;
  execute: () => Promise<T>;
  retries?: number;
}

export interface TaskResult<T> {
  taskId: string;
  success: boolean;
  result?: T;
  error?: string;
  retries: number;
}

export interface PoolStats {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
}

export class ConcurrencyPool<T> {
  private queue: Task<T>[] = [];
  private running: Set<string> = new Set();
  private results: Map<string, TaskResult<T>> = new Map();
  private maxConcurrency: number;
  private maxRetries: number;
  private retryDelay: number;
  private onProgress?: (stats: PoolStats) => void;
  private onTaskFailed?: (taskId: string, error: string) => void | Promise<void>;

  constructor(options: {
    maxConcurrency?: number;
    maxRetries?: number;
    retryDelay?: number;
    onProgress?: (stats: PoolStats) => void;
    onTaskFailed?: (taskId: string, error: string) => void | Promise<void>;
  } = {}) {
    this.maxConcurrency = options.maxConcurrency || 4;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.onProgress = options.onProgress;
    this.onTaskFailed = options.onTaskFailed;
  }

  /**
   * Adiciona uma tarefa à fila
   */
  add(task: Task<T>): void {
    this.queue.push(task);
  }

  /**
   * Adiciona múltiplas tarefas à fila
   */
  addBatch(tasks: Task<T>[]): void {
    this.queue.push(...tasks);
  }

  /**
   * Processa todas as tarefas na fila respeitando o limite de concorrência
   */
  async processAll(): Promise<TaskResult<T>[]> {
    const allTaskIds = new Set(this.queue.map(t => t.id));
    
    while (this.queue.length > 0 || this.running.size > 0) {
      // Processa até o limite de concorrência
      while (this.running.size < this.maxConcurrency && this.queue.length > 0) {
        const task = this.queue.shift()!;
        this.executeTask(task);
      }

      // Aguarda um pouco antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Retorna resultados na ordem das taskIds originais
    return Array.from(allTaskIds).map(id => this.results.get(id)!);
  }

  /**
   * Executa uma tarefa com retry logic
   */
  private async executeTask(task: Task<T>, attempt: number = 0): Promise<void> {
    const taskId = task.id;
    this.running.add(taskId);
    this.updateProgress();

    try {
      const result = await task.execute();
      
      this.results.set(taskId, {
        taskId,
        success: true,
        result,
        retries: attempt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const DEBUG = process.env.DEBUG === 'true';
      
      // Só loga erros na primeira tentativa ou se DEBUG estiver ativo
      if (attempt === 0 || DEBUG) {
        console.error(`[POOL] Erro na tarefa ${taskId.substring(0, 50)}... (tentativa ${attempt + 1}/${this.maxRetries + 1}): ${errorMessage}`);
        if (DEBUG && attempt === 0 && error instanceof Error) {
          console.error(`[POOL] Stack trace: ${error.stack}`);
        }
      }
      
      // Tenta novamente se ainda há tentativas disponíveis
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Backoff exponencial
        const DEBUG = process.env.DEBUG === 'true';
        if (DEBUG) console.error(`[POOL] Retry em ${delay}ms para ${taskId.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.running.delete(taskId);
        this.updateProgress();
        
        // Re-executa a tarefa
        return this.executeTask(task, attempt + 1);
      }

      // Esgotou tentativas, marca como falha
      console.error(`[POOL] Falha final após ${attempt + 1} tentativas: ${taskId.substring(0, 50)}... - ${errorMessage}`);
      
      // Chama callback de falha definitiva se fornecido
      if (this.onTaskFailed) {
        try {
          await this.onTaskFailed(taskId, errorMessage);
        } catch (callbackError) {
          console.error(`[POOL] Erro no callback onTaskFailed: ${callbackError}`);
        }
      }
      
      this.results.set(taskId, {
        taskId,
        success: false,
        error: errorMessage,
        retries: attempt,
      });
    } finally {
      this.running.delete(taskId);
      this.updateProgress();
    }
  }

  /**
   * Atualiza estatísticas e chama callback de progresso
   */
  private updateProgress(): void {
    if (this.onProgress) {
      const stats: PoolStats = {
        total: this.results.size + this.queue.length + this.running.size,
        completed: Array.from(this.results.values()).filter(r => r.success).length,
        failed: Array.from(this.results.values()).filter(r => !r.success).length,
        inProgress: this.running.size,
        pending: this.queue.length,
      };
      this.onProgress(stats);
    }
  }

  /**
   * Retorna estatísticas atuais
   */
  getStats(): PoolStats {
    return {
      total: this.results.size + this.queue.length + this.running.size,
      completed: Array.from(this.results.values()).filter(r => r.success).length,
      failed: Array.from(this.results.values()).filter(r => !r.success).length,
      inProgress: this.running.size,
      pending: this.queue.length,
    };
  }

  /**
   * Limpa a fila e resultados
   */
  clear(): void {
    this.queue = [];
    this.running.clear();
    this.results.clear();
  }
}

