import json
import time
from pathlib import Path
from tqdm import tqdm
from openai import OpenAI

client = OpenAI()

INPUT_FILE = "docs_filtered.jsonl"
OUTPUT_FILE = "classification_results.jsonl"

SYSTEM_PROMPT = """
Você é um classificador de documentos jurídicos em português.
Leia o texto fornecido e responda APENAS em JSON, no seguinte formato:

{
  "document_id": "...",
  "tipo_documento": "peticao_inicial | contestacao | recurso | parecer | modelo_generico | outro",
  "area_direito": "civil | trabalhista | tributario | empresarial | consumidor | penal | administrativo | previdenciario | outro",
  "modelo_ou_peca_real": "modelo | peca_real",
  "qualidade_clareza": 1,
  "qualidade_estrutura": 1,
  "ano_estimado": 2020,
  "defasagem": "alta | media | baixa",
  "risco": 1,
  "contém_dados_pessoais": true
}

Regras:
- Use SEMPRE inteiros para notas (1 a 10) e risco (1 a 5).
- 'risco' alto (4 ou 5) quando houver teses frágeis, conteúdo antiético ou muitas informações sensíveis.
- Se não tiver certeza, estime de forma conservadora.
- Não escreva nada fora do JSON final.
"""

MAX_CHARS = 12000  # limite de caracteres por documento


def iter_docs():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            doc = json.loads(line)
            text = doc.get("text", "")
            if not text:
                continue
            if len(text) > MAX_CHARS:
                text = text[:MAX_CHARS]
            yield doc["id"], text


def main():
    out_path = Path(OUTPUT_FILE)
    processed_ids = set()

    # se o script cair no meio, conseguimos retomar
    if out_path.exists():
        with open(out_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                    processed_ids.add(rec["document_id"])
                except Exception:
                    continue

    print("Documentos já processados:", len(processed_ids))

    with open(OUTPUT_FILE, "a", encoding="utf-8") as fout:
        for doc_id, text in tqdm(list(iter_docs()), desc="Classificando docs"):
            if doc_id in processed_ids:
                continue

            while True:
                try:
                    resp = client.responses.create(
                        model="gpt-4.1-mini",
                        response_format={"type": "json_object"},
                        input=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {
                                "role": "user",
                                "content": f"DOCUMENTO_ID: {doc_id}\n\nTEXTO:\n{text}",
                            },
                        ],
                    )

                    content = resp.output[0].content[0].text
                    data = json.loads(content)
                    fout.write(json.dumps(data, ensure_ascii=False) + "\n")
                    fout.flush()
                    break

                except Exception as e:
                    print(f"\n[ERRO] {doc_id}: {e}")
                    print("Aguardando 5s e tentando novamente...")
                    time.sleep(5)


if __name__ == "__main__":
    main()
