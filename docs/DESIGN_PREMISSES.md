# QS Nexus - Premissas de Design

## Contexto do Projeto

### Visão Geral
**QS Nexus** é uma solução interna da **QS Consultoria** para análise inteligente de documentos fiscais e contábeis utilizando tecnologia RAG (Retrieval-Augmented Generation).

### Funcionalidades Core
- Ingestão e processamento de arquivos SPED (ECD, ECF, EFD-ICMS/IPI, EFD-Contribuições)
- Importação de planilhas CSV com detecção automática de delimitador
- Análise de documentos (PDF, TXT, DOCX)
- Consultor IA com acesso a dados estruturados e busca semântica
- Dashboard analítico com métricas de processamento

### Arquitetura
- **Multi-tenant**: Suporte a múltiplas organizações/clientes
- **Multi-users**: Sistema de usuários com autenticação segura
- **Hierarquia de Roles**: Permissões baseadas em papéis (admin, user, viewer)

---

## Design System

### Filosofia
O design segue uma abordagem **Glass + Minimalista**, inspirada em produtos como Stripe, Linear e Vercel. O objetivo é criar uma interface que seja:

1. **Profissional** - Aparência de software empresarial de alto padrão
2. **Limpa** - Foco no conteúdo, sem distrações visuais
3. **Acessível** - Boa legibilidade e contraste
4. **Consistente** - Padrões visuais mantidos em toda aplicação

### Paleta de Cores

#### Light Mode
| Token | Valor | Uso |
|-------|-------|-----|
| `--qs-bg` | `#faf8f5` | Fundo principal (tom areia quente) |
| `--qs-card` | `#ffffff` | Cards e superfícies elevadas |
| `--qs-muted` | `#f3f1ec` | Áreas mutadas, backgrounds secundários |
| `--qs-surface` | `#f7f5f0` | Superfícies alternativas |
| `--qs-text` | `#1e293b` | Texto principal |
| `--qs-text-muted` | `#64748b` | Texto secundário |
| `--qs-text-tertiary` | `#94a3b8` | Texto terciário |
| `--qs-border` | `#e7e4dd` | Bordas (tom areia) |
| `--qs-primary` | `#2563eb` | Cor primária (azul) |
| `--qs-brand` | `#D4AF37` | Cor da marca (dourado) |

#### Dark Mode
| Token | Valor | Uso |
|-------|-------|-----|
| `--qs-bg` | `#0f0f10` | Fundo principal escuro |
| `--qs-card` | `#1a1a1c` | Cards escuros |
| `--qs-muted` | `#242426` | Áreas mutadas escuras |
| `--qs-primary` | `#3b82f6` | Primária mais brilhante |
| `--qs-brand` | `#e4bf47` | Dourado mais brilhante |

### Glassmorphism

Efeito glass para elementos de destaque:

```css
.glass {
  background: var(--glass-bg); /* rgba(255, 255, 255, 0.7) */
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

### Tipografia

- **Font Family**: Inter, system fonts fallback
- **Tamanhos**: 
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)

### Border Radius

| Token | Valor |
|-------|-------|
| `--qs-radius-sm` | 6px |
| `--qs-radius` | 10px |
| `--qs-radius-md` | 12px |
| `--qs-radius-lg` | 16px |
| `--qs-radius-xl` | 20px |

### Sombras

Sistema de sombras suaves e naturais:

| Token | Uso |
|-------|-----|
| `--qs-shadow-xs` | Elementos sutis |
| `--qs-shadow-sm` | Cards, inputs |
| `--qs-shadow` | Elementos elevados |
| `--qs-shadow-md` | Modais, dropdowns |
| `--qs-shadow-lg` | Elementos muito elevados |
| `--qs-shadow-primary` | Botões primários |

---

## Componentes

### Button

Variantes disponíveis:
- `default` - Botão primário azul
- `secondary` - Fundo mutado
- `outline` - Borda sem preenchimento
- `ghost` - Transparente com hover
- `destructive` - Ações destrutivas (vermelho)
- `brand` - Gradiente dourado
- `glass` - Efeito glassmorphism

Estados:
- `hover` - Escurecimento/clareamento sutil
- `active` - Scale 0.98 para feedback tátil
- `disabled` - Opacity 0.5, pointer-events none
- `focus` - Ring azul com offset

### Card

Versões:
- `Card` - Card padrão com borda
- `GlassCard` - Card com efeito glass

### Input

- Altura padrão: 44px (h-11)
- Border radius: 12px (rounded-xl)
- Focus: Border azul + ring sutil

### Tabs

- Background mutado no container
- Tab ativa: Fundo primário com sombra
- Transições suaves

### Sidebar

- Colapsável com animação
- Tooltips quando colapsada
- Item ativo com fundo primário
- Footer com indicador de status

---

## Padrões de Interação

### Transições
- Duração padrão: 200ms
- Easing: ease-out ou cubic-bezier(0.4, 0, 0.2, 1)

### Feedback Visual
- Hover: Mudança de cor/background sutil
- Active: Scale 0.98 em botões
- Focus: Ring com cor primária
- Loading: Shimmer animation

### Animações
- `fadeIn` - Entrada com opacidade
- `slideUp` - Entrada de baixo para cima
- `scaleIn` - Entrada com scale

---

## Responsividade

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

### Mobile First
- Sidebar: Sheet em mobile, fixa em desktop
- Navbar: Informações de usuário hidden em mobile
- Cards: Full width em mobile, grid em desktop

---

## Acessibilidade

- Contraste mínimo WCAG AA
- Focus visible em todos elementos interativos
- Labels em inputs
- Screen reader only text onde necessário
- Keyboard navigation suportada

---

## Versionamento

- **Versão atual**: 2.0.0
- **Design System baseado em**: qs-comercial-claude
- **Última atualização**: Novembro 2025

