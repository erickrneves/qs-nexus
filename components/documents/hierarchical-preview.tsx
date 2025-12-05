'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ChevronRight, Hash } from 'lucide-react'

interface Article {
  numero: number
  caput: string
  paragrafos?: Paragraph[]
}

interface Paragraph {
  numero: string | number
  texto: string
  incisos?: Inciso[]
}

interface Inciso {
  numero: string
  texto: string
  alineas?: Alinea[]
}

interface Alinea {
  letra: string
  texto: string
}

interface Props {
  articles: Article[]
  showStats?: boolean
}

export function HierarchicalPreview({ articles, showStats = true }: Props) {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())

  const stats = {
    totalArticles: articles.length,
    totalParagraphs: articles.reduce((sum, art) => sum + (art.paragrafos?.length || 0), 0),
    totalIncisos: articles.reduce(
      (sum, art) => 
        sum + (art.paragrafos?.reduce((s, p) => s + (p.incisos?.length || 0), 0) || 0),
      0
    ),
    totalAlineas: articles.reduce(
      (sum, art) =>
        sum + (art.paragrafos?.reduce(
          (s, p) => s + (p.incisos?.reduce((si, i) => si + (i.alineas?.length || 0), 0) || 0),
          0
        ) || 0),
      0
    ),
  }

  return (
    <div className="space-y-4">
      {showStats && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalArticles}</div>
                <div className="text-sm text-muted-foreground">Artigos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalParagraphs}</div>
                <div className="text-sm text-muted-foreground">Parágrafos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalIncisos}</div>
                <div className="text-sm text-muted-foreground">Incisos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalAlineas}</div>
                <div className="text-sm text-muted-foreground">Alíneas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" className="space-y-2">
        {articles.map((article, idx) => (
          <AccordionItem
            key={`article-${idx}`}
            value={`article-${idx}`}
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-start gap-3 text-left w-full">
                <FileText className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono">
                      Art. {article.numero}º
                    </Badge>
                    {article.paragrafos && article.paragrafos.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {article.paragrafos.length} §
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.caput?.substring(0, 150)}
                    {article.caput?.length > 150 && '...'}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent>
              <div className="pl-8 pt-3 space-y-4">
                {/* Caput completo */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    CAPUT
                  </div>
                  <p className="text-sm leading-relaxed">{article.caput}</p>
                </div>

                {/* Parágrafos */}
                {article.paragrafos && article.paragrafos.length > 0 && (
                  <div className="space-y-3">
                    {article.paragrafos.map((paragrafo, pIdx) => (
                      <div
                        key={`p-${pIdx}`}
                        className="border-l-2 border-primary/30 pl-4"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <Badge variant="secondary" size="sm" className="font-mono">
                            {paragrafo.numero === 'único' ? '§ único' : `§ ${paragrafo.numero}º`}
                          </Badge>
                          {paragrafo.incisos && paragrafo.incisos.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {paragrafo.incisos.length} incisos
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed mb-2">{paragrafo.texto}</p>

                        {/* Incisos */}
                        {paragrafo.incisos && paragrafo.incisos.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {paragrafo.incisos.map((inciso, iIdx) => (
                              <div
                                key={`i-${iIdx}`}
                                className="border-l-2 border-muted pl-3"
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  <Badge variant="outline" size="sm" className="font-mono">
                                    {inciso.numero}
                                  </Badge>
                                  {inciso.alineas && inciso.alineas.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {inciso.alineas.length} alíneas
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm leading-relaxed mb-2">{inciso.texto}</p>

                                {/* Alíneas */}
                                {inciso.alineas && inciso.alineas.length > 0 && (
                                  <div className="space-y-1.5 mt-2">
                                    {inciso.alineas.map((alinea, aIdx) => (
                                      <div
                                        key={`a-${aIdx}`}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <Badge variant="outline" size="sm" className="font-mono">
                                          {alinea.letra})
                                        </Badge>
                                        <p className="leading-relaxed flex-1">{alinea.texto}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {articles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum artigo extraído</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

