import os
import json
from pathlib import Path
from docx import Document
from tqdm import tqdm

# Base = pasta atual onde você está rodando o script
# Ele vai varrer TODAS as subpastas (04. Tributário, 08. Previdenciário, etc.)
BASE_DIR = Path(".").resolve()

OUTPUT_FILE = "docs_raw.jsonl"


def extract_text_from_docx(path: Path) -> str:
    try:
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        print(f"[ERRO] Falha ao ler {path}: {e}")
        return ""


def main():
    print(f"Varrendo DOCX a partir de: {BASE_DIR}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        for root, _, files in os.walk(BASE_DIR):
            for fname in tqdm(files, desc="Processando .docx", leave=False):
                if not fname.lower().endswith(".docx"):
                    continue

                fpath = Path(root) / fname
                text = extract_text_from_docx(fpath).strip()
                if not text:
                    continue

                words = len(text.split())

                record = {
                    "id": fname,
                    "path": str(fpath),
                    "words": words,
                    "text": text
                }

                out.write(json.dumps(record, ensure_ascii=False) + "\n")

    print("Concluído! Arquivo gerado:", OUTPUT_FILE)


if __name__ == "__main__":
    main()
