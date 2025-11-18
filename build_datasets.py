import csv
from pathlib import Path

INPUT_FILE = Path("selecao_rag.csv")

def detectar_delimitador(path: Path) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        first_line = f.readline()
    # Se tiver ; usamos ;, senão vírgula
    return ";" if ";" in first_line and "," not in first_line else ","

def main():
    if not INPUT_FILE.exists():
        print(f"[ERRO] Arquivo {INPUT_FILE} não encontrado na pasta atual.")
        return

    delimiter = detectar_delimitador(INPUT_FILE)
    print(f"[INFO] Usando delimitador: '{delimiter}'")

    with open(INPUT_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        rows = list(reader)

    if not rows:
        print("[ERRO] Nenhuma linha de dados encontrada.")
        return

    # Descobrir o nome da coluna de nota (NOTA, nota, etc.)
    cols = rows[0].keys()
    nota_col = None
    for c in cols:
        if c.lower() == "nota":
            nota_col = c
            break

    if nota_col is None:
        print("[ERRO] Não encontrei coluna 'NOTA' ou 'nota' no CSV.")
        print("Colunas disponíveis:", list(cols))
        return

    print(f"[INFO] Coluna de nota detectada: {nota_col}")

    gold_rows = []
    silver_rows = []
    curated_rows = []

    for row in rows:
        raw = row.get(nota_col, "").strip()
        if not raw:
            continue

        # Converter "56,25" -> 56.25
        raw_num = raw.replace(".", "").replace(",", ".") if "," in raw and "." in raw else raw.replace(",", ".")
        try:
            nota = float(raw_num)
        except ValueError:
            # Ignora linha se a nota não for numérica
            continue

        # Recalcular flags em Python (independente do Excel)
        # Regra:
        # GOLD  -> nota > 60
        # SILVER -> 56 <= nota < 60
        row["RAG_GOLD"] = "SIM" if nota > 60 else "NÃO"
        row["RAG_SILVER"] = "SIM" if 56 <= nota < 60 else "NÃO"

        if row["RAG_GOLD"] == "SIM":
            gold_rows.append(row)
            curated_rows.append(row)
        elif row["RAG_SILVER"] == "SIM":
            silver_rows.append(row)
            curated_rows.append(row)

    print(f"[INFO] Total linhas lidas:   {len(rows)}")
    print(f"[INFO] GOLD selecionados:    {len(gold_rows)}")
    print(f"[INFO] SILVER selecionados:  {len(silver_rows)}")
    print(f"[INFO] Curado (GOLD+SILVER): {len(curated_rows)}")

    if not curated_rows:
        print("[ALERTA] Nenhuma linha classificada como GOLD ou SILVER. Verifique a coluna NOTA.")
        return

    # Garantir que novos arquivos tenham as mesmas colunas + flags
    fieldnames = list(rows[0].keys())
    if "RAG_GOLD" not in fieldnames:
        fieldnames.append("RAG_GOLD")
    if "RAG_SILVER" not in fieldnames:
        fieldnames.append("RAG_SILVER")

    def salvar(nome, data):
        if not data:
            print(f"[ALERTA] Nenhuma linha para {nome}, não vou gerar arquivo.")
            return
        path = Path(nome)
        with open(path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=delimiter)
            writer.writeheader()
            writer.writerows(data)
        print(f"[OK] Arquivo gerado: {path} ({len(data)} linhas)")

    salvar("dataset_gold.csv", gold_rows)
    salvar("dataset_silver.csv", silver_rows)
    salvar("dataset_curado.csv", curated_rows)

if __name__ == "__main__":
    main()
