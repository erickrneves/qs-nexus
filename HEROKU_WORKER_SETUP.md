# Configuração Heroku Worker para Processamento SPED

## ✅ Deploy Concluído

O código foi deployado com sucesso! Agora você precisa configurar o Redis e ativar o worker dyno.

---

## 📋 Passos de Configuração

### 1. Adicionar Redis ao Heroku

```bash
heroku addons:create heroku-redis:mini -a qs-nexus
```

**Custos:**
- `heroku-redis:mini` - **GRÁTIS** até 25MB
- Suficiente para fila de processamento SPED

**Verificar instalação:**
```bash
heroku addons:info heroku-redis -a qs-nexus
heroku config:get REDIS_URL -a qs-nexus
```

---

### 2. Ativar Worker Dyno

```bash
heroku ps:scale worker=1 -a qs-nexus
```

**Custos:**
- Worker dyno - **~$7/mês** (eco dyno)
- Compartilha 1000 horas grátis com web dyno

**Verificar status:**
```bash
heroku ps -a qs-nexus
```

Deve mostrar:
```
=== web (Eco): npm run start (1)
web.1: up

=== worker (Eco): npm run worker (1)
worker.1: up
```

---

### 3. Monitorar Worker em Tempo Real

```bash
# Ver logs do worker
heroku logs --tail --dyno worker -a qs-nexus

# Ver todos os logs
heroku logs --tail -a qs-nexus
```

**O que você verá:**
```
🚀 Starting SPED Worker...
📍 Environment: production
📍 Redis URL: ✅ Configured
✅ Redis connected
✅ Redis ready
🚀 SPED Worker started and listening for jobs...
✅ Worker is running. Press Ctrl+C to stop.
```

---

## 🧪 Testar Processamento

### 1. Fazer Upload de SPED

1. Acesse https://qs-nexus.herokuapp.com/sped
2. Clique "Upload SPED"
3. Selecione arquivo `.txt` ou `.csv` (SPED ECD)
4. Envie

### 2. Acompanhar Processamento

**Via Logs:**
```bash
heroku logs --tail -a qs-nexus
```

**Você verá:**
```
📋 SPED job added to queue: <uuid>
🔄 Processing SPED job <uuid>...
📄 Parsing arquivo.txt...
📊 Parsed: 150 accounts, 500 entries
💾 Saving 150 accounts...
✅ Saved 150 accounts
💾 Saving 500 entries...
✅ Saved 500 entries
✅ SPED arquivo.txt processed successfully!
✅ Job <uuid> completed successfully
```

**Via Interface:**
- Status mudará de `pending` → `processing` → `completed`
- Dados aparecerão em `/sped/[id]`

---

## 🔧 Comandos Úteis

### Ver Status de Todos os Dynos
```bash
heroku ps -a qs-nexus
```

### Reiniciar Worker
```bash
heroku restart worker -a qs-nexus
```

### Desligar Worker (economizar horas)
```bash
heroku ps:scale worker=0 -a qs-nexus
```

### Ver Uso de Redis
```bash
heroku redis:info -a qs-nexus
```

### Ver Jobs na Fila (Redis CLI)
```bash
heroku redis:cli -a qs-nexus
> KEYS *
> LLEN bull:sped-processing:wait
> LLEN bull:sped-processing:active
> LLEN bull:sped-processing:completed
```

---

## ⚠️ Troubleshooting

### Worker Não Inicia

**Problema:** `heroku ps` mostra worker como `crashed`

**Solução:**
```bash
heroku logs --tail --dyno worker -a qs-nexus
```

**Causas comuns:**
1. Redis não configurado → `REDIS_URL not configured`
2. Erro de build → verificar `npm run build`

### Jobs Não Processam

**Problema:** Upload funciona mas status fica `pending`

**Verificar:**
```bash
# 1. Worker está rodando?
heroku ps -a qs-nexus

# 2. Redis conectado?
heroku logs --tail --dyno worker -a qs-nexus | grep Redis

# 3. Há jobs na fila?
heroku redis:cli -a qs-nexus
> LLEN bull:sped-processing:wait
```

**Solução:**
- Se worker não está up: `heroku restart worker -a qs-nexus`
- Se Redis não conectou: `heroku config:get REDIS_URL -a qs-nexus`

### Arquivo Processado com Erro

**Problema:** Status fica `failed`

**Ver motivo:**
```bash
heroku logs --tail -a qs-nexus | grep "failed"
```

**Causas comuns:**
1. Arquivo SPED inválido/corrompido
2. Formato não suportado
3. Registro 0000 ausente

---

## 💰 Custos Estimados

### Configuração Mínima (Recomendada)
- **Web Dyno (Eco):** Incluído nos $5/mês base Heroku
- **Worker Dyno (Eco):** ~$7/mês adicional
- **Redis Mini:** GRÁTIS (até 25MB)
- **PostgreSQL:** GRÁTIS (já configurado)

**Total:** ~$12/mês

### Otimização para MVP
- Desligar worker quando não estiver processando:
  ```bash
  heroku ps:scale worker=0 -a qs-nexus  # desligar
  heroku ps:scale worker=1 -a qs-nexus  # ligar quando precisar
  ```

---

## 📊 Próximos Passos (Opcional)

### 1. Dashboard de Monitoramento
- Acessar `/admin` (em desenvolvimento)
- Ver jobs ativos, completos e falhados
- Reprocessar arquivos manualmente

### 2. Melhorar Parser SPED
- Adicionar registros I150 (saldos)
- Adicionar registros I250 (partidas do lançamento)
- Suportar EFD ICMS/IPI

### 3. Notificações
- Email quando processamento completa
- Webhook para integração externa

---

## 🎯 Checklist Rápido

```bash
# 1. Adicionar Redis
heroku addons:create heroku-redis:mini -a qs-nexus

# 2. Ativar Worker
heroku ps:scale worker=1 -a qs-nexus

# 3. Monitorar
heroku logs --tail -a qs-nexus

# 4. Testar upload
# Acesse https://qs-nexus.herokuapp.com/sped
```

**Pronto! 🚀**


