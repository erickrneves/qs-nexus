<!-- 45ed4d3f-d596-4140-8c21-619df2f07080 ea4595d7-99d9-4e36-bf2a-de416e1ae5cb -->
# Página de Ajuda e Informações do Sistema

## Objetivo

Criar uma página completa de ajuda e informações do sistema que permita aos usuários entender e utilizar todas as funcionalidades do LegalWise RAG Dashboard. A página será organizada em abas para facilitar a navegação e o acesso às informações.

## Estrutura da Página

### Rota

- **Caminho**: `/help` ou `/about` (sugestão: `/help`)
- **Arquivo**: `app/(dashboard)/help/page.tsx`
- **Proteção**: Rota protegida (dentro do grupo `(dashboard)`)

### Abas Principais

1. **Visão Geral** (`overview`)

- O que é o LegalWise RAG
- Objetivo do sistema
- Arquitetura básica
- Tecnologias utilizadas
- Estatísticas do sistema (se disponível)

2. **Features** (`features`)

- Dashboard: estatísticas e gráficos
- Upload: como fazer upload de documentos
- Arquivos: lista e detalhes de documentos
- Chat RAG: como usar o chat com IA
- Settings: configuração de classificação e schema
- Cada feature com explicação, passos e dicas

3. **FAQ** (`faq`)

- Perguntas frequentes organizadas por categoria:
- Autenticação
- Upload e Processamento
- Chat RAG
- Configurações
- Problemas Comuns
- Usar Accordion para organizar perguntas e respostas

4. **Guias Rápidos** (`quick-guides`)

- Passos rápidos para tarefas comuns:
- Primeiro upload
- Primeira pergunta no chat
- Configurar classificação
- Editar markdown
- Reprocessar documento

## Componentes Necessários

### Componentes shadcn/ui a usar:

- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - para as abas principais
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` - para FAQ e seções colapsáveis
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - para destacar informações
- `Badge` - para tags e status
- `Separator` - para divisões visuais

### Ícones (lucide-react):

- `HelpCircle`, `Info`, `BookOpen`, `MessageSquare`, `Upload`, `FileText`, `Settings`, `LayoutDashboard`, `ChevronRight`

## Implementação

### 1. Criar página principal

- Arquivo: `app/(dashboard)/help/page.tsx`
- Estrutura com Tabs contendo as 4 abas principais
- Layout responsivo e moderno
- Conteúdo baseado na documentação em `docs/`

### 2. Adicionar link na sidebar

- Arquivo: `components/layout/sidebar.tsx`
- Adicionar item "Ajuda" ou "Sobre" no array `navigation`
- Ícone: `HelpCircle` ou `BookOpen`

### 3. Organizar conteúdo

#### Visão Geral

- Extrair informações de `docs/README.md`
- Explicar o pipeline RAG
- Listar características principais

#### Features

- Extrair informações de `docs/guides/dashboard.md`
- Organizar por feature (Dashboard, Upload, Arquivos, Chat, Settings)
- Incluir screenshots ou descrições visuais quando possível

#### FAQ

- Extrair perguntas de `docs/guides/dashboard.md` (seção Troubleshooting)
- Adicionar perguntas comuns baseadas nas features
- Organizar por categoria com Accordion

#### Guias Rápidos

- Criar passos práticos e objetivos
- Focar em tarefas mais comuns
- Usar formato de lista numerada ou cards

## Design e UX

- **Layout**: Container centralizado com max-width
- **Espaçamento**: Padding e gaps consistentes
- **Tipografia**: Hierarquia clara (h1, h2, h3)
- **Cores**: Usar tema do sistema (muted, primary, etc.)
- **Responsividade**: Mobile-first, adaptar para desktop
- **Navegação**: Links internos para outras páginas quando relevante

## Arquivos a Modificar/Criar

1. **Novo arquivo**:

- `app/(dashboard)/help/page.tsx` - Página principal de ajuda

2. **Modificar**:

- `components/layout/sidebar.tsx` - Adicionar link "Ajuda" na navegação

## Conteúdo Base

O conteúdo será extraído e adaptado de:

- `docs/README.md` - Visão geral
- `docs/guides/dashboard.md` - Features e troubleshooting
- `docs/INDEX.md` - Estrutura e referências
- `docs/architecture/DASHBOARD.md` - Detalhes técnicos (se necessário)

## Tracking de Progresso

### Estrutura de Tracking

Será criado um arquivo de progresso em `docs/implementation-progress/pagina-ajuda/progresso.md` que rastreará:

- Status de cada fase da implementação (✅ Concluída, 🚧 Em Progresso, ⏳ Pendente)
- Arquivos criados/modificados em cada fase
- Funcionalidades implementadas
- Validações realizadas
- Decisões técnicas tomadas
- Problemas encontrados e soluções
- Próximos passos

O arquivo será atualizado **a cada passo concluído** para permitir continuar a implementação depois.

### Formato de Tracking

Cada fase terá:

- **Status**: ✅ Concluída, 🚧 Em Progresso, ⏳ Pendente
- **Objetivos**: Lista de objetivos da fase
- **Arquivos Criados/Modificados**: Lista detalhada
- **Funcionalidades**: Checklist de funcionalidades implementadas
- **Validações Realizadas**: Checklist de validações
- **Decisões Técnicas**: Decisões importantes tomadas
- **Próximos Passos**: O que fazer em seguida
- **Notas Técnicas**: Observações importantes

### Fases de Implementação

#### Fase 1: Setup e Estrutura

**Status**: ⏳ Pendente

**Objetivos**:

- Criar arquivo de tracking em `docs/implementation-progress/pagina-ajuda/progresso.md`
- Criar página base com estrutura de Tabs
- Adicionar link "Ajuda" na sidebar

**Arquivos a Criar**:

- `docs/implementation-progress/pagina-ajuda/progresso.md` - Arquivo de tracking
- `app/(dashboard)/help/page.tsx` - Página principal de ajuda

**Arquivos a Modificar**:

- `components/layout/sidebar.tsx` - Adicionar item "Ajuda" no array `navigation`

**Funcionalidades**:

- [ ] Estrutura de tracking criada
- [ ] Página base com Tabs (4 abas: Visão Geral, Features, FAQ, Guias Rápidos)
- [ ] Link "Ajuda" na sidebar com ícone `HelpCircle` ou `BookOpen`
- [ ] Layout responsivo e moderno
- [ ] Navegação entre abas funcionando

**Validações**:

- [ ] Página acessível em `/help`
- [ ] Link na sidebar funcionando
- [ ] Tabs navegando corretamente
- [ ] Layout responsivo em mobile e desktop
- [ ] Sem erros de lint

#### Fase 2: Conteúdo - Visão Geral

**Status**: ⏳ Pendente

**Objetivos**:

- Implementar aba Visão Geral
- Extrair e adaptar conteúdo de `docs/README.md`
- Explicar o pipeline RAG
- Listar características principais

**Arquivos a Modificar**:

- `app/(dashboard)/help/page.tsx` - Implementar conteúdo da aba Visão Geral

**Funcionalidades**:

- [ ] Seção "O que é o LegalWise RAG"
- [ ] Seção "Objetivo do sistema"
- [ ] Seção "Arquitetura básica"
- [ ] Seção "Tecnologias utilizadas"
- [ ] Seção "Características principais" (lista de features principais)
- [ ] Layout com Cards e Badges para destacar informações

**Validações**:

- [ ] Conteúdo extraído corretamente da documentação
- [ ] Texto formatado e legível
- [ ] Links funcionando (se houver)
- [ ] Layout responsivo

#### Fase 3: Conteúdo - Features

**Status**: ⏳ Pendente

**Objetivos**:

- Implementar aba Features
- Organizar por funcionalidade (Dashboard, Upload, Arquivos, Chat, Settings)
- Extrair informações de `docs/guides/dashboard.md`

**Arquivos a Modificar**:

- `app/(dashboard)/help/page.tsx` - Implementar conteúdo da aba Features

**Funcionalidades**:

- [ ] Seção "Dashboard" com explicação de estatísticas e gráficos
- [ ] Seção "Upload" com instruções de como fazer upload
- [ ] Seção "Arquivos" com explicação de lista e detalhes
- [ ] Seção "Chat RAG" com instruções de uso
- [ ] Seção "Settings" com explicação de configurações
- [ ] Cada seção com: explicação, passos e dicas
- [ ] Uso de Cards para organizar cada feature

**Validações**:

- [ ] Conteúdo extraído corretamente da documentação
- [ ] Instruções claras e objetivas
- [ ] Layout organizado e fácil de navegar
- [ ] Links para outras páginas quando relevante

#### Fase 4: Conteúdo - FAQ

**Status**: ⏳ Pendente

**Objetivos**:

- Implementar aba FAQ
- Organizar por categoria com Accordion
- Extrair perguntas de `docs/guides/dashboard.md` (seção Troubleshooting)

**Arquivos a Modificar**:

- `app/(dashboard)/help/page.tsx` - Implementar conteúdo da aba FAQ

**Funcionalidades**:

- [ ] Categoria "Autenticação" com perguntas sobre login/registro
- [ ] Categoria "Upload e Processamento" com perguntas sobre upload
- [ ] Categoria "Chat RAG" com perguntas sobre chat
- [ ] Categoria "Configurações" com perguntas sobre settings
- [ ] Categoria "Problemas Comuns" com troubleshooting
- [ ] Uso de Accordion para organizar perguntas e respostas
- [ ] Cada categoria com múltiplas perguntas relevantes

**Validações**:

- [ ] Perguntas extraídas corretamente da documentação
- [ ] Respostas claras e úteis
- [ ] Accordion funcionando corretamente
- [ ] Categorias bem organizadas

#### Fase 5: Conteúdo - Guias Rápidos

**Status**: ⏳ Pendente

**Objetivos**:

- Implementar aba Guias Rápidos
- Criar passos práticos para tarefas comuns
- Focar em tarefas mais utilizadas

**Arquivos a Modificar**:

- `app/(dashboard)/help/page.tsx` - Implementar conteúdo da aba Guias Rápidos

**Funcionalidades**:

- [ ] Guia "Primeiro Upload" com passos numerados
- [ ] Guia "Primeira Pergunta no Chat" com passos
- [ ] Guia "Configurar Classificação" com passos
- [ ] Guia "Editar Markdown" com passos
- [ ] Guia "Reprocessar Documento" com passos
- [ ] Uso de Cards ou lista numerada para cada guia
- [ ] Ícones para cada guia (opcional)

**Validações**:

- [ ] Passos claros e objetivos
- [ ] Guias cobrindo tarefas principais
- [ ] Layout fácil de seguir
- [ ] Links para páginas relevantes quando necessário

#### Fase 6: Documentação e Finalização

**Status**: ⏳ Pendente

**Objetivos**:

- Atualizar documentação existente
- Criar/atualizar changelog
- Finalizar arquivo de tracking

**Arquivos a Criar/Atualizar**:

- `docs/implementation-progress/pagina-ajuda/progresso.md` - Finalizar tracking
- `docs/guides/dashboard.md` - Adicionar referência à página de ajuda (se necessário)
- `docs/INDEX.md` - Incluir referência à nova página
- `docs/CHANGELOG-YYYY-MM-DD.md` - Criar ou atualizar changelog

**Funcionalidades**:

- [ ] Arquivo de tracking completo e atualizado
- [ ] Referência à página de ajuda na documentação
- [ ] Changelog criado/atualizado seguindo padrão existente
- [ ] Documentação consistente e completa

**Validações**:

- [ ] Todas as fases marcadas como concluídas no tracking
- [ ] Documentação atualizada corretamente
- [ ] Changelog seguindo padrão dos outros changelogs
- [ ] Links funcionando na documentação

## Documentação Após Implementação

### Arquivos de Documentação a Criar/Atualizar

#### 1. Progresso da Implementação

**Arquivo**: `docs/implementation-progress/pagina-ajuda/progresso.md`

**Conteúdo**:

- Status geral do projeto
- Status de cada fase (✅, 🚧, ⏳)
- Detalhamento completo de cada fase:
  - Objetivos
  - Arquivos criados/modificados
  - Funcionalidades implementadas (checklist)
  - Validações realizadas (checklist)
  - Decisões técnicas
  - Problemas encontrados e soluções
  - Próximos passos
  - Notas técnicas
- Resultados finais
- Status final do projeto

**Formato**: Seguir padrão de `docs/implementation-progress/classification-config/classificacao-configuravel-schema-dinamico.md`

#### 2. Documentação de Usuário

**Arquivos a Atualizar**:

- `docs/guides/dashboard.md`:
  - Adicionar seção sobre página de ajuda (se necessário)
  - Referenciar página de ajuda na seção de navegação

- `docs/INDEX.md`:
  - Adicionar referência à página de ajuda na seção de guias
  - Incluir link para a página

**Conteúdo**:

- Descrição da página de ajuda
- Como acessar (`/help`)
- Estrutura das abas
- Links relacionados

#### 3. Changelog

**Arquivo**: `docs/CHANGELOG-YYYY-MM-DD.md` (criar novo ou atualizar existente)

**Conteúdo**:

- Data da implementação
- Descrição da feature
- Funcionalidades adicionadas:
  - Página de ajuda com 4 abas
  - Link na sidebar
  - Conteúdo completo extraído da documentação
- Arquivos criados/modificados
- Melhorias de UX

**Formato**: Seguir padrão de `docs/CHANGELOG-2025-11-22.md` e `docs/CHANGELOG-2025-11-21.md`

### Estrutura do Arquivo de Tracking

O arquivo `docs/implementation-progress/pagina-ajuda/progresso.md` seguirá esta estrutura:

```markdown
# Página de Ajuda e Informações do Sistema - Progresso

