import json
import psycopg2
from psycopg2.extras import execute_values

# ⬇️ CONFIG DO BANCO (ajuste APENAS a senha)
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "LegalWise102938!",
    "host": "db.lctaxhyxuaebmxgmbcfi.supabase.co",
    "port": 5432,
    "sslmode": "require"
}

EMBEDDINGS_FILE = "embeddings.jsonl"
BATCH_SIZE = 500

# ======================================
# FUNÇÃO AUXILIAR DE INSERT EM BATCH
# ======================================

def insert_batch(cur, batch):
    """
    Insere um lote de registros na tabela lw_embeddings.
    embedding vem como string '[0.1, 0.2, ...]' e é convertida para vector.
    """
    sql = """
        INSERT INTO lw_embeddings (doc_id, chunk_index, content, embedding)
        VALUES %s
    """
    template = "(%s, %s, %s, %s::vector)"
    execute_values(cur, sql, batch, template=template)

# ======================================
# PROCESSO PRINCIPAL
# ======================================

def main():
    print("🚀 Conectando ao banco da Supabase...")

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    # Só pra garantir que a tabela existe (idempotente)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lw_embeddings (
            doc_id      text,
            chunk_index integer,
            content     text,
            embedding   vector(1536),
            created_at  timestamptz DEFAULT now()
        );
    """)

    print(f"📄 Lendo embeddings do arquivo: {EMBEDDINGS_FILE}")

    if not os.path.exists(EMBEDDINGS_FILE):
        print(f"❌ Arquivo {EMBEDDINGS_FILE} não encontrado!")
        return

    batch = []
    total = 0
    linha = 0

    with open(EMBEDDINGS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            linha += 1
            line = line.strip()
            if not line:
                continue

            obj = json.loads(line)

            doc_id = obj.get("doc_id") or obj.get("id")
            chunk_index = obj.get("chunk_index", 0)
            content = obj.get("text") or obj.get("content") or ""

            embedding = obj.get("embedding")
            if not embedding:
                print(f"⚠️  Linha {linha} sem 'embedding', pulando.")
                continue

            # converte lista para string no formato do pgvector
            embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

            batch.append((doc_id, chunk_index, content, embedding_str))

            if len(batch) >= BATCH_SIZE:
                insert_batch(cur, batch)
                total += len(batch)
                print(f"✅ Inserido lote (+{len(batch)})  total={total}")
                batch = []

    # Último lote
    if batch:
        insert_batch(cur, batch)
        total += len(batch)
        print(f"✅ Inserido lote final (+{len(batch)}) total={total}")

    conn.commit()
    cur.close()
    conn.close()

    print("🎯 Importação concluída!")
    print(f"📊 Total inserido: {total} linhas")

if __name__ == "__main__":
    main()