import sys
from openai import OpenAI

client = OpenAI()

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 check_batch.py <BATCH_ID>")
        return

    batch_id = sys.argv[1]
    batch = client.batches.retrieve(batch_id)
    print("Batch id:", batch.id)
    print("Status :", batch.status)
    print("Output file id:", getattr(batch, "output_file_id", None))
    print("Erro file id  :", getattr(batch, "error_file_id", None))

if __name__ == "__main__":
    main()
