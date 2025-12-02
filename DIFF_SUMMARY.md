# Resumo de Mudanças - Diff Simplificado

Este documento complementa o `CHANGELOG_SESSION.md` com exemplos de código das principais mudanças.

---

## 1. Sistema de Notificações

### Migration - Tabela de Notificações

**Arquivo**: `lib/db/migrations/0009_create_notifications.sql`

```sql
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'progress');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    user_id UUID NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    status notification_status NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_status ON notifications(status);
```

### Serviço de Notificações

**Arquivo**: `lib/services/notification-service.ts`

```typescript
export async function createNotification(params: {
  userId: string
  organizationId?: string
  type: string
  title: string
  message: string
  link?: string
  data?: any
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      organizationId: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      data: params.data,
      status: 'unread',
    })
    .returning()

  return notification
}
```

### Integração no Upload SPED

**Arquivo**: `app/api/ingest/sped/route.ts`

```typescript
// Após processamento bem-sucedido
await createNotification({
  userId,
  type: 'sped_complete',
  title: 'SPED Processado com Sucesso',
  message: `O arquivo "${file.name}" foi processado com sucesso.`,
  link: `/files/${documentFile.id}`,
  data: {
    fileName: file.name,
    stats: {
      accounts: accountsImported,
      balances: balancesImported,
      entries: entriesImported,
      items: itemsImported,
    },
  },
})

// Em caso de erro
await createNotification({
  userId,
  type: 'sped_failed',
  title: 'Erro ao Processar SPED',
  message: `Falha ao processar "${file.name}": ${error.message}`,
  data: { fileName: file.name, error: error.message },
})
```

---

## 2. Processamento Assíncrono de SPED

### Antes (Síncrono)

```typescript
// ANTES: Bloqueava até terminar
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Processamento completo (pode levar minutos)
  const result = await processSpedFile(file)
  
  return NextResponse.json(result) // Cliente espera todo esse tempo
}
```

### Depois (Assíncrono)

```typescript
// DEPOIS: Retorna jobId imediatamente
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  const jobId = uuidv4()
  
  // Inicia processamento em background
  processSpedFileAsync(jobId, file, userId).catch(console.error)
  
  // Retorna imediatamente
  return NextResponse.json({ 
    jobId,
    estimatedTime: calculateEstimatedTime(file.size) 
  })
}

// Função assíncrona que roda em background
async function processSpedFileAsync(
  jobId: string, 
  file: File, 
  userId: string
) {
  try {
    emitProgress(jobId, { step: 1, message: 'Parsing arquivo...' })
    const parsed = await parseSped(file)
    
    emitProgress(jobId, { step: 2, message: 'Salvando no banco...' })
    await saveSped(parsed)
    
    // ... demais etapas
    
    // Notifica sucesso
    await createNotification({
      userId,
      type: 'sped_complete',
      title: 'SPED Processado',
      message: 'Processamento concluído!',
    })
  } catch (error) {
    // Notifica erro
    await createNotification({
      userId,
      type: 'sped_failed',
      title: 'Erro no SPED',
      message: error.message,
    })
  }
}
```

---

## 3. Configurações por Tipo de Documento

### Migration - Document Type

**Arquivo**: `lib/db/migrations/0007_add_document_type.sql`

```sql
CREATE TYPE document_type AS ENUM ('juridico', 'contabil', 'geral');

ALTER TABLE classification_configs 
ADD COLUMN document_type document_type DEFAULT 'geral';

ALTER TABLE template_schema_configs 
ADD COLUMN document_type document_type DEFAULT 'geral';

CREATE INDEX idx_classification_configs_doc_type 
ON classification_configs(document_type);
```

### Interface com Tabs

**Arquivo**: `app/(dashboard)/settings/classification/page.tsx`

```tsx
export default function ClassificationSettingsPage() {
  const [activeTab, setActiveTab] = useState<DocumentType>('juridico')
  
  // Filtra configs por tipo
  const juridicoConfigs = configs.filter(c => c.documentType === 'juridico')
  const contabilConfigs = configs.filter(c => c.documentType === 'contabil')

  return (
    <SettingsLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="juridico">
            <FileText /> Documentos Jurídicos
          </TabsTrigger>
          <TabsTrigger value="contabil">
            <Database /> Dados Contábeis (SPED)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="juridico">
          {renderConfigCards(juridicoConfigs, 'juridico')}
        </TabsContent>

        <TabsContent value="contabil">
          {renderConfigCards(contabilConfigs, 'contabil')}
        </TabsContent>
      </Tabs>
    </SettingsLayout>
  )
}
```

### Schema SPED

**Arquivo**: `lib/schemas/sped-classification-schema.ts`

```typescript
export const SpedClassificationSchema = z.object({
  // Identificação
  cnpj: z.string(),
  companyName: z.string(),
  spedType: z.enum(['ECD', 'ECF', 'EFD-ICMS/IPI', 'EFD-Contribuições']),
  
  // Período
  periodStart: z.string(),
  periodEnd: z.string(),
  fiscalYear: z.number(),
  
  // Métricas Financeiras
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  totalAssets: z.number(),
  totalLiabilities: z.number(),
  
  // Indicadores (calculados)
  profitMargin: z.number(), // (lucro / receita) * 100
  debtRatio: z.number(),    // (passivo / ativo) * 100
  liquidityRatio: z.number(), // ativo circulante / passivo circulante
  
  // Análise de Risco (AI)
  riskLevel: z.enum(['baixo', 'medio', 'alto']),
  suspiciousPatterns: z.array(z.string()),
  anomalies: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
  })),
  
  // Qualidade dos Dados
  dataQuality: z.enum(['excelente', 'boa', 'regular', 'ruim']),
  completenessScore: z.number().min(0).max(100),
  
  tags: z.array(z.string()),
  summary: z.string(),
})
```

