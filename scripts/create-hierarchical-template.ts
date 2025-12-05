import { db } from '../lib/db'
import { normalizationTemplates } from '../lib/db/schema/normalization-templates'

async function createTemplate() {
  try {
    console.log('🔧 Criando template hierárquico para leis...\n')
    
    const [template] = await db
      .insert(normalizationTemplates)
      .values({
        organizationId: '64931067-22e4-4137-896e-01ce7748940f',
        name: 'Lei Federal - Estrutura Hierárquica Completa',
        description: 'Template otimizado para extração completa de leis com artigos, parágrafos, incisos e alíneas',
        baseType: 'document',
        category: 'juridico',
        tableName: 'leis_federais_hierarquicas',
        fields: [
          {
            fieldName: 'numero_lei',
            displayName: 'Número da Lei',
            fieldType: 'text',
            isRequired: true,
            description: 'Número da lei (ex: Lei 10.833)',
          },
          {
            fieldName: 'data_sancao',
            displayName: 'Data de Sanção',
            fieldType: 'date',
            isRequired: false,
            description: 'Data em que a lei foi sancionada',
          },
          {
            fieldName: 'origem',
            displayName: 'Origem',
            fieldType: 'text',
            isRequired: false,
            description: 'Origem da lei (MP, PL, etc)',
          },
          {
            fieldName: 'artigos',
            displayName: 'Artigos da Lei',
            fieldType: 'object_array',
            isRequired: true,
            description: 'TODOS os artigos da lei com estrutura hierárquica completa',
            arrayItemName: 'artigo',
            hierarchyLevel: 1,
            enableRelationalStorage: true,
            nestedSchema: [
              {
                fieldName: 'numero',
                displayName: 'Número do Artigo',
                fieldType: 'numeric',
                isRequired: true,
                description: 'Número do artigo',
              },
              {
                fieldName: 'caput',
                displayName: 'Caput',
                fieldType: 'text',
                isRequired: true,
                description: 'Texto principal do artigo (caput)',
              },
              {
                fieldName: 'paragrafos',
                displayName: 'Parágrafos',
                fieldType: 'object_array',
                isRequired: false,
                description: 'Parágrafos do artigo',
                arrayItemName: 'paragrafo',
                hierarchyLevel: 2,
                nestedSchema: [
                  {
                    fieldName: 'numero',
                    displayName: 'Número do Parágrafo',
                    fieldType: 'text',
                    isRequired: true,
                    description: 'Número do parágrafo (1, 2, único, etc)',
                  },
                  {
                    fieldName: 'texto',
                    displayName: 'Texto',
                    fieldType: 'text',
                    isRequired: true,
                    description: 'Texto do parágrafo',
                  },
                  {
                    fieldName: 'incisos',
                    displayName: 'Incisos',
                    fieldType: 'object_array',
                    isRequired: false,
                    description: 'Incisos do parágrafo',
                    arrayItemName: 'inciso',
                    hierarchyLevel: 3,
                    nestedSchema: [
                      {
                        fieldName: 'numero',
                        displayName: 'Número do Inciso',
                        fieldType: 'text',
                        isRequired: true,
                        description: 'Número romano do inciso (I, II, III, etc)',
                      },
                      {
                        fieldName: 'texto',
                        displayName: 'Texto',
                        fieldType: 'text',
                        isRequired: true,
                        description: 'Texto do inciso',
                      },
                      {
                        fieldName: 'alineas',
                        displayName: 'Alíneas',
                        fieldType: 'object_array',
                        isRequired: false,
                        description: 'Alíneas do inciso',
                        arrayItemName: 'alinea',
                        hierarchyLevel: 4,
                        nestedSchema: [
                          {
                            fieldName: 'letra',
                            displayName: 'Letra',
                            fieldType: 'text',
                            isRequired: true,
                            description: 'Letra da alínea (a, b, c, etc)',
                          },
                          {
                            fieldName: 'texto',
                            displayName: 'Texto',
                            fieldType: 'text',
                            isRequired: true,
                            description: 'Texto da alínea',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        isActive: true,
        createdByMethod: 'manual',
      })
      .returning()
    
    console.log('✅ Template criado com sucesso!')
    console.log('   ID:', template.id)
    console.log('   Nome:', template.name)
    console.log('\n📋 Estrutura hierárquica:')
    console.log('   artigos (object_array)')
    console.log('   └─ numero, caput')
    console.log('   └─ paragrafos (object_array)')
    console.log('      └─ numero, texto')
    console.log('      └─ incisos (object_array)')
    console.log('         └─ numero, texto')
    console.log('         └─ alineas (object_array)')
    console.log('            └─ letra, texto')
    
    console.log('\n🎯 Próximo passo:')
    console.log('   1. Faça upload de L10833.pdf novamente')
    console.log('   2. Escolha este template:', template.name)
    console.log('   3. Clique "Extrair Dados"')
    console.log('   4. Sistema vai extrair TODOS os 82 artigos!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

createTemplate()