Este documento rastreia o progresso da implementação da página de ajuda e informações do sistema.

## Status Geral

- **Fase 1**: ⏳ Pendente - Setup e Estrutura
- **Fase 2**: ⏳ Pendente - Conteúdo - Visão Geral
- **Fase 3**: ⏳ Pendente - Conteúdo - Features
- **Fase 4**: ⏳ Pendente - Conteúdo - FAQ
- **Fase 5**: ⏳ Pendente - Conteúdo - Guias Rápidos
- **Fase 6**: ⏳ Pendente - Documentação e Finalização

---

## Fase 1: Setup e Estrutura

### Status: ⏳ Pendente

### Objetivos
- Criar arquivo de tracking
- Criar página base com estrutura de Tabs
- Adicionar link "Ajuda" na sidebar

### Arquivos Criados/Modificados

#### Criados:
- `docs/implementation-progress/pagina-ajuda/progresso.md` - Este arquivo
- `app/(dashboard)/help/page.tsx` - Página principal de ajuda

#### Modificados:
- `components/layout/sidebar.tsx` - Adicionado item "Ajuda" no array `navigation`

### Funcionalidades
- [ ] Estrutura de tracking criada
- [ ] Página base com Tabs (4 abas)
- [ ] Link "Ajuda" na sidebar
- [ ] Layout responsivo

