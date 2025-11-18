from openai import OpenAI

client = OpenAI()

INPUT_FILE = "batch_requests.jsonl"

def main():
    # 1) upload do arquivo de requisições
    with open(INPUT_FILE, "rb") as f:
        file_obj = client.files.create(
            file=f,
            purpose="batch",
        )
    print("Input file id:", file_obj.id)

    # 2) criação do job de batch usando /v1/responses
    batch = client.batches.create(
        input_file_id=file_obj.id,
        endpoint="/v1/responses",
        completion_window="24h",
    )
    print("Batch id:", batch.id)
    print("Status inicial:", batch.status)

if __name__ == "__main__":
    main()
