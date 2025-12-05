# 🔧 Configuração do MCP GitHub para Cursor

Este guia ajuda você a configurar o Model Context Protocol (MCP) do GitHub no Cursor para este projeto.

## 🚀 Início Rápido

Execute o script automatizado:

```bash
./scripts/setup-github-mcp.sh
```

O script irá:
1. ✅ Verificar dependências (Node.js/npx)
2. 🔑 Solicitar seu GitHub Personal Access Token
3. ✅ Validar o token
4. 🔧 Configurar variáveis de ambiente
5. 📦 Instalar o servidor MCP do GitHub
6. 📋 Fornecer instruções para configurar o Cursor

## 📖 Documentação Completa

Para um guia detalhado passo a passo, consulte:
- [docs/CONFIGURACAO_MCP_GITHUB.md](docs/CONFIGURACAO_MCP_GITHUB.md)

## ⚡ Configuração Manual Rápida

### 1. Criar Token do GitHub

1. Acesse: https://github.com/settings/tokens/new
2. Selecione scopes: `repo`, `read:org`, `read:user`, `read:project`
3. Gere e copie o token

### 2. Adicionar Variável de Ambiente

```bash
# Adicione ao seu ~/.zshrc ou ~/.bashrc
export GITHUB_PERSONAL_ACCESS_TOKEN="seu_token_aqui"

# Recarregue
source ~/.zshrc
```

### 3. Configurar o Cursor

1. Abra Cursor
2. `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"
3. Copie o conteúdo de `.cursor-mcp-config.json` para o settings.json
4. Reinicie o Cursor

## 🎯 Template de Configuração

O arquivo `.cursor-mcp-config.json` contém a configuração pronta para copiar.

## 🧪 Testar a Integração

Após configurar, teste no Cursor:
- "Liste os pull requests deste repositório"
- "Mostre os últimos 10 commits"
- "Quais são as issues abertas?"

## 📚 Recursos Disponíveis

Com o MCP do GitHub configurado, você terá acesso a:

- 📋 Repositórios e informações
- 🔀 Pull Requests
- 🐛 Issues
- 📝 Commits e histórico
- 🌿 Branches
- 👥 Colaboradores
- 📊 Estatísticas

## ⚠️ Segurança

- ❌ **Nunca** commite seu token no repositório
- ✅ Use variáveis de ambiente
- 🔒 Revogue tokens não utilizados em: https://github.com/settings/tokens

## 🆘 Problemas?

### MCP não funciona
```bash
# Verifique o token
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# Verifique o npx
npx --version

# Reinstale o servidor MCP
npx -y @modelcontextprotocol/server-github
```

### Ainda com problemas?
- Consulte a [documentação completa](docs/CONFIGURACAO_MCP_GITHUB.md)
- Reinicie o Cursor completamente
- Verifique os scopes do token no GitHub

## 🔗 Links Úteis

- [MCP Official Docs](https://modelcontextprotocol.io/)
- [Cursor MCP Docs](https://docs.cursor.com/context/mcp)
- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)

