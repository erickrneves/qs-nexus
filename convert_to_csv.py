import json
import csv

INPUT_FILE = "classification_results.jsonl"
OUTPUT_FILE = "curadoria.csv"

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as infile, \
         open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as outfile:

        writer = csv.writer(outfile)

        # Cabeçalho do CSV
        writer.writerow([
            "documento",
            "área",
            "tipo_peca",
            "tema",
            "tamanho",
            "qualidade",
            "notas"
        ])

        for line in infile:
            item = json.loads(line)

            doc = item.get("document_id", "")
            c = item.get("classification", {})

            writer.writerow([
                doc,
                c.get("area", ""),
                c.get("tipo_peca", ""),
                c.get("tema", ""),
                c.get("tamanho", ""),
                c.get("qualidade", ""),
                c.get("notas", ""),
            ])

    print(f"[OK] CSV gerado com sucesso: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
