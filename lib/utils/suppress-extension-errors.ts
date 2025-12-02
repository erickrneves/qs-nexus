/**
 * Suprime erros causados por extensões de browser (MetaMask, etc)
 * que não devem aparecer no console da aplicação
 */
export function suppressExtensionErrors() {
  if (typeof window === 'undefined') return

  const originalError = console.error
  const originalWarn = console.warn

  // Lista de padrões de erros a serem suprimidos
  const suppressPatterns = [
    'MetaMask',
    'metamask',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'safari-web-extension://',
    'Extension context invalidated',
    'Receiving end does not exist',
    'Could not establish connection',
    'message port closed',
    'Failed to connect to MetaMask',
    'Object.connect',
    'inpage.js',
  ]

  const shouldSuppress = (args: any[]) => {
    const errorString = args.join(' ').toLowerCase()
    return suppressPatterns.some(pattern => 
      errorString.includes(pattern.toLowerCase())
    )
  }

  console.error = (...args: any[]) => {
    if (!shouldSuppress(args)) {
      originalError(...args)
    }
  }

  console.warn = (...args: any[]) => {
    if (!shouldSuppress(args)) {
      originalWarn(...args)
    }
  }

  // Capturar erros não tratados do window
  window.addEventListener('error', (event) => {
    const errorString = event.message?.toLowerCase() || ''
    if (suppressPatterns.some(pattern => errorString.includes(pattern.toLowerCase()))) {
      event.preventDefault()
      event.stopPropagation()
    }
  })

  // Capturar promise rejections de extensões
  window.addEventListener('unhandledrejection', (event) => {
    const errorString = String(event.reason).toLowerCase()
    if (suppressPatterns.some(pattern => errorString.includes(pattern.toLowerCase()))) {
      event.preventDefault()
    }
  })
}

