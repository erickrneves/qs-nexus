import json

INPUT_FILE = "docs_filtered.jsonl"
BATCH_FILE = "batch_requests.jsonl"

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

MAX_CHARS = 12000  # limite de caracteres por documento para classificação


def main():
    total = 0
    with open(INPUT_FILE, "r", encoding="utf-8") as fin, \
         open(BATCH_FILE, "w", encoding="utf-8") as fout:

        for line in fin:
            doc = json.loads(line)
            text = doc.get("text", "")
            if not text:
                continue

            total += 1

            if len(text) > MAX_CHARS:
                text = text[:MAX_CHARS]

            body = {
                "model": "gpt-4.1-mini",
                "response_format": {"type": "json_object"},
                "input": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"DOCUMENTO_ID: {doc['id']}\n\nTEXTO:\n{text}"
                    },
                ],
            }

            batch_line = {
                "custom_id": doc["id"],
                "method": "POST",
                "url": "/v1/responses",
                "body": body,
            }

            fout.write(json.dumps(batch_line, ensure_ascii=False) + "\n")

    print("Total de documentos incluídos no batch:", total)
    print("Arquivo gerado:", BATCH_FILE)


if __name__ == "__main__":
    main()
