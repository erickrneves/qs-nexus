# 🚀 Deploy QS Nexus no Heroku

Guia completo para fazer deploy do QS Nexus no Heroku com PostgreSQL e Redis.

---

## 📋 Pré-requisitos

1. **Conta no Heroku**: https://signup.heroku.com/
2. **Heroku CLI instalado**: https://devcenter.heroku.com/articles/heroku-cli
3. **Git configurado**
4. **OpenAI API Key**: https://platform.openai.com/api-keys
5. **(Opcional) Google AI API Key**: https://makersuite.google.com/app/apikey

---

## 🔧 Passo 1: Renomear Repositório GitHub

### No GitHub:
1. Vá em: https://github.com/seu-usuario/lw-rag-system/settings
2. Na seção "Repository name", renomeie para: `qs-nexus`
3. Clique em "Rename"

### No seu terminal local:
```bash
cd /Users/ern/Downloads/lw-rag-system

# Atualizar remote URL
git remote set-url origin https://github.com/seu-usuario/qs-nexus.git

# Verificar
git remote -v

# Fazer push
git add .
git commit -m "chore: rename project to QS Nexus"
git push origin main
```

---

## 🚀 Passo 2: Criar App no Heroku

### Opção A: Via Heroku CLI (Recomendado)

```bash
# Login no Heroku
heroku login

# Criar app (escolha um nome único)
heroku create qs-nexus-prod
# Ou deixe o Heroku gerar um nome aleatório:
# heroku create

# Adicionar PostgreSQL (Essential-0 = $5/mês ou Mini = $5/mês)
heroku addons:create heroku-postgresql:essential-0

# Adicionar Redis (Mini = $3/mês ou Essential-0 = $5/mês)
heroku addons:create heroku-redis:mini

# Configurar stack para Docker
heroku stack:set container
```

### Opção B: Via Dashboard Heroku

1. Acesse: https://dashboard.heroku.com/apps
2. Clique em "New" → "Create new app"
3. Nome: `qs-nexus-prod` (ou outro disponível)
4. Region: United States
5. Em "Resources":
   - Add-on: "Heroku Postgres" (Essential-0)
   - Add-on: "Heroku Redis" (Mini)

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

```bash
# Gerar NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET gerado: $NEXTAUTH_SECRET"

# Configurar variáveis
heroku config:set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
heroku config:set NEXTAUTH_URL="https://qs-nexus-prod.herokuapp.com"
heroku config:set OPENAI_API_KEY="sk-seu-token-aqui"
heroku config:set NODE_ENV="production"
heroku config:set DB_MAX_CONNECTIONS="10"

# (Opcional) Google AI
heroku config:set GOOGLE_AI_API_KEY="sua-chave-google-ai"

# Verificar configurações
heroku config
```

### Variáveis importantes:
- `DATABASE_URL` - **Configurado automaticamente** pelo addon Postgres
- `REDIS_URL` - **Configurado automaticamente** pelo addon Redis
- `NEXTAUTH_URL` - URL da sua app (ex: `https://qs-nexus-prod.herokuapp.com`)
- `NEXTAUTH_SECRET` - Secret aleatório para sessões
- `OPENAI_API_KEY` - Sua chave da OpenAI
- `DB_MAX_CONNECTIONS` - Limite de conexões (10 para Heroku)

---

## 📦 Passo 4: Deploy

### Via Git Push (Recomendado)

```bash
# Adicionar remote do Heroku (se ainda não adicionou)
heroku git:remote -a qs-nexus-prod

# Fazer deploy
git push heroku main

# Ou se sua branch principal é 'master':
# git push heroku master:main
```

### Via GitHub Integration (Alternativa)

1. No Heroku Dashboard → sua app → Deploy
2. Deployment method: "GitHub"
3. Conecte ao repo `qs-nexus`
4. Enable Automatic Deploys (opcional)
5. Manual deploy → "Deploy Branch"

---

## 🗄️ Passo 5: Inicializar Database

