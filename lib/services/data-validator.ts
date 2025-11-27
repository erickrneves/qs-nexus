import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { MetadataSchema } from '@/lib/db/schema/metadata-schemas'

/**
 * Data Validator
 * Validações contábeis, de schema e relatório de qualidade
 */

export interface ValidationError {
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
  field?: string
  details?: any
}

export interface ValidationReport {
  valid: boolean
  score: number // 0-100
  errors: ValidationError[]
  warnings: ValidationError[]
  info: ValidationError[]
  summary: {
    totalChecks: number
    passed: number
    failed: number
    warnings: number
  }
  timestamp: string
}

/**
 * Classe principal de validação
 */
export class DataValidator {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Valida dados SPED contra regras contábeis
   */
  async validateSpedData(spedFileId: string): Promise<ValidationReport> {
    const report: ValidationReport = {
      valid: true,
      score: 100,
      errors: [],
      warnings: [],
      info: [],
      summary: { totalChecks: 0, passed: 0, failed: 0, warnings: 0 },
      timestamp: new Date().toISOString(),
    }

    // 1. Validação: Débito = Crédito em lançamentos
    await this.validateBalanceCheck(spedFileId, report)

    // 2. Validação: Hierarquia de contas
    await this.validateAccountHierarchy(spedFileId, report)

    // 3. Validação: Integridade referencial
    await this.validateReferentialIntegrity(spedFileId, report)

    // 4. Validação: Saldos consistentes
    await this.validateBalanceConsistency(spedFileId, report)

    // Calcular score
    const totalIssues = report.errors.length + report.warnings.length
    report.score = Math.max(0, 100 - totalIssues * 5)
    report.valid = report.errors.length === 0

    return report
  }

  /**
   * Valida débito = crédito
   */
  private async validateBalanceCheck(
    spedFileId: string,
    report: ValidationReport
  ): Promise<void> {
    report.summary.totalChecks++

    const unbalanced = await db.execute(sql`
      SELECT 
        je.entry_number,
        je.entry_date,
        SUM(CASE WHEN ji.debit_credit = 'D' THEN ji.amount ELSE 0 END) as total_debit,
        SUM(CASE WHEN ji.debit_credit = 'C' THEN ji.amount ELSE 0 END) as total_credit,
        ABS(
          SUM(CASE WHEN ji.debit_credit = 'D' THEN ji.amount ELSE 0 END) - 
          SUM(CASE WHEN ji.debit_credit = 'C' THEN ji.amount ELSE 0 END)
        ) as difference
      FROM journal_entries je
      JOIN journal_items ji ON je.id = ji.journal_entry_id
      WHERE je.sped_file_id = ${spedFileId}
        AND je.organization_id = ${this.organizationId}
      GROUP BY je.id, je.entry_number, je.entry_date
      HAVING ABS(
        SUM(CASE WHEN ji.debit_credit = 'D' THEN ji.amount ELSE 0 END) - 
        SUM(CASE WHEN ji.debit_credit = 'C' THEN ji.amount ELSE 0 END)
      ) > 0.01
      LIMIT 100
    `)

    if (unbalanced.rows.length > 0) {
      report.summary.failed++
      report.errors.push({
        code: 'UNBALANCED_ENTRIES',
        message: `${unbalanced.rows.length} lançamentos com débito ≠ crédito`,
        severity: 'error',
        details: unbalanced.rows.slice(0, 10),
      })
    } else {
      report.summary.passed++
    }
  }

  /**
   * Valida hierarquia de contas
   */
  private async validateAccountHierarchy(
    spedFileId: string,
    report: ValidationReport
  ): Promise<void> {
    report.summary.totalChecks++

    // Contas sintéticas sem filhas
    const orphanSynthetic = await db.execute(sql`
      SELECT ca.account_code, ca.account_name
      FROM chart_of_accounts ca
      WHERE ca.sped_file_id = ${spedFileId}
        AND ca.organization_id = ${this.organizationId}
        AND ca.account_type = 'S'
        AND NOT EXISTS (
          SELECT 1 FROM chart_of_accounts child
          WHERE child.sped_file_id = ca.sped_file_id
            AND child.parent_account_code = ca.account_code
        )
      LIMIT 50
    `)

    if (orphanSynthetic.rows.length > 0) {
      report.summary.warnings++
      report.warnings.push({
        code: 'SYNTHETIC_WITHOUT_CHILDREN',
        message: `${orphanSynthetic.rows.length} contas sintéticas sem contas filhas`,
        severity: 'warning',
        details: orphanSynthetic.rows.slice(0, 10),
      })
    } else {
      report.summary.passed++
    }
  }

