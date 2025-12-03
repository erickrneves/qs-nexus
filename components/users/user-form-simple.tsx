'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

const ALL_GLOBAL_ROLES = ['super_admin', 'admin_fiscal', 'user_fiscal', 'consultor_ia', 'viewer']
const ALL_ORG_ROLES = ['admin_fiscal', 'user_fiscal', 'consultor_ia', 'viewer']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  organizations: Array<{ id: string; name: string }>
  user?: any
}

export function UserFormSimple({ open, onOpenChange, onSuccess, organizations, user }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [globalRole, setGlobalRole] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [orgRole, setOrgRole] = useState('user_fiscal')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!user

  // Preencher form quando editar
  React.useEffect(() => {
    if (open) {
      if (user) {
        setName(user.name || '')
        setEmail(user.email || '')
        setGlobalRole(user.globalRole || '')
        setOrganizationId(user.organizations?.[0]?.id || '')
        setOrgRole(user.organizations?.[0]?.role || 'user_fiscal')
        setPassword('')
      } else {
        setName('')
        setEmail('')
        setPassword('')
        setGlobalRole('')
        setOrganizationId('')
        setOrgRole('user_fiscal')
      }
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const method = isEditing ? 'PATCH' : 'POST'
      const url = isEditing ? `/api/users/${user.id}` : '/api/users'

      const payload: any = {
        name,
        isActive: true,
      }

      if (isEditing) {
        // EDIÇÃO: só name e globalRole
        if (globalRole) {
          payload.globalRole = globalRole
        }
      } else {
        // CRIAÇÃO: todos os campos
        payload.email = email
        payload.password = password
        payload.organizationId = organizationId
        payload.orgRole = orgRole
        
        if (globalRole) {
          payload.globalRole = globalRole
        }
      }

      console.log('📤 ENVIANDO:', method, url, JSON.stringify(payload, null, 2))

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(isEditing ? 'Usuário atualizado!' : 'Usuário criado!')
        setName('')
        setEmail('')
        setPassword('')
        setGlobalRole('')
        setOrganizationId('')
        setOrgRole('user_fiscal')
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro')
      }
    } catch (error) {
      toast.error(isEditing ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {!isEditing && (
            <>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div>
                <Label>Senha *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div>
                <Label>Organização *</Label>
                <Select value={organizationId} onValueChange={setOrganizationId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Role na Organização *</Label>
                <Select value={orgRole} onValueChange={setOrgRole} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ORG_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {isEditing && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Email e organização não podem ser alterados aqui
              </p>
            </div>
          )}

          <div>
            <Label>Role Global (OPCIONAL - deixe vazio para viewer)</Label>
            <Select value={globalRole} onValueChange={setGlobalRole}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum (viewer)" />
              </SelectTrigger>
              <SelectContent>
                {ALL_GLOBAL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-green-600 mt-1">
              ✅ SUPER ADMIN ESTÁ DISPONÍVEL!
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Atualizando...' : 'Criando...') : (isEditing ? 'Atualizar' : 'Criar Usuário')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

