'use client'

import { useEffect } from 'react'

export function ErrorSuppression() {
  useEffect(() => {
    // Suprimir erros de extensões de browser
    if (typeof window === 'undefined') return

    const originalError = console.error
    const originalWarn = console.warn

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
    const errorHandler = (event: ErrorEvent) => {
      const errorString = event.message?.toLowerCase() || ''
      if (suppressPatterns.some(pattern => errorString.includes(pattern.toLowerCase()))) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    // Capturar promise rejections de extensões
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const errorString = String(event.reason).toLowerCase()
      if (suppressPatterns.some(pattern => errorString.includes(pattern.toLowerCase()))) {
        event.preventDefault()
      }
    }

    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', rejectionHandler)

    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  return null
}

