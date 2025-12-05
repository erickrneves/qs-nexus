#!/bin/bash

# Script para configurar o GitHub MCP no Cursor
# Autor: Sistema QS-Nexus
# Data: $(date +%Y-%m-%d)

set -e

echo "🚀 Configuração do GitHub MCP para Cursor"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para mostrar mensagens
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar se o Node.js/npx está instalado
echo "1. Verificando dependências..."
if ! command -v npx &> /dev/null; then
    error "npx não encontrado. Instale o Node.js primeiro:"
    echo "  brew install node"
    exit 1
fi
info "npx encontrado: $(npx --version)"

# Solicitar o token do GitHub
echo ""
echo "2. Token de Acesso Pessoal do GitHub"
echo "   Para criar um token:"
echo "   - Acesse: https://github.com/settings/tokens/new"
echo "   - Selecione os scopes: repo, read:org, read:user, read:project"
echo ""
read -sp "   Digite seu GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    error "Token não fornecido. Abortando."
    exit 1
fi

# Verificar se o token funciona
echo ""
echo "3. Validando token..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)

if [ "$HTTP_CODE" = "200" ]; then
    info "Token válido!"
    USER_INFO=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
    USERNAME=$(echo "$USER_INFO" | grep -o '"login": *"[^"]*"' | head -1 | sed 's/"login": *"\([^"]*\)"/\1/')
    info "Conectado como: $USERNAME"
else
    error "Token inválido (HTTP $HTTP_CODE). Verifique e tente novamente."
    exit 1
fi

# Adicionar ao .zshrc se ainda não estiver lá
echo ""
echo "4. Configurando variável de ambiente..."
SHELL_RC="$HOME/.zshrc"

if [ ! -f "$SHELL_RC" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if ! grep -q "GITHUB_PERSONAL_ACCESS_TOKEN" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# GitHub Personal Access Token para Cursor MCP" >> "$SHELL_RC"
    echo "export GITHUB_PERSONAL_ACCESS_TOKEN=\"$GITHUB_TOKEN\"" >> "$SHELL_RC"
    info "Variável adicionada ao $SHELL_RC"
else
    warn "Variável já existe no $SHELL_RC"
    read -p "   Deseja atualizar? (s/N): " UPDATE
    if [[ $UPDATE =~ ^[Ss]$ ]]; then
        sed -i.bak "s/export GITHUB_PERSONAL_ACCESS_TOKEN=.*/export GITHUB_PERSONAL_ACCESS_TOKEN=\"$GITHUB_TOKEN\"/" "$SHELL_RC"
        info "Variável atualizada"
    fi
fi

# Recarregar o shell
export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"

# Instalar o servidor MCP do GitHub
echo ""
echo "5. Instalando servidor MCP do GitHub..."
npx -y @modelcontextprotocol/server-github --help > /dev/null 2>&1
info "Servidor MCP instalado"

# Configurar o Cursor
echo ""
echo "6. Configuração do Cursor"
CURSOR_SETTINGS="$HOME/Library/Application Support/Cursor/User/settings.json"

if [ ! -f "$CURSOR_SETTINGS" ]; then
    warn "Arquivo de configurações do Cursor não encontrado em:"
    echo "   $CURSOR_SETTINGS"
    echo ""
    echo "   Configure manualmente adicionando ao settings.json do Cursor:"
else
    info "Arquivo de configurações encontrado"
fi

echo ""
echo "   Adicione esta configuração ao settings.json do Cursor:"
echo ""
echo '   {
     "mcp": {
       "servers": {
         "github": {
           "command": "npx",
           "args": [
             "-y",
             "@modelcontextprotocol/server-github"
           ],
           "env": {
             "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
           }
         }
       }
     }
   }'
echo ""

# Instruções finais
echo ""
echo "=========================================="
info "Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Recarregue seu shell: source $SHELL_RC"
echo "   2. Abra o Cursor"
echo "   3. Pressione Cmd+Shift+P"
echo "   4. Digite 'Preferences: Open User Settings (JSON)'"
echo "   5. Adicione a configuração MCP mostrada acima"
echo "   6. Reinicie o Cursor completamente"
echo ""
echo "🧪 Para testar:"
echo "   - Pergunte ao Cursor sobre PRs, issues ou commits do repositório"
echo ""
echo "📚 Documentação completa em:"
echo "   docs/CONFIGURACAO_MCP_GITHUB.md"
echo ""

