#!/bin/bash

# QS Nexus - Deploy Completo
# Executar: chmod +x deploy-now.sh && ./deploy-now.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
cat << "EOF"
  ██████╗ ███████╗    ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
 ██╔═══██╗██╔════╝    ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
 ██║   ██║███████╗    ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
 ██║▄▄ ██║╚════██║    ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
 ╚██████╔╝███████║    ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
  ╚══▀▀═╝ ╚══════╝    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
EOF
echo -e "${NC}\n"
echo -e "${BLUE}Deploy Automático - GitHub + Heroku${NC}\n"

# Variáveis
OPENAI_KEY="${OPENAI_API_KEY:-}"  # Será configurada via variável de ambiente
APP_NAME="qs-nexus"
GITHUB_REPO="https://github.com/erickrneves/qs-nexus.git"

# Verificar se OPENAI_API_KEY está definida
if [ -z "$OPENAI_KEY" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY não está definida!${NC}"
    echo ""
    read -p "Cole sua OpenAI API Key: " OPENAI_KEY
    
    if [ -z "$OPENAI_KEY" ]; then
        echo -e "${RED}❌ API Key não pode ser vazia!${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 1: Verificar Heroku CLI${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI não encontrado!${NC}\n"
    echo "Instale executando:"
    echo -e "${YELLOW}brew tap heroku/brew && brew install heroku${NC}"
    echo "ou"
    echo -e "${YELLOW}curl https://cli-assets.heroku.com/install.sh | sh${NC}\n"
    exit 1
fi

echo -e "${GREEN}✅ Heroku CLI instalado${NC}"
heroku --version
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 2: Login no Heroku${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

if ! heroku auth:whoami &> /dev/null; then
    echo "Você será redirecionado para fazer login no navegador..."
    heroku login
else
    echo -e "${GREEN}✅ Já logado como: $(heroku auth:whoami)${NC}"
fi
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 3: Configurar Git${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

# Inicializar Git se necessário
if [ ! -d ".git" ]; then
    echo "📦 Inicializando Git..."
    git init
fi

# Configurar remote GitHub
echo "🔗 Configurando remote GitHub..."
if git remote | grep origin &> /dev/null; then
    git remote set-url origin $GITHUB_REPO
else
    git remote add origin $GITHUB_REPO
fi

echo -e "${GREEN}✅ Git configurado${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 4: Commit e Push para GitHub${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

git add .
git commit -m "feat: initial commit - QS Nexus multi-tenant platform

- Multi-tenant architecture with RBAC (5 roles)
- LangChain orchestration with AI agents
- SPED data processing and validation
- Hybrid metadata schemas
- Row-level security (RLS)
- PostgreSQL + Redis + pgvector
- Heroku deployment ready
- Docker support
- Complete documentation" || echo "Sem mudanças para commit"

git branch -M main
echo "📤 Push para GitHub..."
git push -u origin main

echo -e "${GREEN}✅ Código no GitHub${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 5: Criar App no Heroku${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

if heroku apps:info -a $APP_NAME &> /dev/null; then
    echo -e "${YELLOW}⚠️  App '$APP_NAME' já existe${NC}"
else
    echo "📦 Criando app '$APP_NAME'..."
    heroku create $APP_NAME
    
    echo "🗄️  Adicionando PostgreSQL (Essential-0 = $5/mês)..."
    heroku addons:create heroku-postgresql:essential-0 -a $APP_NAME
    
    echo "🔴 Adicionando Redis (Mini = $3/mês)..."
    heroku addons:create heroku-redis:mini -a $APP_NAME
    
    echo "🐳 Configurando stack Docker..."
    heroku stack:set container -a $APP_NAME
fi

# Adicionar git remote Heroku
echo "🔗 Configurando git remote Heroku..."
if git remote | grep heroku &> /dev/null; then
    git remote remove heroku
fi
heroku git:remote -a $APP_NAME

echo -e "${GREEN}✅ App Heroku configurado${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 6: Configurar Variáveis de Ambiente${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

echo "🔑 Gerando NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo "⚙️  Configurando variáveis..."
heroku config:set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="https://$APP_NAME.herokuapp.com" \
  OPENAI_API_KEY="$OPENAI_KEY" \
  NODE_ENV="production" \
  DB_MAX_CONNECTIONS="10" \
  -a $APP_NAME

echo -e "${GREEN}✅ Variáveis configuradas${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 7: Deploy no Heroku${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

echo "🚀 Iniciando deploy (pode levar 5-10 minutos)..."
echo "Acompanhe os logs para ver o progresso..."
echo ""

git push heroku main

echo -e "\n${GREEN}✅ Deploy concluído!${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Passo 8: Inicializar Database${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}\n"

echo "⏳ Aguardando app estar pronto..."
sleep 10

echo "🗄️  Executando migrations..."
heroku run npm run db:migrate -a $APP_NAME

echo "🌱 Seed inicial (cria org + super admin)..."
heroku run npm run db:seed -a $APP_NAME

echo -e "${GREEN}✅ Database inicializado${NC}\n"

# Sucesso final
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
echo -e "${GREEN}🎉 QS Nexus está ONLINE!${NC}"
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
echo "   heroku logs --tail -a $APP_NAME      # Ver logs"
echo "   heroku open -a $APP_NAME             # Abrir app"
echo "   heroku ps -a $APP_NAME               # Status"
echo "   heroku pg:psql -a $APP_NAME          # Database CLI"
echo ""
echo -e "${BLUE}💰 Custos Mensais:${NC}"
echo "   Dyno Basic: $7/mês"
echo "   PostgreSQL: $5/mês"
echo "   Redis: $3/mês"
echo "   Total: $15/mês"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Abrir app
echo -e "\n${YELLOW}Abrindo app no navegador...${NC}"
sleep 2
heroku open -a $APP_NAME

echo -e "\n${GREEN}Pronto! QS Nexus está funcionando! 🚀${NC}\n"

