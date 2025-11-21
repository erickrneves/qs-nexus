# Fase 2: Autenticação

## 2024-11-20 - Passo 2.1: Schema de Usuários

### Tarefas Concluídas

- [x] Criar migration para tabela `rag_users`:
  - `id` (UUID)
  - `email` (unique)
  - `password` (hashed)
  - `name`
  - `createdAt`, `updatedAt`
- [x] Adicionar schema Drizzle em `lib/db/schema/rag-users.ts`

### Arquivos Criados

- `lib/db/schema/rag-users.ts` - Schema Drizzle para tabela `rag_users`
- `lib/db/migrations/0001_sloppy_wonder_man.sql` - Migration gerada automaticamente

### Arquivos Modificados

- `drizzle.config.ts` - Adicionado `rag-users.ts` ao array de schemas

### Decisões Técnicas

- **Nome da tabela**: Usado `rag_users` ao invés de `users` para evitar conflito com tabela `User` existente no banco
- **Migration**: Gerada automaticamente via `drizzle-kit generate` e executada com `npm run db:migrate`

### Comandos Executados

```bash
npm run db:generate
npm run db:migrate
```

---

## 2024-11-20 - Passo 2.2: NextAuth.js Setup

### Tarefas Concluídas

- [x] Instalar `next-auth@beta` e dependências
- [x] Criar `lib/auth/config.ts` com configuração NextAuth
- [x] Configurar provider de credenciais
- [x] Criar API route `app/api/auth/[...nextauth]/route.ts`
- [x] Criar middleware para proteger rotas

### Arquivos Criados

- `lib/auth/config.ts` - Configuração do NextAuth v5 (beta)
- `app/api/auth/[...nextauth]/route.ts` - API route do NextAuth
- `middleware.ts` - Middleware para proteção de rotas
- `types/next-auth.d.ts` - Tipos TypeScript para NextAuth
- `components/providers/session-provider.tsx` - Provider de sessão

### Dependências Instaladas

- `next-auth@5.0.0-beta.30` - NextAuth v5 (beta)
- `@auth/drizzle-adapter@^1.11.1` - Adapter para Drizzle (não usado no v5, mas instalado)
- `bcryptjs@^3.0.3` - Hash de senhas
- `@types/bcryptjs` - Tipos TypeScript

### Decisões Técnicas

- **NextAuth v5**: Usado versão beta do NextAuth v5 que tem API diferente do v4
  - Usa `NextAuth()` diretamente ao invés de `NextAuthOptions`
  - Exporta `handlers`, `signIn`, `signOut`, `auth` diretamente
  - Middleware usa `auth()` ao invés de `withAuth()`
- **Estratégia JWT**: Usado JWT para sessões (mais simples, não requer banco de sessões)
- **Provider de Credenciais**: Implementado manualmente com validação de senha via bcrypt

### Problemas e Soluções

- **Problema**: NextAuth v5 tem API diferente do v4
- **Solução**: Ajustado código para usar nova API do v5 beta
- **Problema**: DrizzleAdapter não funciona diretamente com NextAuth v5
- **Solução**: Implementado provider de credenciais manualmente, validando contra tabela `rag_users`

### Notas

- NextAuth v5 ainda está em beta, mas oferece melhor integração com App Router
- A autenticação funciona, mas pode precisar de ajustes quando v5 for estável

---

## 2024-11-20 - Passo 2.3: Páginas de Autenticação

### Tarefas Concluídas

- [x] Criar `app/(auth)/login/page.tsx`:
  - Formulário de login
  - Validação básica
  - Redirecionamento após login
- [x] Criar `app/(auth)/register/page.tsx`:
  - Formulário de registro
  - Hash de senha (bcrypt)
  - Validação de email único
- [x] Criar API route `app/api/auth/register/route.ts`

### Arquivos Criados

- `app/(auth)/login/page.tsx` - Página de login
- `app/(auth)/register/page.tsx` - Página de registro
- `app/api/auth/register/route.ts` - API para registro de usuários
- `components/ui/label.tsx` - Componente Label do shadcn

### Decisões Técnicas

- **Validação**: Validação básica no frontend e validação completa no backend
- **Hash de senha**: Usado bcrypt com salt rounds 10
- **UI**: Usado shadcn/ui para formulários (Card, Input, Button, Label)
- **Notificações**: Integrado react-hot-toast para feedback ao usuário

### Notas

- Validação com Zod pode ser adicionada posteriormente para melhorar UX
- Páginas de autenticação estão funcionais e estilizadas com shadcn/ui

### Status da Fase 2

✅ **FASE 2 COMPLETA**
