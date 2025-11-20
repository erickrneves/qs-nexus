# Fase 1: Setup do Projeto Next.js (Integrado)

## 2024-11-20 - Passo 1.1: Integração Next.js no Projeto Atual

### Tarefas Concluídas

- [x] Instalar Next.js no projeto atual: `npm install next react react-dom`
- [x] Criar estrutura `app/` na raiz do projeto (não em pasta separada)
- [x] Configurar `next.config.js` para compatibilidade com scripts existentes
- [x] Atualizar `package.json` com scripts Next.js:
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
- [x] Manter scripts RAG existentes intactos (`rag:process`, `rag:filter`, etc.)
- [x] Configurar TypeScript (ajustar `tsconfig.json` para incluir `app/`, `components/`, `hooks/`)

### Arquivos Criados

- `next.config.js` - Configuração do Next.js
- `app/layout.tsx` - Layout raiz do Next.js
- `app/page.tsx` - Página inicial
- `app/globals.css` - Estilos globais com Tailwind

### Arquivos Modificados

- `package.json` - Adicionados scripts Next.js e dependências
- `tsconfig.json` - Atualizado para incluir novos diretórios e configurar JSX

### Decisões Técnicas

- **Integração no projeto existente**: Decidido integrar Next.js diretamente no projeto ao invés de criar pasta separada, mantendo compatibilidade com scripts RAG existentes
- **TypeScript**: Reutilizado configuração existente, apenas expandido paths e includes
- **Estrutura App Router**: Usado App Router do Next.js 14+ para melhor organização

### Problemas e Soluções

- **Problema**: Inicialização do Tailwind via CLI falhou devido ao `type: "module"` no package.json
- **Solução**: Criados arquivos de configuração manualmente (`tailwind.config.js` e `postcss.config.js`)

### Notas

- Todos os scripts RAG existentes foram preservados e continuam funcionando
- A estrutura permite que o Next.js e os scripts CLI coexistam sem conflitos

---

## 2024-11-20 - Passo 1.2: Configuração de Tailwind e shadcn/ui

### Tarefas Concluídas

- [x] Instalar e configurar Tailwind CSS:
  - `npm install -D tailwindcss postcss autoprefixer`
  - Criado `tailwind.config.js` manualmente
  - Criado `postcss.config.js`
- [x] Instalar shadcn/ui:
  - Criado `components.json` com configuração
  - Instalados componentes base: Button, Card, Input, Badge, Progress, Table, Label, Select

### Arquivos Criados

- `tailwind.config.js` - Configuração do Tailwind com tema shadcn
- `postcss.config.js` - Configuração do PostCSS
- `components.json` - Configuração do shadcn/ui
- `lib/utils.ts` - Função `cn()` para merge de classes Tailwind
- `components/ui/` - Componentes shadcn instalados

### Dependências Instaladas

- `tailwindcss`, `postcss`, `autoprefixer` (dev)
- `tailwindcss-animate`, `class-variance-authority`, `clsx`, `tailwind-merge`
- `lucide-react` - Ícones
- `@radix-ui/react-slot`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-select`

### Decisões Técnicas

- **Tema shadcn**: Configurado tema padrão do shadcn com variáveis CSS para cores
- **Componentes base**: Instalados apenas os componentes essenciais inicialmente, outros podem ser adicionados conforme necessário

---

## 2024-11-20 - Passo 1.3: Configuração de Ambiente

### Tarefas Concluídas

- [x] Verificar/criar `.env.local.example` (bloqueado pelo gitignore, mas variáveis documentadas)
- [x] Reutilizar conexão Drizzle existente em `lib/db/index.ts`

### Variáveis de Ambiente Necessárias

- `DATABASE_URL` (já existe)
- `OPENAI_API_KEY` (já existe)
- `NEXTAUTH_SECRET` (novo - usuário deve adicionar)
- `NEXTAUTH_URL` (novo - ex: `http://localhost:3000`)

### Notas

- Arquivo `.env.local.example` não pode ser criado diretamente (bloqueado), mas as variáveis necessárias estão documentadas
- Usuário deve adicionar `NEXTAUTH_SECRET` e `NEXTAUTH_URL` ao `.env.local` existente

---

## 2024-11-20 - Passo 1.4: Estrutura de Pastas

### Estrutura Criada

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── dashboard/
│   ├── upload/
│   ├── files/
│   └── layout.tsx
├── api/
│   ├── auth/
│   ├── documents/
│   ├── upload/
│   └── process/
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── ui/ (shadcn components)
├── dashboard/
├── upload/
├── files/
├── layout/
└── providers/

hooks/
└── useProcessStream.ts

lib/
├── auth/
├── db/
│   └── schema/
│       └── rag-users.ts
└── utils.ts
```

### Status da Fase 1

✅ **FASE 1 COMPLETA**
