import json

INPUT_FILE = "docs_raw.jsonl"
OUTPUT_FILE = "docs_filtered.jsonl"

MIN_WORDS = 300     # mínimo de palavras para considerar útil
MAX_WORDS = 25000   # máximo para evitar aberrações

total = 0
kept = 0
skipped_small = 0
skipped_big = 0

with open(INPUT_FILE, "r", encoding="utf-8") as fin, \
     open(OUTPUT_FILE, "w", encoding="utf-8") as fout:
    for line in fin:
        total += 1
        doc = json.loads(line)
        w = doc.get("words", 0)

        if w < MIN_WORDS:
            skipped_small += 1
            continue
        if w > MAX_WORDS:
            skipped_big += 1
            continue

        kept += 1
        fout.write(json.dumps(doc, ensure_ascii=False) + "\n")

print("Total lidos   :", total)
print("Mantidos      :", kept)
print("Descartados < MIN_WORDS:", skipped_small)
print("Descartados > MAX_WORDS:", skipped_big)
print("Arquivo gerado:", OUTPUT_FILE)
