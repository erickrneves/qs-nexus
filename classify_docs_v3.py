import json
import time
from pathlib import Path
from openai import OpenAI

client = OpenAI()

INPUT_FILE = "docs_filtered.jsonl"
OUTPUT_FILE = "classification_results.jsonl"

SYSTEM_PROMPT = """
Você é um classificador de documentos jurídicos em português.

Receberá o ID do documento e o texto (ou parte) de uma peça/modelo jurídico.
Sua tarefa é ANALISAR e devolver EXCLUSIVAMENTE um JSON válido, neste formato:

{
  "id": "ID_DO_DOCUMENTO",
  "tipo_documento": "peticao_inicial | contestacao | recurso | parecer | contrato | modelo_generico | outro",
  "area_direito": "civil | trabalhista | tributario | empresarial | consumidor | penal | administrativo | previdenciario | outro",
  "modelo_ou_peca_real": "modelo | peca_real",
  "qualidade_clareza": 1,
  "qualidade_estrutura": 1,
  "risco": 1,
  "resumo": "até 2 linhas explicando o conteúdo"
}

Regras:
- Use SEMPRE inteiros de 1 a 10 para qualidade_clareza e qualidade_estrutura (10 = excelente).
- Use SEMPRE inteiros de 1 a 5 para risco (1 = baixíssimo risco, 5 = alto risco/teses frágeis ou sensíveis).
- Se não tiver certeza, seja conservador.
- NUNCA retorne nada fora do JSON final.
"""

MAX_CHARS = 12000  # para não mandar textos gigantes


def load_processed_ids():
    ids = set()
    out_path = Path(OUTPUT_FILE)
    if not out_path.exists():
        return ids

    with open(out_path, "r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                if "id" in rec:
                    ids.add(rec["id"])
            except Exception:
                continue
    return ids


def iter_docs():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            doc = json.loads(line)
            doc_id = doc.get("id") or doc.get("document_id")
            text = doc.get("text", "")
            if not doc_id or not text:
                continue
            if len(text) > MAX_CHARS:
                text = text[:MAX_CHARS]
            yield doc_id, text


def main():
    processed_ids = load_processed_ids()

    docs = list(iter_docs())
    total = len(docs)
    pendentes = [d for d in docs if d[0] not in processed_ids]

    print(f"Total de documentos no arquivo  : {total}")
    print(f"Documentos já processados       : {len(processed_ids)}")
    print(f"Documentos a processar agora    : {len(pendentes)}")

    out_path = Path(OUTPUT_FILE)
    with open(out_path, "a", encoding="utf-8") as fout:
        for doc_id, text in pendentes:
            while True:
                try:
                    resp = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {
                                "role": "user",
                                "content": f"ID: {doc_id}\n\nTEXTO:\n{text}",
                            },
                        ],
                        temperature=0,
                    )

                    content = resp.choices[0].message.content

                    try:
                        parsed = json.loads(content)
                    except Exception as e:
                        parsed = {
                            "id": doc_id,
                            "raw_response": content,
                            "parse_error": str(e),
                        }

                    if "id" not in parsed:
                        parsed["id"] = doc_id

                    fout.write(json.dumps(parsed, ensure_ascii=False) + "\n")
                    fout.flush()

                    print(f"[OK] {doc_id}")
                    break

                except Exception as e:
                    print(f"[ERRO] {doc_id}: {e}")
                    print("Aguardando 5s e tentando novamente...")
                    time.sleep(5)

    print("Concluído. Resultados em:", OUTPUT_FILE)


if __name__ == "__main__":
    main()
