<!-- 994a457e-f3fd-4b0b-9e12-7200478bea1a 2dad6aff-59c7-4412-a085-ca821b747f0b -->
# Implementação: Preview Markdown, Tags e Seletor de Modelo

## 1. Preview Markdown na Página de Detalhes

**Arquivo:** `app/(dashboard)/files/[id]/page.tsx`

- Adicionar estado `markdownViewMode: 'code' | 'preview'` para controlar a visualização
- Instalar `react-markdown` para renderizar markdown
- Adicionar botão "Ver Preview" ao lado do botão "Editar" quando em modo código
- Adicionar botão "Ver Código" quando em modo preview
- Renderizar markdown usando `react-markdown` quando em modo preview
- Manter o `<pre>` atual quando em modo código

**Dependência:** Instalar `react-markdown` via npm

## 2. Exibir Tags na Página de Detalhes

**Arquivo:** `app/(dashboard)/files/[id]/page.tsx`

- As tags já estão sendo retornadas pela API (`template.tags` é um array de strings)
- Adicionar seção de tags na card "Metadados do Template" (após "Resumo")
- Exibir tags como badges usando o componente `Badge` existente
- Mostrar mensagem "Nenhuma tag" quando o array estiver vazio

## 3. Seletor de Modelo no Chat

### 3.1. Criar tipos e enum para modelos

**Arquivo:** `lib/types/chat-models.ts` (novo)

- Criar enum `ChatModel` com os valores:
- `OPENAI_GPT_4O_MINI` = 'openai-gpt-4o-mini'
- `OPENAI_GPT_4O` = 'openai-gpt-4o'
- `GOOGLE_GEMINI_2_0_FLASH` = 'gemini-2.0-flash'
- `GOOGLE_GEMINI_2_0_FLASH_LITE` = 'gemini-2.0-flash-lite'
- `GOOGLE_GEMINI_2_5_FLASH` = 'gemini-2.5-flash'
- `GOOGLE_GEMINI_2_5_FLASH_LITE` = 'gemini-2.5-flash-lite'
- Criar função helper `getModelProvider(model: ChatModel)` que retorna o provider e nome do modelo correto

### 3.2. Atualizar API do Chat

**Arquivo:** `app/api/chat/route.ts`

- Importar `google` de `@ai-sdk/google`
- Importar tipos e helper de `lib/types/chat-models.ts`
- Aceitar `model` no body da requisição (opcional, default: `OPENAI_GPT_4O_MINI`)
- Usar `getModelProvider()` para obter provider e nome do modelo
- Substituir `openai('gpt-4o-mini')` por chamada dinâmica baseada no modelo escolhido

### 3.3. Atualizar Interface do Chat

**Arquivo:** `components/chat/chat-interface.tsx`

- Adicionar estado `selectedModel` com default `OPENAI_GPT_4O_MINI`
- Adicionar componente `Select` do shadcn/ui no header do chat
- Opções do select com labels amigáveis:
- "OpenAI GPT-4o Mini"
- "OpenAI GPT-4o"
- "Google Gemini 2.0 Flash"
- "Google Gemini 2.0 Flash Lite"
- "Google Gemini 2.5 Flash"
- "Google Gemini 2.5 Flash Lite"
- Passar `model` no body da requisição via `body` do `useChat` hook
- Verificar documentação do `useChat` para passar parâmetros customizados

**Nota:** O `useChat` do AI SDK pode precisar de configuração adicional para passar o modelo. Pode ser necessário usar `body` ou `sendExtraMessageFields` dependendo da versão.

### To-dos

- [ ] Instalar react-markdown para renderização de markdown
- [ ] Adicionar botões e lógica de alternância entre código e preview no componente de detalhes do arquivo
- [ ] Adicionar seção de tags na página de detalhes do arquivo
- [ ] Criar arquivo de tipos e enum para modelos de chat com helper function (usar nomes corretos: gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.5-flash, gemini-2.5-flash-lite)
- [ ] Atualizar API do chat para aceitar e usar diferentes modelos (OpenAI e Google)
- [ ] Adicionar seletor de modelo na interface do chat