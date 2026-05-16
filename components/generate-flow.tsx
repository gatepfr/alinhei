'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackEvent } from '@/lib/analytics'

interface ContactInfo {
  name: string
  email: string
  phone: string
  linkedin_url: string
  city: string
}

interface GenerateFlowProps {
  analysisId: string
  userEmail: string
}

type Stage = 'loading' | 'contact' | 'generating' | 'error'

export function GenerateFlow({ analysisId, userEmail }: GenerateFlowProps) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('loading')
  const [error, setError] = useState<string | null>(null)
  const [contact, setContact] = useState<ContactInfo>({ name: '', email: userEmail, phone: '', linkedin_url: '', city: '' })
  const generating = useRef(false)

  async function startGeneration(c: ContactInfo) {
    if (generating.current) return
    generating.current = true
    setStage('generating')
    trackEvent('generation_started')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          contact_info: {
            name: c.name || undefined,
            email: c.email || userEmail || undefined,
            phone: c.phone || undefined,
            linkedin_url: c.linkedin_url || undefined,
            city: c.city || undefined,
          },
        }),
      })
      const data = await res.json()

      if (!data.ok) {
        generating.current = false
        setError(data.error?.message ?? 'Erro ao gerar o pacote.')
        setStage('error')
        return
      }

      trackEvent('generation_completed')
      router.refresh()
    } catch {
      generating.current = false
      setError('Erro de conexão. Tente novamente.')
      setStage('error')
    }
  }

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          const p = data.profile
          const c: ContactInfo = {
            name: p.full_name ?? '',
            email: userEmail,
            phone: p.phone ?? '',
            linkedin_url: p.linkedin_url ?? '',
            city: p.city ?? '',
          }
          setContact(c)
          if (p.full_name && p.phone) {
            startGeneration(c)
          } else {
            setStage('contact')
          }
        } else {
          setStage('contact')
        }
      })
      .catch(() => setStage('contact'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    }).catch(() => {})
    startGeneration(contact)
  }

  if (stage === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    )
  }

  if (stage === 'contact') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Seus dados de contato</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Esses dados vão para o cabeçalho do seu currículo otimizado. Informe pelo menos nome e telefone.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="gen-name" className="text-xs mb-1.5 block">Nome completo *</Label>
              <Input
                id="gen-name"
                placeholder="João da Silva"
                value={contact.name}
                onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="gen-phone" className="text-xs mb-1.5 block">Telefone *</Label>
              <Input
                id="gen-phone"
                placeholder="(11) 99999-9999"
                value={contact.phone}
                onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="gen-city" className="text-xs mb-1.5 block">Cidade</Label>
              <Input
                id="gen-city"
                placeholder="São Paulo, SP"
                value={contact.city}
                onChange={e => setContact(c => ({ ...c, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="gen-linkedin" className="text-xs mb-1.5 block">LinkedIn URL</Label>
              <Input
                id="gen-linkedin"
                placeholder="linkedin.com/in/joaosilva"
                value={contact.linkedin_url}
                onChange={e => setContact(c => ({ ...c, linkedin_url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="gen-email" className="text-xs mb-1.5 block">E-mail</Label>
              <Input
                id="gen-email"
                type="email"
                placeholder="seu@email.com"
                value={contact.email}
                onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full mt-2">
              Gerar pacote completo →
            </Button>
          </form>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-destructive font-medium mb-4 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {error}
        </p>
        <Button
          variant="outline"
          className="border-border bg-secondary hover:bg-secondary/80"
          onClick={() => router.push(`/analise/${analysisId}`)}
        >
          Voltar para análise
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
      <h2 className="font-display text-xl font-bold mb-3">Gerando seu pacote completo…</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Estamos reescrevendo seu currículo, criando as cartas e preparando o simulado de entrevista.
        Isso leva cerca de 30 segundos.
      </p>
    </div>
  )
}