---

## 4. Melhorias de UX - Componentes Sólidos

### Problema: Popover Translúcido

**ANTES**:
```tsx
<PopoverContent className="w-96 p-0 bg-popover border-border shadow-xl">
  {/* Fundo translúcido, difícil de ler */}
</PopoverContent>
```

**DEPOIS**:
```tsx
<PopoverContent 
  className="w-96 p-0 bg-card border-border shadow-xl"
  style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
>
  {/* Fundo 100% opaco, legível */}
</PopoverContent>
```

### CSS Global para Forçar Backgrounds Sólidos

**Arquivo**: `app/globals.css`

```css
/* ============================================
   POPOVER & DROPDOWN - Backgrounds Sólidos
   ============================================ */
[data-radix-popper-content-wrapper],
[role="dialog"],
[role="menu"],
[role="tablist"] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Garantir backgrounds 100% opacos */
[data-radix-popper-content-wrapper] > *,
[role="dialog"] > *,
[role="menu"] > * {
  background-color: hsl(var(--card)) !important;
}

/* Tabs - backgrounds sólidos */
[role="tablist"] {
  background-color: hsl(var(--muted)) !important;
}

[role="tab"][data-state="active"] {
  background-color: hsl(var(--card)) !important;
}
```

---

## 5. Componente de Notificações

**Arquivo**: `components/notifications/notification-popover.tsx`

```tsx
export function NotificationPopover() {
  const { notifications, unreadCount, markAsRead } = useNotifications()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute right-1 top-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 bg-card">
        <div className="border-b p-4">
          <h3>Notificações</h3>
          {unreadCount > 0 && (
            <p>{unreadCount} não lidas</p>
          )}
        </div>

        <ScrollArea className="h-[400px] bg-card">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={cn(
                'p-4 hover:bg-accent',
                !notification.read && 'bg-primary/10'
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="text-2xl">
                {getIcon(notification.type)}
              </div>
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <small>
                {formatDistanceToNow(notification.createdAt, { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </small>
            </div>
          ))}
        </ScrollArea>

        <div className="border-t p-2">
          <Link href="/notifications">
            <Button variant="ghost">Ver todas</Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

---

## 6. Hook de Notificações

**Arquivo**: `hooks/use-notifications.ts`

```typescript
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    
    // Refresh a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' })
    await fetchNotifications()
  }

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    await fetchNotifications()
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markAsRead,
    deleteNotification,
  }
}
```

---

## 7. Correções de Bugs Importantes

### Bug: UUID Inválido

**ANTES**:
```typescript
const userId = 'dev-user-123' // ❌ Erro: invalid input syntax for type uuid
```

**DEPOIS**:
```typescript
const userId = '00000000-0000-0000-0000-000000000001' // ✅ UUID válido
```

### Bug: Loop Infinito de Re-renders

**ANTES**:
```tsx
useEffect(() => {
  // onFilesSelected muda a cada render
  if (selectedFiles.length > 0) {
    onFilesSelected(selectedFiles)
  }
}, [selectedFiles, onFilesSelected]) // ❌ Causa loop infinito
```

**DEPOIS**:
```tsx
useEffect(() => {
  if (selectedFiles.length > 0) {
    onFilesSelected(selectedFiles)
  }
}, [selectedFiles]) // ✅ onFilesSelected removido da dependência
```

### Bug: Polling Constante de Sessão

**ANTES**:
```tsx
<SessionProvider>
  {/* Faz request para /api/auth/session a cada 5 segundos */}
  {children}
</SessionProvider>
```

**DEPOIS**:
```tsx
<SessionProvider 
  refetchInterval={0}
  refetchOnWindowFocus={false}
>
  {/* Desabilitado polling automático */}
  {children}
</SessionProvider>
```

---

## 8. Seeds de Configuração

**Arquivo**: `scripts/seed-classification-configs.ts`

```typescript
async function seedConfigs() {
  // Config para Documentos Jurídicos
  await createClassificationConfig({
    name: 'Classificação - Documentos Jurídicos',
    documentType: 'juridico',
    systemPrompt: DOCX_CLASSIFICATION_PROMPT,
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isActive: true,
  })

  // Schema para Documentos Jurídicos
  await createTemplateSchemaConfig({
    name: 'Schema Padrão - Documentos Jurídicos',
    documentType: 'juridico',
    fields: DOCX_SCHEMA_FIELDS,
    isActive: true,
  })

  // Config para SPED
  await createClassificationConfig({
    name: 'Classificação - SPED (Contábil)',
    documentType: 'contabil',
    systemPrompt: SPED_CLASSIFICATION_PROMPT,
    modelProvider: 'openai',
    modelName: 'gpt-4o-mini',
    isActive: true,
  })

  // Schema para SPED
  await createTemplateSchemaConfig({
    name: 'Schema - SPED ECD',
    documentType: 'contabil',
    fields: SPED_SCHEMA_FIELDS,
    isActive: true,
  })
}
```

---

## Estatísticas Finais

```
Total de Commits: 84
Arquivos Alterados: 285
Linhas Adicionadas: +592,041
Linhas Removidas: -10,338
Saldo Líquido: +581,703 linhas

Principais Categorias:
- Sistema de Notificações: ~3,500 linhas
- Processamento Assíncrono: ~1,200 linhas
- Schemas por Tipo: ~2,800 linhas
- Melhorias de UX: ~800 linhas
- Correções de Bugs: ~600 linhas
- Migrations: ~150 linhas
```

---

Para o diff completo, execute:
```bash
git diff 94e1757..HEAD
```

Para diff de um arquivo específico:
```bash
git diff 94e1757..HEAD -- path/to/file
```

