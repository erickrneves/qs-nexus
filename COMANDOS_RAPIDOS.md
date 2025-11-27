# ⚡ Comandos Rápidos - QS Nexus

Referência rápida de comandos Git + Heroku.

---

## 🚀 Setup Inicial (Execute UMA VEZ)

### Opção 1: Script Automático (RECOMENDADO!)
```bash
cd /Users/ern/Downloads/lw-rag-system
./scripts/setup-completo.sh
```

### Opção 2: Manual
```bash
cd /Users/ern/Downloads/lw-rag-system

# Git
git init
git remote add origin https://github.com/erickrneves/qs-nexus.git
git add .
git commit -m "initial commit"
git push -u origin main

# Heroku
heroku login
heroku create qs-nexus
heroku addons:create heroku-postgresql:essential-0
heroku addons:create heroku-redis:mini
heroku stack:set container
heroku git:remote -a qs-nexus

# Variáveis (COLE SUA OPENAI_API_KEY)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="https://qs-nexus.herokuapp.com" \
  OPENAI_API_KEY="sk-proj-SUA-CHAVE" \
  NODE_ENV="production" \
  DB_MAX_CONNECTIONS="10"

# Deploy
git push heroku main
heroku run npm run db:seed
heroku open
```

---

## 📝 Desenvolvimento Diário

### Fazer alterações
```bash
# Edite os arquivos...

# Commit
git add .
git commit -m "feat: descrição da mudança"

# Push GitHub
git push origin main

# Deploy Heroku (automático via CI/CD OU manual)
git push heroku main
```

---

## 🔍 Monitoramento

```bash
# Logs em tempo real
heroku logs --tail -a qs-nexus

# Status do app
heroku ps -a qs-nexus

# Info do app
heroku info -a qs-nexus

# Abrir no navegador
heroku open -a qs-nexus

# Dashboard web
heroku dashboard -a qs-nexus
```

---

## 🗄️ Database

```bash
# Info do PostgreSQL
heroku pg:info -a qs-nexus

# Conectar ao banco
heroku pg:psql -a qs-nexus

# Executar migrations
heroku run npm run db:migrate -a qs-nexus

# Executar seed
heroku run npm run db:seed -a qs-nexus

# Backup
heroku pg:backups:capture -a qs-nexus
heroku pg:backups:download -a qs-nexus

# Resetar database (CUIDADO!)
heroku pg:reset DATABASE_URL -a qs-nexus
```

### Queries SQL úteis
```sql
-- Conectar: heroku pg:psql -a qs-nexus

-- Ver organizations
SELECT * FROM organizations;

-- Ver users
SELECT id, email, full_name, global_role FROM users;

-- Alterar senha do admin
UPDATE users 
SET password = crypt('NovaSenhaForte123!', gen_salt('bf')) 
WHERE email = 'admin@qsconsultoria.com.br';

-- Ver workflows
SELECT id, name, is_shared FROM workflow_templates;

-- Sair
\q
```

---

## 🔴 Redis

```bash
# Info
heroku redis:info -a qs-nexus

# CLI
heroku redis:cli -a qs-nexus

# Stats
heroku redis:stats -a qs-nexus
```

---

## ⚙️ Variáveis de Ambiente

```bash
# Listar todas
heroku config -a qs-nexus

# Ver uma específica
heroku config:get OPENAI_API_KEY -a qs-nexus

# Adicionar/Atualizar
heroku config:set NOVA_VAR="valor" -a qs-nexus

# Remover
heroku config:unset NOVA_VAR -a qs-nexus

# Editar .env local
heroku config:edit -a qs-nexus
```

---

## 🔄 Releases e Rollback

```bash
# Ver releases
heroku releases -a qs-nexus

# Rollback para versão anterior
heroku rollback -a qs-nexus

# Rollback para versão específica
heroku rollback v123 -a qs-nexus
```

---

## 🛠️ Troubleshooting

```bash
# Restart app
heroku restart -a qs-nexus

# Escalar dynos
heroku ps:scale web=1 -a qs-nexus

# Upgrade dyno
heroku ps:scale web=1:standard-1x -a qs-nexus

# Limpar cache de build
heroku repo:purge_cache -a qs-nexus
git commit --allow-empty -m "Rebuild"
git push heroku main

# Modo manutenção
heroku maintenance:on -a qs-nexus
heroku maintenance:off -a qs-nexus

# Executar bash
heroku run bash -a qs-nexus
```

---

## 🔐 Segurança

```bash
# Ver add-ons de segurança
heroku addons -a qs-nexus

# SSL info
heroku certs:info -a qs-nexus

# Adicionar domínio customizado
heroku domains:add qs-nexus.com.br -a qs-nexus
heroku certs:auto:enable -a qs-nexus
```

---

## 📊 Logs Avançados

```bash
# Papertrail (se instalado)
heroku addons:create papertrail:choklad -a qs-nexus
heroku addons:open papertrail -a qs-nexus

# Filtrar logs
heroku logs --tail --ps web -a qs-nexus
heroku logs --tail --source app -a qs-nexus

# Logs de erro
heroku logs --tail | grep ERROR
```

---

## 🧪 Testes

```bash
# Rodar testes localmente
npm test

# Build local
npm run build

# Dev local
npm run dev

# Docker local
docker-compose up

# Heroku local
heroku local web
```

---

## 🚨 Emergência

### App está down
```bash
# 1. Ver logs
heroku logs --tail -a qs-nexus

# 2. Verificar status
heroku ps -a qs-nexus

# 3. Restart
heroku restart -a qs-nexus

# 4. Se não resolver, rollback
heroku rollback -a qs-nexus
```

### Database corrompido
```bash
# 1. Backup imediato
heroku pg:backups:capture -a qs-nexus

# 2. Conectar e investigar
heroku pg:psql -a qs-nexus

# 3. Se necessário, restaurar backup
heroku pg:backups:restore b001 DATABASE_URL -a qs-nexus
```

### Build falhou
```bash
# 1. Ver logs de build
heroku logs --tail -a qs-nexus

# 2. Limpar cache
heroku repo:purge_cache -a qs-nexus

# 3. Rebuild
git commit --allow-empty -m "Force rebuild"
git push heroku main
```

---

## 📚 Links Úteis

- **App**: https://qs-nexus.herokuapp.com
- **GitHub**: https://github.com/erickrneves/qs-nexus
- **Dashboard Heroku**: https://dashboard.heroku.com/apps/qs-nexus
- **PostgreSQL Dashboard**: https://data.heroku.com/
- **Heroku Docs**: https://devcenter.heroku.com/

---

## 💡 Dicas

1. **Sempre faça backup antes de migrations grandes**
2. **Use branches para features novas**
3. **Teste localmente com Docker antes de deploy**
4. **Configure Papertrail para logs históricos**
5. **Monitore uso de dynos/database no dashboard**
6. **Altere senha do admin após primeiro login**

---

**Última atualização**: ${new Date().toLocaleDateString('pt-BR')}

