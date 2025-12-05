# Configuração do MCP GitHub no Cursor

## O que é o MCP?

O Model Context Protocol (MCP) permite que o Cursor se integre com serviços externos, como GitHub, para fornecer contexto adicional durante o desenvolvimento.

## Passo a Passo

### 1. Criar Token de Acesso Pessoal do GitHub

1. Acesse: https://github.com/settings/tokens/new
2. Dê um nome descritivo ao token: "Cursor MCP - qs-nexus"
3. Defina a expiração conforme sua preferência
4. Selecione as seguintes permissões (scopes):
   - ✅ `repo` - Acesso completo aos repositórios privados
   - ✅ `read:org` - Ler dados da organização
   - ✅ `read:user` - Ler dados do perfil de usuário
   - ✅ `read:project` - Ler projetos do GitHub
5. Clique em "Generate token"
6. **IMPORTANTE**: Copie o token e guarde em um local seguro (você não conseguirá vê-lo novamente)

### 2. Configurar Variável de Ambiente (Recomendado)

Adicione o token como variável de ambiente no seu shell:

```bash
# Abra o arquivo de configuração do seu shell
nano ~/.zshrc

# Adicione esta linha ao final do arquivo:
export GITHUB_PERSONAL_ACCESS_TOKEN="seu_token_aqui"

# Salve (Ctrl+O, Enter, Ctrl+X) e recarregue:
source ~/.zshrc
```

### 3. Configurar o MCP no Cursor

#### Opção A: Via Interface do Cursor

1. Abra o Cursor
2. Pressione `Cmd+Shift+P` (Command Palette)
3. Digite: "Preferences: Open User Settings (JSON)"
4. Adicione ou modifique a seção `mcp`:

```json
{
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
}
```

#### Opção B: Editar arquivo diretamente

```bash
# Abra o arquivo de configurações do Cursor
code ~/Library/Application\ Support/Cursor/User/settings.json
```

E adicione a mesma configuração acima.

### 4. Verificar a Instalação

1. Reinicie o Cursor completamente (feche todas as janelas)
2. Reabra o projeto qs-nexus
3. No Cursor, você pode verificar se o MCP está ativo observando se há novos recursos disponíveis

### 5. Testar a Integração

Após configurar, você pode testar perguntando ao Cursor:
- "Liste os pull requests abertos neste repositório"
- "Mostre os últimos commits"
- "Qual é o status das issues abertas?"

## Recursos Disponíveis com o MCP GitHub

Com o MCP do GitHub configurado, o Cursor terá acesso a:

- 📋 **Repositórios**: Listar, pesquisar e obter informações
- 🔀 **Pull Requests**: Ver PRs abertos, fechados, comentários
- 🐛 **Issues**: Listar, criar, atualizar issues
- 📝 **Commits**: Histórico de commits e detalhes
- 🌿 **Branches**: Informações sobre branches
- 👥 **Colaboradores**: Dados dos colaboradores do repo
- 📊 **Estatísticas**: Insights e estatísticas do repositório

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca compartilhe seu token de acesso pessoal
- Não commite o token no repositório
- Use variáveis de ambiente para maior segurança
- Revogue tokens que não estão mais em uso em: https://github.com/settings/tokens

## Solução de Problemas

### O MCP não está funcionando

1. Verifique se o token está correto
2. Certifique-se de que reiniciou o Cursor após a configuração
3. Verifique se o npx está instalado: `npx --version`
4. Teste a variável de ambiente: `echo $GITHUB_PERSONAL_ACCESS_TOKEN`

### Erro de permissões

- Verifique se o token tem os scopes corretos
- Revogue e crie um novo token se necessário

### NPX não encontrado

```bash
# Instale o Node.js se necessário
brew install node

# Ou atualize o npm
npm install -g npm@latest
```

## Configuração Adicional (Opcional)

### Adicionar outros servidores MCP

Você pode adicionar outros servidores MCP ao mesmo arquivo de configuração:

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
      },
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem"],
        "env": {}
      }
    }
  }
}
```

## Referências

- [Documentação Oficial do MCP](https://modelcontextprotocol.io/)
- [MCP Server GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Cursor Docs - MCP](https://docs.cursor.com/context/mcp)

