#!/bin/bash

# QS Nexus - Setup Completo Automatizado
# GitHub: erickrneves/qs-nexus
# Heroku: qs-nexus

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
cat << "EOF"
  ██████╗ ███████╗    ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
 ██╔═══██╗██╔════╝    ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
 ██║   ██║███████╗    ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
 ██║▄▄ ██║╚════██║    ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
 ╚██████╔╝███████║    ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
  ╚══▀▀═╝ ╚══════╝    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
                                                                   
  Setup Completo - GitHub + Heroku
EOF
echo -e "${NC}\n"

# Verificar Heroku CLI
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI não instalado!${NC}"
    echo "Instale em: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Verificar Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não instalado!${NC}"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 1: Configurar Git${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

# Verificar se já está em um repo git
if [ ! -d ".git" ]; then
    echo "📦 Inicializando Git..."
    git init
fi

# Configurar remote
echo "🔗 Configurando remote GitHub..."
if git remote | grep origin &> /dev/null; then
    git remote set-url origin https://github.com/erickrneves/qs-nexus.git
else
    git remote add origin https://github.com/erickrneves/qs-nexus.git
fi

echo -e "${GREEN}✅ Git configurado${NC}\n"

# Perguntar sobre OpenAI API Key
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 2: OpenAI API Key${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Você precisa de uma OpenAI API Key!${NC}"
echo "Obtenha em: https://platform.openai.com/api-keys"
echo ""
read -p "Cole sua OpenAI API Key: " OPENAI_KEY

if [ -z "$OPENAI_KEY" ]; then
    echo -e "${RED}❌ API Key não pode ser vazia!${NC}"
    exit 1
fi

echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 3: Login no Heroku${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

if ! heroku auth:whoami &> /dev/null; then
    echo "Por favor, faça login:"
    heroku login
fi

echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 4: Criar App no Heroku${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

APP_NAME="qs-nexus"

if heroku apps:info -a $APP_NAME &> /dev/null; then
    echo -e "${YELLOW}⚠️  App '$APP_NAME' já existe!${NC}"
    read -p "Deseja usar este app existente? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Saindo..."
        exit 1
    fi
else
    echo "📦 Criando app '$APP_NAME'..."
    heroku create $APP_NAME
    
    echo "🗄️  Adicionando PostgreSQL..."
    heroku addons:create heroku-postgresql:essential-0 -a $APP_NAME
    
    echo "🔴 Adicionando Redis..."
    heroku addons:create heroku-redis:mini -a $APP_NAME
    
    echo "🐳 Configurando stack Docker..."
    heroku stack:set container -a $APP_NAME
fi

# Adicionar git remote
echo "🔗 Configurando git remote Heroku..."
if git remote | grep heroku &> /dev/null; then
    git remote remove heroku
fi
heroku git:remote -a $APP_NAME

echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 5: Configurar Variáveis de Ambiente${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

# Gerar NEXTAUTH_SECRET
echo "🔑 Gerando NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Configurar variáveis
echo "⚙️  Configurando variáveis..."
heroku config:set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="https://$APP_NAME.herokuapp.com" \
  OPENAI_API_KEY="$OPENAI_KEY" \
  NODE_ENV="production" \
  DB_MAX_CONNECTIONS="10" \
  -a $APP_NAME

echo -e "${GREEN}✅ Variáveis configuradas${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 6: Commit e Push para GitHub${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

echo "📝 Adicionando arquivos..."
git add .

echo "💾 Fazendo commit..."
git commit -m "feat: initial commit - QS Nexus multi-tenant platform

- Multi-tenant architecture with RBAC
- LangChain orchestration with AI agents
- SPED data processing and validation
- Hybrid metadata schemas
- Row-level security
- Heroku deployment ready
- Docker support" || echo "Sem mudanças para commit"

echo "📤 Push para GitHub..."
git branch -M main
git push -u origin main

echo -e "${GREEN}✅ Código no GitHub${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 7: Deploy no Heroku${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

echo "🚀 Fazendo deploy (pode levar 5-10 minutos)..."
git push heroku main

echo -e "\n${GREEN}✅ Deploy concluído${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}Passo 8: Inicializar Database${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"

echo "🗄️  Executando migrations..."
heroku run npm run db:migrate -a $APP_NAME

echo "🌱 Seed inicial (cria org + super admin)..."
heroku run npm run db:seed -a $APP_NAME

echo -e "${GREEN}✅ Database inicializado${NC}\n"

# Sucesso!
echo -e "${GREEN}"
cat << "EOF"
  ███████╗██╗   ██╗ ██████╗███████╗███████╗███████╗ ██████╗ 
  ██╔════╝██║   ██║██╔════╝██╔════╝██╔════╝██╔════╝██╔═══██╗
  ███████╗██║   ██║██║     █████╗  ███████╗███████╗██║   ██║
  ╚════██║██║   ██║██║     ██╔══╝  ╚════██║╚════██║██║   ██║
  ███████║╚██████╔╝╚██████╗███████╗███████║███████║╚██████╔╝
  ╚══════╝ ╚═════╝  ╚═════╝╚══════╝╚══════╝╚══════╝ ╚═════╝ 
EOF
echo -e "${NC}\n"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 QS Nexus configurado com sucesso!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo "   GitHub: https://github.com/erickrneves/qs-nexus"
echo "   App: https://$APP_NAME.herokuapp.com"
echo "   Dashboard: https://dashboard.heroku.com/apps/$APP_NAME"
echo ""
echo -e "${BLUE}🔐 Login Inicial:${NC}"
echo "   Email: admin@qsconsultoria.com.br"
echo "   Senha: admin123!@#"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Altere a senha após primeiro login!${NC}"
echo ""
echo -e "${BLUE}📊 Comandos Úteis:${NC}"
echo "   heroku logs --tail -a $APP_NAME"
echo "   heroku open -a $APP_NAME"
echo "   heroku ps -a $APP_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Perguntar se quer abrir
read -p "Deseja abrir o app no navegador agora? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    heroku open -a $APP_NAME
fi

echo -e "\n${GREEN}Pronto! 🚀${NC}\n"

