# Guia de Contraste de Cores

## Problema Identificado

O sistema estava tendo problemas de visibilidade onde botões e elementos ficavam invisíveis por falta de contraste adequado entre cor de fundo e cor do elemento.

### Causa Raiz

No modo dark, a cor `--primary` estava definida como quase branca (98% lightness), o que causava problemas quando:
- Elementos com `bg-primary` eram colocados em fundos claros
- Botões com `variant="default"` ficavam invisíveis em cards brancos
- O `variant="destructive"` tinha opacidade reduzida no dark mode (`dark:bg-destructive/60`)

## Solução Implementada

### 1. Correção do Primary no Dark Mode

**Antes:**
```css
.dark {
  --primary: 210 40% 98%;  /* Quase branco - invisível em fundos claros */
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

**Depois:**
```css
.dark {
  --primary: 172 55% 45%;  /* Verde-azulado visível */
  --primary-foreground: 0 0% 100%;  /* Branco para contraste */
}
```

### 2. Correção do Destructive no Dark Mode

**Antes:**
```css
.dark {
  --destructive: 0 62.8% 30.6%;  /* Vermelho muito escuro */
}
```

**Depois:**
```css
.dark {
  --destructive: 0 72% 51%;  /* Vermelho mais claro e visível */
  --destructive-foreground: 0 0% 100%;  /* Branco para contraste */
}
```

### 3. Remoção de Opacidade no Button Destructive

**Antes:**
```tsx
destructive: "bg-destructive text-white ... dark:bg-destructive/60"
```

**Depois:**
```tsx
destructive: "bg-destructive text-destructive-foreground ..."
```

## Boas Práticas

### Para Ações Críticas (Delete, Danger, etc.)

**✅ RECOMENDADO:** Use cores explícitas para garantir visibilidade:
```tsx
<Button className="bg-red-600 hover:bg-red-700 text-white">
  Excluir
</Button>
```

**❌ EVITAR:** Depender apenas de variantes que podem ter problemas de contraste:
```tsx
<Button variant="destructive">  // Pode ficar invisível em alguns contextos
  Excluir
</Button>
```

### Para Botões Primários

**✅ RECOMENDADO:** Use `variant="default"` que agora tem contraste adequado:
```tsx
<Button variant="default">Salvar</Button>
```

### Verificação de Contraste

Sempre verifique se há contraste adequado entre:
- Cor do texto e cor de fundo
- Cor do botão e cor do container pai
- Estados hover/focus e estado normal

## Cores do Sistema

### Light Mode
- `--primary`: Verde-azulado escuro (#1F6B5F) - 28% lightness
- `--destructive`: Vermelho claro (#E63946) - 60% lightness
- `--background`: Branco puro - 100% lightness

### Dark Mode
- `--primary`: Verde-azulado médio - 45% lightness (corrigido)
- `--destructive`: Vermelho médio - 51% lightness (corrigido)
- `--background`: Cinza muito escuro - 4.9% lightness

## Notas Importantes

1. **Sempre teste em ambos os modos** (light e dark) antes de fazer deploy
2. **Use cores explícitas** para ações críticas que não podem falhar
3. **Verifique contraste** especialmente em cards e containers brancos
4. **Evite opacidades** em variantes de botões importantes