  /**
   * Valida integridade referencial
   */
  private async validateReferentialIntegrity(
    spedFileId: string,
    report: ValidationReport
  ): Promise<void> {
    report.summary.totalChecks++

    // Partidas com códigos de conta não existentes no plano
    const invalidAccountCodes = await db.execute(sql`
      SELECT DISTINCT ji.account_code
      FROM journal_items ji
      WHERE ji.organization_id = ${this.organizationId}
        AND NOT EXISTS (
          SELECT 1 FROM chart_of_accounts ca
          WHERE ca.account_code = ji.account_code
            AND ca.sped_file_id = ${spedFileId}
        )
      LIMIT 50
    `)

    if (invalidAccountCodes.rows.length > 0) {
      report.summary.failed++
      report.errors.push({
        code: 'INVALID_ACCOUNT_CODES',
        message: `${invalidAccountCodes.rows.length} códigos de conta não existem no plano`,
        severity: 'error',
        details: invalidAccountCodes.rows,
      })
    } else {
      report.summary.passed++
    }
  }

  /**
   * Valida consistência de saldos
   */
  private async validateBalanceConsistency(
    spedFileId: string,
    report: ValidationReport
  ): Promise<void> {
    report.summary.totalChecks++

    // Verifica se saldo final = saldo inicial + débitos - créditos
    const inconsistentBalances = await db.execute(sql`
      SELECT 
        account_code,
        period_date,
        initial_balance,
        debit_total,
        credit_total,
        final_balance,
        (initial_balance + debit_total - credit_total) as calculated_final
      FROM account_balances
      WHERE sped_file_id = ${spedFileId}
        AND organization_id = ${this.organizationId}
        AND ABS(final_balance - (initial_balance + debit_total - credit_total)) > 0.01
      LIMIT 50
    `)

    if (inconsistentBalances.rows.length > 0) {
      report.summary.failed++
      report.errors.push({
        code: 'INCONSISTENT_BALANCES',
        message: `${inconsistentBalances.rows.length} saldos com inconsistências`,
        severity: 'error',
        details: inconsistentBalances.rows.slice(0, 10),
      })
    } else {
      report.summary.passed++
    }
  }

  /**
   * Valida dados contra schema de metadados
   */
  validateAgainstSchema(data: Record<string, any>, schema: MetadataSchema): ValidationReport {
    const report: ValidationReport = {
      valid: true,
      score: 100,
      errors: [],
      warnings: [],
      info: [],
      summary: { totalChecks: 0, passed: 0, failed: 0, warnings: 0 },
      timestamp: new Date().toISOString(),
    }

    const allFields = [
      ...(schema.baseSchema as any).fields,
      ...((schema.customFields as any)?.fields || []),
    ]

    for (const field of allFields) {
      report.summary.totalChecks++

      const value = data[field.name]

      // Validação de obrigatoriedade
      if (field.required && (value === undefined || value === null || value === '')) {
        report.errors.push({
          code: 'REQUIRED_FIELD_MISSING',
          message: `Campo obrigatório "${field.label}" não informado`,
          severity: 'error',
          field: field.name,
        })
        report.summary.failed++
        continue
      }

      // Se não tem valor e não é obrigatório, pula validações
      if (value === undefined || value === null || value === '') {
        report.summary.passed++
        continue
      }

      // Validação de tipo
      const typeValid = this.validateFieldType(value, field.type)
      if (!typeValid) {
        report.errors.push({
          code: 'INVALID_FIELD_TYPE',
          message: `Campo "${field.label}" deve ser do tipo ${field.type}`,
          severity: 'error',
          field: field.name,
        })
        report.summary.failed++
        continue
      }

      // Validações específicas
      if (field.validation) {
        const validationErrors = this.validateFieldRules(value, field)
        report.errors.push(...validationErrors)
        
        if (validationErrors.length > 0) {
          report.summary.failed++
        } else {
          report.summary.passed++
        }
      } else {
        report.summary.passed++
      }
    }

    // Validações globais (required_together, etc)
    if (schema.validationRules) {
      this.validateGlobalRules(data, schema.validationRules as any, report)
    }

    // Calcular score
    const totalIssues = report.errors.length + report.warnings.length * 0.5
    report.score = Math.max(0, 100 - totalIssues * 5)
    report.valid = report.errors.length === 0

    return report
  }

  /**
   * Valida tipo do campo
   */
  private validateFieldType(value: any, type: string): boolean {
    switch (type) {
      case 'text':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'date':
        return !isNaN(Date.parse(value))
      case 'boolean':
        return typeof value === 'boolean'
      case 'select':
      case 'multiselect':
        return true // Validado nas regras
      case 'json':
        return typeof value === 'object'
      default:
        return true
    }
  }

