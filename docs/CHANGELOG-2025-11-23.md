# Changelog - 23 de Novembro de 2025

## Implementação do Tema Amber Minima (Corrigido)

### Modificado

#### Tema e Design System (`app/globals.css`)

**Migração para Tailwind v4 CSS-First Configuration:**

- ✅ **Removida "gambiarra"**: Removidos todos os estilos CSS diretos com `!important` que eram workarounds
- ✅ **Implementado `@theme`**: Migrado para a forma correta do Tailwind v4 usando `@theme` diretamente no CSS
- ✅ **CSS-First Approach**: Seguindo a filosofia CSS-first do Tailwind v4 conforme [documentação oficial](https://github.com/rgfx/tailwind-llms/blob/main/tailwind-llms.txt)

**Novo Tema: Amber Minima (inspirado no 21st Magic)**

**Paleta de Cores no `@theme`:**
- **Primary**: Cor âmbar vibrante (#f59e0b) - hsl(38, 96%, 50%)
- **Background**: Branco puro minimalista (100%)
- **Foreground**: Cinza escuro (#262626) para excelente contraste
- **Accent**: Âmbar muito claro (#fffbeb) - hsl(48, 100%, 97%)
- **Muted**: Cinza muito claro (#f9fafb)
- **Border**: Cinza neutro (#e5e7eb)
- **Border radius**: 0.375rem (6px) para visual minimalista
- **Chart colors**: Paleta completa de cores de gráficos baseada em âmbar

**Modo Escuro:**
- **Background**: Preto profundo (#171717) - hsl(0, 0%, 9%)
- **Card**: Cinza escuro (#262626) - hsl(0, 0%, 15%)
- **Foreground**: Cinza claro (#e5e5e5) - hsl(0, 0%, 90%)
- **Primary**: Mantém âmbar vibrante para consistência
- **Accent**: Âmbar escuro (#92400e) com texto claro (#fde68a)
- **Sidebar**: Preto muito escuro (#0f0f0f)

#### Configuração Tailwind (`tailwind.config.js`)

**Refatoração:**
- ✅ **Removidas definições de cores**: Cores agora definidas no `@theme` do CSS
- ✅ **Mantido apenas essencial**: Plugins, keyframes, animações e outras configurações que não podem ser feitas no CSS
- ✅ **Adicionado `@config`**: Referência ao config no `globals.css` para compatibilidade

**Cores de Gráficos:**
- Adicionado suporte para paleta de cores de gráficos (chart-1 a chart-5)
- Cores baseadas em tons de âmbar para consistência visual
- Suporte completo para modo claro e escuro

**Novas Animações:**
- `fade-in` / `fade-out`: Animações de fade suaves
- `slide-in-from-top/bottom/left/right`: Animações de entrada em diferentes direções
- `scale-in`: Animação de escala para modais e popovers
- `shimmer`: Animação de shimmer para loading states

**Novas Sombras:**
- `soft`: Sombra suave para elevação sutil
- `medium`: Sombra média para cards e componentes
- `strong`: Sombra forte para modais e overlays

### Impacto

- **Solução Correta**: Agora usando a forma oficial do Tailwind v4, não mais workarounds
- **Melhor Performance**: O novo engine Oxide do Tailwind v4 processa isso de forma muito mais eficiente
- **Manutenibilidade**: Configuração mais simples e direta no CSS
- **Compatibilidade**: Funciona perfeitamente com variáveis CSS dinâmicas
- **Design Minimalista**: Tema inspirado no 21st Magic com visual limpo e moderno
- **Identidade Visual**: Cor âmbar vibrante cria identidade visual única e acolhedora
- **Acessibilidade**: Excelente contraste em modo claro e escuro
- **Consistência**: Paleta harmoniosa com tons de âmbar em toda a interface

### Arquivos Modificados

- `app/globals.css`: 
  - Adicionado `@theme` com todas as cores do tema (formato correto Tailwind v4)
  - Mantidas variáveis CSS em `:root` para uso direto em componentes
  - Removidos estilos CSS diretos (workaround anterior)
  - Adicionado `@config` para referenciar `tailwind.config.js`
- `tailwind.config.js`: 
  - Removidas definições de cores (agora no `@theme`)
  - Mantido apenas para plugins, keyframes e animações
- `docs/guides/tailwind-v4-css-variables.md`: Documentação completa da solução correta

### Referências

- [Tailwind CSS v4 LLM Guidelines](https://github.com/rgfx/tailwind-llms/blob/main/tailwind-llms.txt)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [CSS-First Configuration](https://tailwindcss.com/docs/v4-beta#css-first-configuration)
