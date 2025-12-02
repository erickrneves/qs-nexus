import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'

async function seedOrganizations() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  console.log('🏢 Criando organizações de teste...\n')

  try {
    // Verificar se já existem organizações
    const existing = await sql`SELECT COUNT(*) FROM organizations`
    
    if (parseInt(existing[0].count) > 0) {
      console.log('✓ Organizações já existem no banco!')
      console.log(`📊 Total: ${existing[0].count} organizações\n`)
      await sql.end()
      return
    }

    // Criar organizações de exemplo
    const orgs = [
      {
        name: 'ADKL ZELLER ELETRO SISTEMAS LTDA',
        cnpj: '01598794000108',
        slug: 'adkl-zeller',
      },
      {
        name: 'Empresa Demo Comercial',
        cnpj: '12345678000199',
        slug: 'demo-comercial',
      },
      {
        name: 'Tech Solutions Brasil',
        cnpj: '98765432000188',
        slug: 'tech-solutions',
      },
    ]

    for (const org of orgs) {
      await sql`
        INSERT INTO organizations (name, cnpj, slug, is_active)
        VALUES (${org.name}, ${org.cnpj}, ${org.slug}, true)
      `
      console.log(`✓ Criada: ${org.name}`)
    }

    console.log('\n✅ Organizações criadas com sucesso!')
    console.log('\n📋 Organizações disponíveis:')
    orgs.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.name}`)
      console.log(`      CNPJ: ${org.cnpj}`)
      console.log(`      Slug: ${org.slug}\n`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

seedOrganizations()

