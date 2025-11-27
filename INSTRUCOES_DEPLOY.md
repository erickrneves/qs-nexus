# 🚀 Instruções de Deploy - QS Nexus

## ✅ Tudo está PRONTO para deploy!

Sua OpenAI API Key foi configurada e o script de deploy está pronto.

---

## 🎯 Opção 1: Script Automático (RECOMENDADO)

### Passo 1: Instalar Heroku CLI (se necessário)

```bash
# Via Homebrew (macOS)
brew tap heroku/brew && brew install heroku

# OU via instalador oficial
curl https://cli-assets.heroku.com/install.sh | sh
```

### Passo 2: Executar Deploy

```bash
cd /Users/ern/Downloads/lw-rag-system
./deploy-now.sh
```

**Isso vai fazer TUDO automaticamente:**
- ✅ Configurar Git
- ✅ Push para GitHub (https://github.com/erickrneves/qs-nexus)
- ✅ Criar app no Heroku (qs-nexus)
- ✅ Adicionar PostgreSQL + Redis
- ✅ Configurar variáveis de ambiente (com sua OpenAI Key)
- ✅ Fazer deploy
- ✅ Inicializar database
- ✅ Abrir app no navegador

---

## ⚡ Opção 2: Manual (Passo a Passo)

### 1. Instalar Heroku CLI
```bash
brew tap heroku/brew && brew install heroku
```

### 2. Login no Heroku
```bash
heroku login
```

### 3. Git Setup
```bash
cd /Users/ern/Downloads/lw-rag-system

git init
git remote add origin https://github.com/erickrneves/qs-nexus.git
git add .
git commit -m "feat: initial commit - QS Nexus platform"
git branch -M main
git push -u origin main
```

### 4. Criar App no Heroku
```bash
heroku create qs-nexus
heroku addons:create heroku-postgresql:essential-0 -a qs-nexus
heroku addons:create heroku-redis:mini -a qs-nexus
heroku stack:set container -a qs-nexus
heroku git:remote -a qs-nexus
```

### 5. Configurar Variáveis
```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)

heroku config:set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="https://qs-nexus.herokuapp.com" \
  OPENAI_API_KEY="SUA-OPENAI-API-KEY-AQUI" \
  NODE_ENV="production" \
  DB_MAX_CONNECTIONS="10" \
  -a qs-nexus
```

### 6. Deploy
```bash
git push heroku main
```

### 7. Inicializar Database
```bash
heroku run npm run db:migrate -a qs-nexus
heroku run npm run db:seed -a qs-nexus
```

### 8. Abrir App
```bash
heroku open -a qs-nexus
```

---

## 🔐 Credenciais de Acesso

**URL**: https://qs-nexus.herokuapp.com

**Login:**
- Email: `admin@qsconsultoria.com.br`
- Senha: `admin123!@#`

⚠️ **ALTERE A SENHA APÓS PRIMEIRO LOGIN!**

---

## 📊 Monitoramento

```bash
# Logs em tempo real
heroku logs --tail -a qs-nexus

# Status do app
heroku ps -a qs-nexus

# Dashboard
heroku dashboard -a qs-nexus

# Conectar ao banco
heroku pg:psql -a qs-nexus
```

---

## 🐛 Troubleshooting

### Heroku CLI não encontrado após instalação
```bash
# Fechar e reabrir o terminal
# OU adicionar ao PATH
export PATH="/usr/local/bin:$PATH"
```

### Build falhou
```bash
heroku logs --tail -a qs-nexus
```

### App não responde
```bash
heroku restart -a qs-nexus
```

---

## 💰 Custos

| Item | Custo/mês |
|------|-----------|
| Dyno Basic | $7 |
| PostgreSQL Essential-0 | $5 |
| Redis Mini | $3 |
| **Total** | **$15** |

---

## 📚 Documentação Adicional

- **Setup Completo**: `SETUP_COMPLETO.md`
- **Comandos Rápidos**: `COMANDOS_RAPIDOS.md`
- **Status do Projeto**: `docs/IMPLEMENTATION_STATUS.md`

---

## ✅ Checklist

- [ ] Heroku CLI instalado
- [ ] Script executado (`./deploy-now.sh`)
- [ ] App acessível (https://qs-nexus.herokuapp.com)
- [ ] Login funcionando
- [ ] Senha alterada

---

**Data**: ${new Date().toLocaleDateString('pt-BR')}  
**Repositório**: https://github.com/erickrneves/qs-nexus  
**App**: https://qs-nexus.herokuapp.com

