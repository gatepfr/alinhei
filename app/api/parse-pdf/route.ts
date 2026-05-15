import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPdf } from '@/lib/pdf-parser'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('pdf')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: { code: 'NO_FILE', message: 'Nenhum arquivo enviado.' } }, { status: 400 })
  }

  if (!file.type.includes('pdf')) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_TYPE', message: 'Apenas PDFs são aceitos.' } }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: { code: 'FILE_TOO_LARGE', message: 'PDF maior que 5 MB.' } }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromPdf(buffer)

    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: { code: 'EMPTY_PDF', message: 'Não conseguimos extrair texto do PDF. Tente colar o texto manualmente.' } },
        { status: 422 }
      )
    }

    return NextResponse.json({ ok: true, text })
  } catch (err) {
    console.error('[parse-pdf]', err)
    return NextResponse.json(
      { ok: false, error: { code: 'PARSE_ERROR', message: 'Erro ao ler o PDF. Tente colar o texto manualmente.' } },
      { status: 500 }
    )
  }
}
