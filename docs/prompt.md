esse projeto é o seguinte: nós temos alguns documentos docx de peticoes, procuracoes, peças, entre outros documentos jurídicos. Isso foi guardado por nós empresa durante muito tempo. O que queremos: gerar um RAG a partir desses documentos, mas não queremos que o RAG seja de informacoes do documento, o objetivo do RAG é ter dado de como gerar documento, de templates bons de documento, para "treinar" um agente em como gerar documentos juridos. Entao resumidamente o objetivo dos docx é ser de exemplo para agente de IA de como um documento jurido deve ser estruturado com diferentes tipos de documentos. Temos algumas pastas de 01. Trabalhista até 25. Contratos.

Outro colaborador fez algumas coisas já. Ele fez:
1 - docs_raw sao todos os .docx brutos convertidos em arquivo unico .jsonl

2 - docs_filtered = item 1 acima só que limpa, ou seja, tirando outliers (arquivos corrompidos, pequenos demais ou grandes demais)

3 - curadoria.csv = gerado pela Open AI, classificando o docs_filtered

4 - selecao_rag.csv = é o curadoria.csv tratado, aplicando colunas com seleção de quais docs vao ser utilizados de fato

5 - curadoria + selecao_rag = enviado à Open AI pra criar os chunks e embeddings, que gerou o embeddings.jsonl

6 - Esse embeddings.jsonl tem os chunks + embeddings, que serão vetorizados numa vector store.

Ele disse assim:

Lições Aprendidas:

1 - deveria sim ter aplicado markdown a tudo antes de rodar
2 - deveria ter escolhido muito melhor os critérios pra Open AI fazer a classificação (curadoria) e resumo. Os critérios foram doc_id, tipo_documento (petição, recurso), area_direito, modelo_ou_peça_real, qualidade_clareza, qualidade_estrutura, risco (??), resumo, nota.

Então o que eu quero:

1 - primeiro analisar o codigo que foi desenvolvido para entender o que ele fazer
2 - segundo melhorar a classificacao dos documentos. Como? Do jeito que foi feito e melhor
3 - Acho que faz mais sentido embeddar, vetorizar, e criar o RAG a partir de markdowns pois nosso agente de IA gera documentos em markdown, entao para ele "aprender" seria melhor em markdown
4 - usar a doc do ai-sdk para embedar os chunks utilizando opena. https://ai-sdk.dev/docs/ai-sdk-core/embeddings
5 - ja temos um sistema mvp que tem agentes de ia e usa o ai-sdk. Ele usa um banco de dados neon com o drizzle de orm. quero que voce gere esse RAG dentro deste banco. Sei que tem migracoes para criar, quero que voce crie, tbm sei que é preciso habilitar uns plgins la, quero que voce me fale que plugins tenho que habilitar. Ou seja, utilizar o banco de dados existente. path do sistema:/Users/william/development/ai-chatbot. o env fica aqui: /Users/william/development/ai-chatbot/.env.local

doc da ai-sdk https://ai-sdk.dev/llms.txt
