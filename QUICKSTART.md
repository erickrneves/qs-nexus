# 🚀 QS Nexus - Quickstart Guide

Deploy do QS Nexus no Heroku em **10 minutos**!

---

## 📋 Pré-requisitos

1. ✅ Conta no Heroku (grátis): https://signup.heroku.com/
2. ✅ OpenAI API Key: https://platform.openai.com/api-keys
3. ✅ Heroku CLI instalado: https://devcenter.heroku.com/articles/heroku-cli

---

## ⚡ Deploy em 5 Passos

### 1️⃣ Clone e Configure

```bash
# Clone (ou renomeie seu diretório atual)
cd /Users/ern/Downloads/lw-rag-system

# Login no Heroku
heroku login
```

### 2️⃣ Crie o App no Heroku

```bash
# Criar app (substitua 'qs-nexus-prod' se quiser outro nome)
heroku create qs-nexus-prod

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# Adicionar Redis
heroku addons:create heroku-redis:mini

# Configurar para Docker
heroku stack:set container
```

### 3️⃣ Configure Variáveis

```bash
# Gerar secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Configurar (cole sua OPENAI_API_KEY)
heroku config:set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="https://qs-nexus-prod.herokuapp.com" \
  OPENAI_API_KEY="sk-SUA-CHAVE-AQUI" \
  NODE_ENV="production" \
  DB_MAX_CONNECTIONS="10"
```

### 4️⃣ Deploy!

```bash
# Adicionar remote (se necessário)
heroku git:remote -a qs-nexus-prod

# Commit tudo
git add .
git commit -m "Deploy QS Nexus to Heroku"

# Push e deploy (aguarde 5-10min)
git push heroku main
```

### 5️⃣ Inicialize o Banco

```bash
# Seed (cria organização + super admin)
heroku run npm run db:seed

# Abrir app
heroku open
```

---

## 🎉 Pronto!

Acesse: **https://qs-nexus-prod.herokuapp.com**

**Login:**
- Email: `admin@qsconsultoria.com.br`
- Senha: `admin123!@#`

⚠️ **Altere a senha após primeiro login!**

---

## 📊 Ver Logs

```bash
# Logs em tempo real
heroku logs --tail

# Ver status
heroku ps

# Abrir dashboard
heroku dashboard
```

---

## 💰 Custos (Heroku)

| Item | Plano | Custo/mês |
|------|-------|-----------|
| Dyno | Basic | $7 |
| PostgreSQL | Essential-0 | $5 |
| Redis | Mini | $3 |
| **TOTAL** | | **~$15/mês** |

### Alternativa Grátis (Limitada):
- Dyno: Eco ($5/mês, mas dorme)
- PostgreSQL: Usar Neon (grátis 0.5GB)
- Redis: Usar Upstash (grátis 10K ops/dia)

---

## 🆘 Problemas?

### Build falhou:
```bash
heroku logs --tail
```

### Limpar cache:
```bash
heroku repo:purge_cache -a qs-nexus-prod
git commit --allow-empty -m "Rebuild"
git push heroku main
```

### Resetar database:
```bash
heroku pg:reset DATABASE_URL
heroku run npm run db:migrate
heroku run npm run db:seed
```

---

## 📚 Documentação Completa

- **Deploy Detalhado**: [`DEPLOY.md`](./DEPLOY.md)
- **Renomear Projeto**: [`RENAME_INSTRUCTIONS.md`](./RENAME_INSTRUCTIONS.md)
- **Status Implementação**: [`docs/IMPLEMENTATION_STATUS.md`](./docs/IMPLEMENTATION_STATUS.md)

---

## 🔄 Próximo Deploy

```bash
# Faça alterações no código
git add .
git commit -m "Nova feature"
git push heroku main
```

**Deploy automático está configurado!** ✨

---

**Criado**: ${new Date().toLocaleDateString('pt-BR')}

