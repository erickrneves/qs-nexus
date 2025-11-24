'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Erro crítico</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro crítico na aplicação. Por favor, recarregue a página.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-mono text-destructive break-all">{error.message}</p>
                  {error.digest && (
                    <p className="text-xs text-muted-foreground mt-2">Digest: {error.digest}</p>
                  )}
                </div>
              )}
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Recarregar página
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}

