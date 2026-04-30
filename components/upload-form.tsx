'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Currículo */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Seu currículo</Label>
        <Tabs defaultValue="texto">
          <TabsList className="mb-2">
            <TabsTrigger value="texto">Colar texto</TabsTrigger>
            <TabsTrigger value="pdf">Subir PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="texto">
            <Textarea
              placeholder="Cole aqui o texto do seu currículo..."
              className="min-h-[180px] resize-y"
              value={curriculo}
              onChange={(e) => setCurriculo(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="pdf">
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
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
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              {fileName ? (
                <p className="text-sm font-medium text-green-600">{fileName} carregado ✓</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Arraste o PDF aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Apenas PDF, máx. 5 MB</p>
                </>
              )}
            </div>
            {curriculo && fileName && (
              <p className="text-xs text-muted-foreground mt-2">
                {curriculo.length.toLocaleString('pt-BR')} caracteres extraídos
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Vaga */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Descrição da vaga</Label>
        <Textarea
          placeholder="Cole aqui a descrição completa da vaga (título, requisitos, responsabilidades)..."
          className="min-h-[140px] resize-y"
          value={vaga}
          onChange={(e) => setVaga(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Quanto mais detalhada a vaga, mais precisa a análise</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando... (~20 segundos)
          </>
        ) : (
          'Analisar meu currículo grátis →'
        )}
      </Button>
    </form>
  )
}
