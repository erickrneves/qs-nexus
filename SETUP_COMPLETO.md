# 🚀 Setup Completo - QS Nexus

Guia passo a passo para configurar GitHub + Heroku do zero.

**Repositório**: https://github.com/erickrneves/qs-nexus  
**Heroku App**: qs-nexus

---

## 📦 Passo 1: Primeiro Push para GitHub

```bash
cd /Users/ern/Downloads/lw-rag-system

# Inicializar Git (se ainda não está)
git init

# Adicionar remote
git remote add origin https://github.com/erickrneves/qs-nexus.git

# Ou se já existe, atualizar:
git remote set-url origin https://github.com/erickrneves/qs-nexus.git

# Verificar
git remote -v

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "feat: initial commit - QS Nexus multi-tenant platform

- Multi-tenant architecture with RBAC
- LangChain orchestration with AI agents
- SPED data processing and validation
- Hybrid metadata schemas
- Row-level security
- Heroku deployment ready
- Docker support"

# Push para main
git branch -M main
git push -u origin main
```

---

## ⚙️ Passo 2: Configurar Heroku

### A. Criar App e Addons

```bash
# Login
heroku login

# Criar app
heroku create qs-nexus

# Adicionar PostgreSQL (Essential-0 = $5/mês)
heroku addons:create heroku-postgresql:essential-0 -a qs-nexus

# Adicionar Redis (Mini = $3/mês)
heroku addons:create heroku-redis:mini -a qs-nexus

# Configurar stack Docker
heroku stack:set container -a qs-nexus

# Adicionar remote Git
heroku git:remote -a qs-nexus
```

### B. Configurar Variáveis de Ambiente

```bash
# Gerar NEXTAUTH_SECRET
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET gerado: $NEXTAUTH_SECRET"

# Configurar TODAS as variáveis (COLE SUA OPENAI_API_KEY)
heroku config:set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="https://qs-nexus.herokuapp.com" \
  OPENAI_API_KEY="sk-proj-SUA-CHAVE-OPENAI-AQUI" \
  NODE_ENV="production" \
  DB_MAX_CONNECTIONS="10" \
  -a qs-nexus

# (Opcional) Google AI
# heroku config:set GOOGLE_AI_API_KEY="sua-chave-google" -a qs-nexus

# Verificar configurações
heroku config -a qs-nexus
```

**Importante**: Você precisa de uma OpenAI API Key! Obtenha em:  
👉 https://platform.openai.com/api-keys

---

## 🚀 Passo 3: Deploy

```bash
# Deploy (pode levar 5-10 minutos)
git push heroku main

# Acompanhar logs
heroku logs --tail -a qs-nexus
```

---

## 🗄️ Passo 4: Inicializar Database

```bash
# Executar migrations (automático via Procfile, mas pode rodar manual)
heroku run npm run db:migrate -a qs-nexus

# Seed inicial (criar org + super admin)
heroku run npm run db:seed -a qs-nexus
```

---

## ✅ Passo 5: Verificar e Acessar

```bash
# Abrir app no navegador
heroku open -a qs-nexus

# Ver status
heroku ps -a qs-nexus

# Ver logs em tempo real
heroku logs --tail -a qs-nexus
```

### 🔐 Login Inicial

- **URL**: https://qs-nexus.herokuapp.com
- **Email**: `admin@qsconsultoria.com.br`
- **Senha**: `admin123!@#`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

---

## 🤖 Passo 6: Configurar CI/CD (Opcional)

### GitHub Actions - Deploy Automático

1. **Obter Heroku API Key**:
   - Acesse: https://dashboard.heroku.com/account
   - Role até "API Key" → Reveal → Copie

2. **Adicionar Secrets no GitHub**:
   - Vá em: https://github.com/erickrneves/qs-nexus/settings/secrets/actions
   - Clique em "New repository secret"
   - Adicione os seguintes secrets:

| Nome | Valor |
|------|-------|
| `HEROKU_API_KEY` | Sua API Key do Heroku |
| `HEROKU_APP_NAME` | `qs-nexus` |
| `HEROKU_EMAIL` | Seu email do Heroku |

3. **Pronto!** Agora todo push em `main` fará deploy automático! 🎉

---

## 📊 Monitoramento

### Heroku Dashboard
- **App**: https://dashboard.heroku.com/apps/qs-nexus
- **PostgreSQL**: https://data.heroku.com/
- **Redis**: Veja em Add-ons no dashboard

### Via CLI
```bash
# Logs em tempo real
heroku logs --tail -a qs-nexus

# Métricas
heroku ps -a qs-nexus

# Banco de dados
heroku pg:info -a qs-nexus
heroku pg:psql -a qs-nexus

# Redis
heroku redis:info -a qs-nexus
heroku redis:cli -a qs-nexus
```

---

## 🔄 Atualizações Futuras

```bash
# 1. Fazer alterações no código
git add .
git commit -m "feat: nova funcionalidade"

# 2. Push
git push origin main

# 3. Deploy automático via GitHub Actions
# OU manual:
git push heroku main
```

