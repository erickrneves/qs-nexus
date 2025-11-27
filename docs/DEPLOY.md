# Deploy QS Nexus no Heroku

Este guia explica como fazer deploy do QS Nexus no Heroku.

## Pré-requisitos

1. Conta Heroku
2. Heroku CLI instalado
3. NeonDB configurado
4. Stack Auth configurado
5. OpenAI Assistant criado

## Passo a Passo

### 1. Criar App no Heroku

```bash
heroku create qs-nexus
```

### 2. Configurar Variáveis de Ambiente

```bash
# Database
heroku config:set DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# OpenAI
heroku config:set OPENAI_API_KEY="sk-proj-..."
heroku config:set OPENAI_ASSISTANT_ID="asst_..."
heroku config:set EMBEDDING_MODEL="text-embedding-3-small"

# Stack Auth
heroku config:set STACK_PROJECT_ID="..."
heroku config:set STACK_PUBLISHABLE_CLIENT_KEY="pck_..."
heroku config:set STACK_SECRET_SERVER_KEY="ssk_..."

# Sessão
heroku config:set SESSION_SECRET="$(openssl rand -base64 32)"

# Node
heroku config:set NODE_ENV="production"
```

### 3. Deploy

```bash
git push heroku main
```

### 4. Executar Migrations

```bash
heroku run npm run db:migrate
```

### 5. Verificar Logs

```bash
heroku logs --tail
```

## Configurações Adicionais

### Escalar Dyno

Para aplicações de produção, considere usar um dyno maior:

```bash
heroku ps:scale web=1:basic    # Básico ($7/mês)
heroku ps:scale web=1:standard-1x  # Standard ($25/mês)
heroku ps:scale web=1:standard-2x  # Standard 2X ($50/mês)
```

### SSL

O Heroku fornece SSL automaticamente em domínios *.herokuapp.com.

Para domínio customizado:

```bash
heroku domains:add app.qsconsultoria.com.br
heroku certs:auto:enable
```

### Logs e Monitoramento

```bash
# Logs em tempo real
heroku logs --tail

# Adicionar Papertrail para logs persistentes
heroku addons:create papertrail:choklad

# Adicionar New Relic para monitoramento
heroku addons:create newrelic:wayne
```

## Variáveis de Ambiente Completas

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| DATABASE_URL | Sim | URL de conexão NeonDB |
| OPENAI_API_KEY | Sim | Chave API OpenAI |
| OPENAI_ASSISTANT_ID | Sim | ID do Assistant |
| EMBEDDING_MODEL | Não | Modelo de embedding (padrão: text-embedding-3-small) |
| STACK_PROJECT_ID | Sim | ID projeto Stack Auth |
| STACK_PUBLISHABLE_CLIENT_KEY | Sim | Chave pública Stack Auth |
| STACK_SECRET_SERVER_KEY | Sim | Chave secreta Stack Auth |
| SESSION_SECRET | Sim | Segredo para JWT |
| NODE_ENV | Não | Ambiente (production) |
| BITRIX_WEBHOOK_BASE | Não | URL webhook Bitrix24 |
| GOOGLE_GENERATIVE_AI_API_KEY | Não | Chave Google AI (estruturação de PDFs) |

## Troubleshooting

### Erro de Memória

Se o app crashar por memória:

```bash
heroku ps:scale web=1:standard-2x
```

### Erro de Timeout

Para operações longas (processamento de SPED):

1. Aumente o timeout no `next.config.js`
2. Use background jobs com Redis + Bull
3. Considere usar Heroku Scheduler para operações pesadas

### Erro de Conexão com Banco

Verifique se:

1. A string de conexão inclui `?sslmode=require`
2. O IP do Heroku está na whitelist do NeonDB
3. As credenciais estão corretas

## Custos Estimados

| Recurso | Custo Mensal |
|---------|--------------|
| Heroku Basic Dyno | $7 |
| NeonDB Free | $0 |
| OpenAI Embeddings | $5-20 (uso) |
| OpenAI Assistants | $10-50 (uso) |
| **Total Estimado** | **$22-77/mês** |

## Backup

### Banco de Dados

O NeonDB oferece backup automático no plano Pro. Para exportar manualmente:

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Arquivos

Arquivos uploaded são armazenados temporariamente. Para produção, considere:

1. AWS S3
2. Cloudflare R2
3. DigitalOcean Spaces

