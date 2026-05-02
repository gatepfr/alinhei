'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload, FileCheck, ArrowRight } from 'lucide-react'

export function UploadForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [curriculo, setCurriculo] = useState('')
  const [vaga, setVaga] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    const formData = new FormData()
    formData.append('pdf', file)
    const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
    if (!res.ok) {
      setError('Não conseguimos ler o PDF. Tente colar o texto manualmente.')
      return
    }
    const { text } = await res.json() as { text: string }
    setCurriculo(text)
    setFileName(file.name)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!curriculo.trim()) {
      setError('Adicione o currículo (PDF ou texto).')
      return
    }
    if (!vaga.trim()) {
      setError('Cole a descrição da vaga.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculo, vaga }),
      })
      const json = await res.json() as { ok: boolean; analysisId?: string; error?: { message: string } }

      if (!json.ok || !json.analysisId) {
        setError(json.error?.message ?? 'Erro ao analisar. Tente novamente.')
        return
      }
      router.push(`/analise/${json.analysisId}`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Currículo */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Seu currículo</Label>
        <Tabs defaultValue="texto">
          <TabsList className="bg-secondary border border-border mb-3 h-9">
            <TabsTrigger value="texto" className="text-xs data-active:bg-primary data-active:text-primary-foreground">
              Colar texto
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-xs data-active:bg-primary data-active:text-primary-foreground">
              Subir PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="texto">
            <Textarea
              placeholder="Cole aqui o texto do seu currículo..."
              className="min-h-[180px] resize-y bg-secondary border-border focus-visible:ring-primary/40 placeholder:text-muted-foreground/50"
              value={curriculo}
              onChange={(e) => setCurriculo(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="pdf">
            <div
              className={[
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                fileName
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-primary/[0.03]',
              ].join(' ')}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file?.type === 'application/pdf') handleFile(file)
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              {fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <FileCheck className="w-8 h-8 text-primary" />
                  <p className="text-sm font-semibold text-primary">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {curriculo.length.toLocaleString('pt-BR')} caracteres extraídos
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Arraste o PDF aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground/60">Apenas PDF · máx. 5 MB</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vaga */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Descrição da vaga</Label>
        <Textarea
          placeholder="Cole aqui a descrição completa da vaga (título, requisitos, responsabilidades)..."
          className="min-h-[140px] resize-y bg-secondary border-border focus-visible:ring-primary/40 placeholder:text-muted-foreground/50"
          value={vaga}
          onChange={(e) => setVaga(e.target.value)}
        />
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Quanto mais detalhada a vaga, mais precisa a análise</p>
            {vaga.length > 5000 && (
              <p className="text-[10px] text-amber-500 font-medium leading-tight">
                Texto será cortado em 5.000 caracteres. A análise usará apenas os primeiros 5.000.
              </p>
            )}
          </div>
          <span className={`text-[10px] whitespace-nowrap mt-0.5 ${vaga.length > 4500 ? 'text-amber-500 font-medium' : 'text-muted-foreground/60'}`}>
            {vaga.length.toLocaleString('pt-BR')} / 5.000
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 group gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando... (~20 segundos)
          </>
        ) : (
          <>
            Analisar meu currículo grátis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  )
}