---

## 🐛 Troubleshooting

### Build Falhou
```bash
# Ver logs detalhados
heroku logs --tail -a qs-nexus

# Limpar cache e rebuild
heroku repo:purge_cache -a qs-nexus
git commit --allow-empty -m "Rebuild"
git push heroku main
```

### Erro de Database
```bash
# Ver status
heroku pg:info -a qs-nexus

# Conectar ao banco
heroku pg:psql -a qs-nexus

# Resetar (CUIDADO - apaga tudo!)
heroku pg:reset DATABASE_URL -a qs-nexus
heroku run npm run db:migrate -a qs-nexus
heroku run npm run db:seed -a qs-nexus
```

### App não responde
```bash
# Restart
heroku restart -a qs-nexus

# Escalar dynos
heroku ps:scale web=1 -a qs-nexus

# Upgrade dyno (se necessário)
heroku ps:scale web=1:standard-1x -a qs-nexus
```

### Variáveis de Ambiente
```bash
# Listar
heroku config -a qs-nexus

# Adicionar/Atualizar
heroku config:set NOVA_VAR="valor" -a qs-nexus

# Remover
heroku config:unset NOVA_VAR -a qs-nexus
```

---

## 💰 Custos Estimados

| Recurso | Plano | Custo/mês |
|---------|-------|-----------|
| Dyno Web | Basic | $7 |
| PostgreSQL | Essential-0 (1GB) | $5 |
| Redis | Mini (25MB) | $3 |
| **TOTAL** | | **$15/mês** |

### Alternativas Mais Baratas:
- **Eco Dyno**: $5/mês (dorme após 30min inatividade)
- **Neon PostgreSQL**: Grátis até 0.5GB (use DATABASE_URL customizado)
- **Upstash Redis**: Grátis até 10K commands/dia

---

## 🔐 Segurança em Produção

### 1. Alterar Senha do Admin
```sql
-- Conectar ao banco
heroku pg:psql -a qs-nexus

-- Alterar senha (troque 'SuaSenhaForte123!')
UPDATE users 
SET password = crypt('SuaSenhaForte123!', gen_salt('bf')) 
WHERE email = 'admin@qsconsultoria.com.br';

-- Sair
\q
```

### 2. Configurar Domínio Customizado
```bash
# Adicionar domínio
heroku domains:add qs-nexus.com.br -a qs-nexus

# Habilitar SSL automático
heroku certs:auto:enable -a qs-nexus

# Atualizar NEXTAUTH_URL
heroku config:set NEXTAUTH_URL="https://qs-nexus.com.br" -a qs-nexus
```

### 3. Habilitar Logs Avançados (Opcional)
```bash
# Papertrail (agregação de logs)
heroku addons:create papertrail:choklad -a qs-nexus
heroku addons:open papertrail -a qs-nexus
```

---

## 📚 Estrutura de Branches (Recomendado)

```bash
# Branch principal (produção)
main → Auto-deploy para Heroku

# Branch de desenvolvimento
git checkout -b develop
git push origin develop

# Features
git checkout -b feature/nova-funcionalidade
# ... trabalho ...
git push origin feature/nova-funcionalidade
# Pull Request para develop
```

---

## 📞 Comandos Úteis

```bash
# Ver todas as apps
heroku apps

# Informações do app
heroku info -a qs-nexus

# Abrir dashboard
heroku dashboard -a qs-nexus

# Executar comandos
heroku run bash -a qs-nexus
heroku run npm run db:seed -a qs-nexus

# Releases e rollback
heroku releases -a qs-nexus
heroku rollback v123 -a qs-nexus

# Manutenção mode
heroku maintenance:on -a qs-nexus
heroku maintenance:off -a qs-nexus
```

---

## ✅ Checklist Final

- [ ] Repositório GitHub criado
- [ ] Git configurado localmente
- [ ] Primeiro push feito
- [ ] App Heroku criado (`qs-nexus`)
- [ ] PostgreSQL addon adicionado
- [ ] Redis addon adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] OPENAI_API_KEY configurada
- [ ] Deploy realizado com sucesso
- [ ] Database migrations executadas
- [ ] Seed executado
- [ ] App acessível via HTTPS
- [ ] Login funcionando
- [ ] Senha do admin alterada
- [ ] CI/CD configurado (opcional)
- [ ] Monitoramento configurado

---

## 🎯 O Que Fazer Agora

1. ✅ **Execute os passos acima** na ordem
2. 🔐 **Configure sua OpenAI API Key**
3. 🚀 **Faça o primeiro deploy**
4. 🧪 **Teste o sistema**
5. 👥 **Convide sua equipe**
6. 📊 **Configure dashboards de monitoramento**

---

**Última atualização**: ${new Date().toLocaleString('pt-BR')}  
**Repositório**: https://github.com/erickrneves/qs-nexus  
**App Heroku**: https://qs-nexus.herokuapp.com

