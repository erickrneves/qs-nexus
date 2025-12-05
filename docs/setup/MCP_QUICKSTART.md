# MCP GitHub - Guia Rápido de Instalação

## ⚡ TL;DR - Começar Agora

```bash
# 1. Execute o script de configuração
./scripts/setup-github-mcp.sh

# 2. Siga as instruções na tela

# 3. Reinicie o Cursor

# 4. Pronto! 🎉
```

## 📝 O que você precisa ter em mãos?

1. ✅ Token de Acesso Pessoal do GitHub
   - Crie em: https://github.com/settings/tokens/new
   - Scopes necessários: `repo`, `read:org`, `read:user`, `read:project`

2. ✅ Cursor IDE instalado
   - Download em: https://cursor.sh

3. ✅ Node.js instalado (para npx)
   - Verifique: `npx --version`
   - Instale se necessário: `brew install node`

## 🎯 Passo a Passo Simplificado

### 1️⃣ Criar Token do GitHub (2 minutos)

1. Abra: https://github.com/settings/tokens/new
2. Nome: "Cursor MCP - QS Nexus"
3. Selecione os scopes:
   - [x] repo
   - [x] read:org
   - [x] read:user
   - [x] read:project
4. Clique em "Generate token"
5. **COPIE O TOKEN** (você não verá novamente!)

### 2️⃣ Executar Script (1 minuto)

```bash
cd /Users/ern/Downloads/qs-nexus
./scripts/setup-github-mcp.sh
```

O script irá:
- ✅ Verificar se o Node.js está instalado
- ✅ Solicitar seu token do GitHub
- ✅ Validar o token
- ✅ Configurar variáveis de ambiente
- ✅ Instalar o servidor MCP
- ✅ Gerar instruções para o Cursor

### 3️⃣ Configurar o Cursor (2 minutos)

1. Abra o Cursor
2. Pressione `Cmd+Shift+P`
3. Digite: "Preferences: Open User Settings (JSON)"
4. Copie o conteúdo de `.cursor-mcp-config.json` para dentro do objeto principal
5. Salve o arquivo
6. **Reinicie o Cursor completamente**

### 4️⃣ Testar (30 segundos)

Abra o chat do Cursor e pergunte:

```
Liste os últimos 5 pull requests deste repositório
```

Se funcionar, você verá uma lista de PRs! 🎉

## 🔧 Configuração Manual (se preferir)

### Passo 1: Variável de Ambiente

Adicione ao `~/.zshrc`:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="seu_token_aqui"
```

Recarregue:

```bash
source ~/.zshrc
```

### Passo 2: Configuração do Cursor

Adicione ao `settings.json` do Cursor:

```json
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
        }
      }
    }
  }
}
```

## ✅ Checklist de Verificação

- [ ] Token do GitHub criado com scopes corretos
- [ ] Variável de ambiente configurada (`echo $GITHUB_PERSONAL_ACCESS_TOKEN`)
- [ ] Node.js/npx instalado (`npx --version`)
- [ ] Configuração adicionada ao settings.json do Cursor
- [ ] Cursor reiniciado completamente
- [ ] Teste realizado com sucesso

## 🆘 Problemas Comuns

### "npx: command not found"
```bash
brew install node
```

### "Token inválido"
- Verifique se copiou o token completo
- Verifique se os scopes estão corretos
- Crie um novo token se necessário

### "MCP não está funcionando"
1. Reinicie o Cursor **completamente** (feche todas as janelas)
2. Verifique a variável de ambiente: `echo $GITHUB_PERSONAL_ACCESS_TOKEN`
3. Verifique se a configuração está no lugar certo do settings.json

### "Sem permissão para acessar o repositório"
- Certifique-se de que o scope `repo` está selecionado
- Se for um repositório de organização, adicione `read:org`

## 📚 Mais Informações

- **Documentação Completa**: [docs/CONFIGURACAO_MCP_GITHUB.md](../CONFIGURACAO_MCP_GITHUB.md)
- **README do Projeto**: [CONFIGURACAO_MCP.md](../../CONFIGURACAO_MCP.md)
- **MCP Official**: https://modelcontextprotocol.io/
- **Cursor MCP Docs**: https://docs.cursor.com/context/mcp

## 🎓 Comandos Úteis para Testar

Depois de configurado, experimente perguntar ao Cursor:

```
🔍 "Mostre os últimos 10 commits neste repositório"
🐛 "Liste as issues abertas marcadas como 'bug'"
🔀 "Quais PRs estão aguardando review?"
👥 "Quem são os principais colaboradores deste projeto?"
📊 "Mostre as estatísticas de commits da última semana"
```

## ⚠️ Segurança

**IMPORTANTE**:
- ❌ Nunca commite o token no git
- ❌ Nunca compartilhe seu token
- ✅ Use variáveis de ambiente
- ✅ Revogue tokens antigos: https://github.com/settings/tokens

---

**Tempo estimado total**: ~5 minutos

**Dificuldade**: ⭐ Fácil

**Suporte**: Se encontrar problemas, consulte a [documentação completa](../CONFIGURACAO_MCP_GITHUB.md)

