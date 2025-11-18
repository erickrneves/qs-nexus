import json
from pathlib import Path
import time

from openai import OpenAI
from tqdm import tqdm

# Configurações principais
INPUT_FILE = "docs_filtered.jsonl"   # textos limpos
OUTPUT_FILE = "embeddings.jsonl"     # saída com vetores
MODEL = "text-embedding-3-small"     # custo/benefício ótimo pra RAG
BATCH_SIZE = 64                      # quantos chunks por requisição
MAX_CHARS = 4000                     # tamanho máximo de cada chunk (aprox tokens)


def chunk_text(text: str, max_chars: int = MAX_CHARS):
    text = text.strip()
    if not text:
        return []
    # corta em blocos de até max_chars, sem frescura
    return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]


def main():
    base_path = Path(INPUT_FILE)
    if not base_path.exists():
        print(f"[ERRO] Arquivo {INPUT_FILE} não encontrado. Confere o nome/pasta.")
        return

    client = OpenAI()

    total_docs = 0
    total_chunks = 0

    batch_texts = []
    batch_meta = []

    with open(INPUT_FILE, "r", encoding="utf-8") as fin, \
         open(OUTPUT_FILE, "w", encoding="utf-8") as fout:

        for line in tqdm(fin, desc="Lendo documentos"):
            line = line.strip()
            if not line:
                continue

            try:
                doc = json.loads(line)
            except Exception as e:
                print(f"[ERRO] Linha inválida, ignorando: {e}")
                continue

            doc_id = doc.get("id") or doc.get("document_id") or "sem_id"
            text = doc.get("text") or ""

            chunks = chunk_text(text)
            if not chunks:
                continue

            for idx, chunk in enumerate(chunks):
                batch_texts.append(chunk)
                batch_meta.append({
                    "doc_id": doc_id,
                    "chunk_index": idx,
                })

                if len(batch_texts) >= BATCH_SIZE:
                    # dispara uma chamada de embeddings
                    try:
                        resp = client.embeddings.create(
                            model=MODEL,
                            input=batch_texts,
                        )
                    except Exception as e:
                        print(f"[ERRO] Falha na chamada de embeddings: {e}")
                        print("Aguardando 5s e tentando novamente...")
                        time.sleep(5)
                        continue

                    for meta, emb in zip(batch_meta, resp.data):
                        record = {
                            "doc_id": meta["doc_id"],
                            "chunk_index": meta["chunk_index"],
                            "embedding": emb.embedding,
                        }
                        fout.write(json.dumps(record, ensure_ascii=False) + "\n")

                    total_chunks += len(batch_texts)
                    batch_texts = []
                    batch_meta = []

            total_docs += 1

        # flush final, se sobrou algo no batch
        if batch_texts:
            try:
                resp = client.embeddings.create(
                    model=MODEL,
                    input=batch_texts,
                )
                for meta, emb in zip(batch_meta, resp.data):
                    record = {
                        "doc_id": meta["doc_id"],
                        "chunk_index": meta["chunk_index"],
                        "embedding": emb.embedding,
                    }
                    fout.write(json.dumps(record, ensure_ascii=False) + "\n")
                total_chunks += len(batch_texts)
            except Exception as e:
                print(f"[ERRO] Falha na chamada final de embeddings: {e}")

    print(f"\n[OK] Processamento concluído.")
    print(f"Docs lidos: {total_docs}")
    print(f"Chunks vetorizados: {total_chunks}")
    print(f"Arquivo gerado: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