### Validações
- [ ] Página acessível em `/help`
- [ ] Link na sidebar funcionando
- [ ] Tabs navegando corretamente
- [ ] Sem erros de lint

### Decisões Técnicas
(Será preenchido durante implementação)

### Próximos Passos
1. Iniciar Fase 2: Conteúdo - Visão Geral

### Notas Técnicas
(Será preenchido durante implementação)

---

[Repetir estrutura para cada fase]
```

### Atualização do Tracking

**Durante a implementação**:

- Atualizar o arquivo de tracking **a cada passo concluído**
- Marcar funcionalidades como concluídas ([x])
- Adicionar decisões técnicas tomadas
- Documentar problemas encontrados e soluções
- Atualizar status da fase (⏳ → 🚧 → ✅)

**Ao finalizar cada fase**:

- Marcar fase como ✅ Concluída
- Documentar resultados
- Atualizar próximos passos
- Adicionar notas técnicas relevantes

**Ao finalizar o projeto**:

- Marcar todas as fases como concluídas
- Adicionar seção "Status Final do Projeto"
- Documentar resultados finais
- Atualizar documentação de usuário
- Criar/atualizar changelog

## Próximos Passos (Opcional)

- Adicionar busca na página de ajuda
- Adicionar links para documentação completa
- Adicionar vídeos ou screenshots
- Criar componente reutilizável para cards de feature

#### Fase 1: Setup e Estrutura

- [ ] Criar arquivo de tracking em `docs/implementation-progress/pagina-ajuda/progresso.md`
- [ ] Criar página principal de ajuda em `app/(dashboard)/help/page.tsx` com estrutura de Tabs contendo as 4 abas (Visão Geral, Features, FAQ, Guias Rápidos)
- [ ] Adicionar link 'Ajuda' na sidebar com ícone HelpCircle ou BookOpen
- [ ] Validar navegação e layout responsivo

#### Fase 2: Conteúdo - Visão Geral

- [ ] Implementar aba Visão Geral com informações sobre o sistema, objetivo, arquitetura e tecnologias
- [ ] Extrair e adaptar conteúdo de `docs/README.md`
- [ ] Validar formatação e legibilidade

#### Fase 3: Conteúdo - Features

- [ ] Implementar aba Features com explicações detalhadas de cada funcionalidade (Dashboard, Upload, Arquivos, Chat, Settings)
- [ ] Extrair informações de `docs/guides/dashboard.md`
- [ ] Organizar por feature com Cards
- [ ] Validar instruções e links

#### Fase 4: Conteúdo - FAQ

- [ ] Implementar aba FAQ com perguntas frequentes organizadas por categoria usando Accordion
- [ ] Extrair perguntas de `docs/guides/dashboard.md` (seção Troubleshooting)
- [ ] Organizar por categoria (Autenticação, Upload, Chat, Configurações, Problemas Comuns)
- [ ] Validar perguntas e respostas

#### Fase 5: Conteúdo - Guias Rápidos

- [ ] Implementar aba Guias Rápidos com passos práticos para tarefas comuns
- [ ] Criar guias: Primeiro Upload, Primeira Pergunta no Chat, Configurar Classificação, Editar Markdown, Reprocessar Documento
- [ ] Validar clareza dos passos

#### Fase 6: Documentação e Finalização

- [ ] Finalizar arquivo de tracking com todas as fases concluídas
- [ ] Atualizar `docs/guides/dashboard.md` com referência à página de ajuda
- [ ] Atualizar `docs/INDEX.md` para incluir referência à nova página
- [ ] Criar/atualizar changelog seguindo padrão existente
- [ ] Validar toda a documentação

### To-dos

- [ ] Criar página principal de ajuda em app/(dashboard)/help/page.tsx com estrutura de Tabs contendo as 4 abas (Visão Geral, Features, FAQ, Guias Rápidos)
- [ ] Adicionar link 'Ajuda' na sidebar com ícone HelpCircle ou BookOpen
- [ ] Implementar aba Visão Geral com informações sobre o sistema, objetivo, arquitetura e tecnologias
- [ ] Implementar aba Features com explicações detalhadas de cada funcionalidade (Dashboard, Upload, Arquivos, Chat, Settings)
- [ ] Implementar aba FAQ com perguntas frequentes organizadas por categoria usando Accordion
- [ ] Implementar aba Guias Rápidos com passos práticos para tarefas comuns