  /**
   * Valida regras específicas do campo
   */
  private validateFieldRules(value: any, field: any): ValidationError[] {
    const errors: ValidationError[] = []
    const validation = field.validation

    if (!validation) return errors

    // Min/Max para números
    if (field.type === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push({
          code: 'VALUE_TOO_LOW',
          message: `${field.label} deve ser no mínimo ${validation.min}`,
          severity: 'error',
          field: field.name,
        })
      }
      if (validation.max !== undefined && value > validation.max) {
        errors.push({
          code: 'VALUE_TOO_HIGH',
          message: `${field.label} deve ser no máximo ${validation.max}`,
          severity: 'error',
          field: field.name,
        })
      }
    }

    // Min/Max length para strings
    if (field.type === 'text') {
      if (validation.minLength && value.length < validation.minLength) {
        errors.push({
          code: 'STRING_TOO_SHORT',
          message: `${field.label} deve ter no mínimo ${validation.minLength} caracteres`,
          severity: 'error',
          field: field.name,
        })
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push({
          code: 'STRING_TOO_LONG',
          message: `${field.label} deve ter no máximo ${validation.maxLength} caracteres`,
          severity: 'error',
          field: field.name,
        })
      }

      // Pattern (regex)
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        errors.push({
          code: 'PATTERN_MISMATCH',
          message: `${field.label} não corresponde ao formato esperado`,
          severity: 'error',
          field: field.name,
        })
      }
    }

    return errors
  }

  /**
   * Valida regras globais (required_together, etc)
   */
  private validateGlobalRules(
    data: Record<string, any>,
    validationRules: any,
    report: ValidationReport
  ): void {
    if (!validationRules.rules) return

    for (const rule of validationRules.rules) {
      report.summary.totalChecks++

      switch (rule.type) {
        case 'required_together': {
          // Todos os campos devem estar presentes juntos
          const hasAny = rule.fields.some((f: string) => data[f])
          const hasAll = rule.fields.every((f: string) => data[f])

          if (hasAny && !hasAll) {
            report.errors.push({
              code: 'REQUIRED_TOGETHER',
              message: rule.message || `Campos ${rule.fields.join(', ')} devem ser informados juntos`,
              severity: 'error',
            })
            report.summary.failed++
          } else {
            report.summary.passed++
          }
          break
        }

        case 'mutually_exclusive': {
          // Apenas um dos campos pode estar presente
          const presentFields = rule.fields.filter((f: string) => data[f])

          if (presentFields.length > 1) {
            report.errors.push({
              code: 'MUTUALLY_EXCLUSIVE',
              message:
                rule.message || `Apenas um destes campos pode ser informado: ${rule.fields.join(', ')}`,
              severity: 'error',
            })
            report.summary.failed++
          } else {
            report.summary.passed++
          }
          break
        }

        default:
          report.summary.passed++
      }
    }
  }

  /**
   * Gera relatório de qualidade dos dados
   */
  async generateQualityReport(spedFileId: string): Promise<{
    overallScore: number
    dataCompleteness: number
    dataAccuracy: number
    dataConsistency: number
    recommendations: string[]
  }> {
    const validation = await this.validateSpedData(spedFileId)

    // Métricas de qualidade
    const stats = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM chart_of_accounts WHERE sped_file_id = ${spedFileId}) as total_accounts,
        (SELECT COUNT(*) FROM chart_of_accounts WHERE sped_file_id = ${spedFileId} AND account_name IS NOT NULL AND account_name != '') as named_accounts,
        (SELECT COUNT(*) FROM account_balances WHERE sped_file_id = ${spedFileId}) as total_balances,
        (SELECT COUNT(*) FROM journal_entries WHERE sped_file_id = ${spedFileId}) as total_entries,
        (SELECT COUNT(*) FROM journal_items WHERE organization_id = ${this.organizationId}) as total_items
    `)

    const data = stats.rows[0]
    
    const dataCompleteness =
      data.total_accounts > 0 ? (data.named_accounts / data.total_accounts) * 100 : 0
    const dataAccuracy = validation.score
    const dataConsistency = validation.errors.length === 0 ? 100 : 100 - validation.errors.length * 10

    const overallScore = (dataCompleteness + dataAccuracy + dataConsistency) / 3

    // Recomendações
    const recommendations: string[] = []

    if (dataCompleteness < 80) {
      recommendations.push('Completar nomes de contas no plano de contas')
    }
    if (validation.errors.length > 0) {
      recommendations.push('Corrigir erros de validação contábil')
    }
    if (data.total_balances === 0) {
      recommendations.push('Adicionar saldos periódicos para análise temporal')
    }

    return {
      overallScore: Math.round(overallScore),
      dataCompleteness: Math.round(dataCompleteness),
      dataAccuracy: Math.round(dataAccuracy),
      dataConsistency: Math.round(dataConsistency),
      recommendations,
    }
  }
}

/**
 * Factory function
 */
export function createDataValidator(organizationId: string): DataValidator {
  return new DataValidator(organizationId)
}

