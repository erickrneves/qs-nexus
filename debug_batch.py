import sys
from openai import OpenAI

client = OpenAI()

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 debug_batch.py <BATCH_ID>")
        return

    batch_id = sys.argv[1]
    batch = client.batches.retrieve(batch_id)
    print("Status:", batch.status)

    # Se houver arquivo de erros
    error_file_id = getattr(batch, "error_file_id", None)
    if error_file_id:
        print("Baixando arquivo de erro:", error_file_id)
        content = client.files.content(error_file_id).text
        with open("batch_errors.jsonl", "w") as f:
            f.write(content)
        print("Erro salvo em batch_errors.jsonl")
    else:
        print("Nenhum error_file_id encontrado.")

if __name__ == "__main__":
    main()
