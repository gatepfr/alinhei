import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateDiagnosticoPDF } from '@/lib/pdf-generator'
import { DiagnosticoSchema } from '@/lib/schemas'

export async function GET(_req: NextRequest, { params }: { params: { generationId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: generation } = await serviceClient
    .from('generations')
    .select('id, analyses(diagnostic)')
    .eq('id', params.generationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!generation) {
    return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const analysesRaw = generation.analyses as unknown
  const analysesData = Array.isArray(analysesRaw) ? analysesRaw[0] : analysesRaw
  const diagnosticoResult = DiagnosticoSchema.safeParse(
    (analysesData as { diagnostic?: unknown } | null)?.diagnostic
  )
  if (!diagnosticoResult.success) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_DATA' } }, { status: 500 })
  }

  const pdfBuffer = await generateDiagnosticoPDF(diagnosticoResult.data)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="diagnostico-alinhei.pdf"',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
