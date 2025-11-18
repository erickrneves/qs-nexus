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
            "documento_id",
            "tipo_documento",
            "area_direito",
            "modelo_ou_peca_real",
            "qualidade_clareza",
            "qualidade_estrutura",
            "risco",
            "resumo"
        ])

        linhas = 0

        for line in infile:
            line = line.strip()
            if not line:
                continue

            try:
                item = json.loads(line)
            except Exception as e:
                print(f"[ERRO] Linha inválida, pulando. Detalhe: {e}")
                continue

            writer.writerow([
                item.get("id", ""),
                item.get("tipo_documento", ""),
                item.get("area_direito", ""),
                item.get("modelo_ou_peca_real", ""),
                item.get("qualidade_clareza", ""),
                item.get("qualidade_estrutura", ""),
                item.get("risco", ""),
                item.get("resumo", ""),
            ])

            linhas += 1

    print(f"[OK] CSV gerado com sucesso: {OUTPUT_FILE} ({linhas} linhas)")

if __name__ == "__main__":
    main()