```bash
# As migrations já rodam automaticamente no release (ver Procfile)
# Mas você pode rodar manualmente se precisar:

# Seed inicial (criar org + super admin)
heroku run npm run db:seed

# Verificar logs
heroku logs --tail
```

---

## ✅ Passo 6: Verificar Deploy

```bash
# Abrir app no navegador
heroku open

# Ver logs em tempo real
heroku logs --tail

# Verificar status
heroku ps

# Acessar banco de dados
heroku pg:psql

# Acessar Redis CLI
heroku redis:cli
```

### Login inicial:
- **URL**: https://qs-nexus-prod.herokuapp.com
- **Email**: `admin@qsconsultoria.com.br`
- **Senha**: `admin123!@#`

⚠️ **IMPORTANTE**: Altere a senha do admin após primeiro login!

---

## 🔄 Atualizações Futuras

```bash
# Fazer alterações no código
git add .
git commit -m "feat: nova funcionalidade"

# Deploy
git push heroku main

# Rollback se necessário
heroku releases
heroku rollback v123
```

---

## 🐛 Troubleshooting

### App não inicia:
```bash
# Ver logs detalhados
heroku logs --tail

# Verificar variáveis de ambiente
heroku config

# Restart manual
heroku restart
```

### Erro de Database:
```bash
# Ver status do Postgres
heroku pg:info

# Resetar database (CUIDADO!)
heroku pg:reset DATABASE_URL
heroku run npm run db:migrate
heroku run npm run db:seed
```

### Erro de memória:
```bash
# Upgrade dyno (se necessário)
heroku ps:scale web=1:standard-1x
```

### Build lento:
```bash
# Limpar cache
heroku repo:purge_cache -a qs-nexus-prod
git commit --allow-empty -m "Rebuild"
git push heroku main
```

---

## 💰 Custos Estimados (Heroku)

| Recurso | Plano | Custo/mês |
|---------|-------|-----------|
| Dyno Web | Basic | $7 |
| PostgreSQL | Essential-0 (1GB) | $5 |
| Redis | Mini (25MB) | $3 |
| **TOTAL** | | **~$15/mês** |

### Otimizações:
- **Heroku Eco Dynos**: $5/mês (mas dorme após inatividade)
- **Neon PostgreSQL**: Grátis até 0.5GB (usar DATABASE_URL customizado)
- **Upstash Redis**: Grátis até 10K commands/dia

---

## 🔐 Segurança em Produção

### 1. Alterar credenciais padrão:
```sql
-- Conectar ao banco
heroku pg:psql

-- Alterar senha do admin
UPDATE users 
SET password = crypt('SuaSenhaMuitoForte!@#', gen_salt('bf')) 
WHERE email = 'admin@qsconsultoria.com.br';
```

### 2. Configurar domínio customizado (opcional):
```bash
heroku domains:add qs-nexus.com.br
heroku certs:auto:enable
```

### 3. Habilitar rate limiting (futuro):
- Implementar middleware de rate limit
- Usar Heroku Shield (enterprise)

---

## 📊 Monitoramento

### Heroku Metrics (Dashboard):
- **Dyno Load**: CPU/Memória
- **Response Time**: P50, P95, P99
- **Throughput**: Requests/min
- **Errors**: 4xx, 5xx

### Logs:
```bash
# Logs em tempo real
heroku logs --tail

# Logs de erros
heroku logs --tail | grep ERROR

# Logs específicos do Postgres
heroku logs --ps postgres --tail
```

### Adicionar Papertrail (opcional):
```bash
heroku addons:create papertrail:choklad
heroku addons:open papertrail
```

---

## 🔄 CI/CD Automático (GitHub Actions)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "qs-nexus-prod"
          heroku_email: "seu-email@gmail.com"
          usedocker: true
```

---

## 📞 Suporte

- **Heroku Docs**: https://devcenter.heroku.com/
- **Heroku Status**: https://status.heroku.com/
- **GitHub Issues**: https://github.com/seu-usuario/qs-nexus/issues

---

**Última atualização**: ${new Date().toLocaleDateString('pt-BR')}

