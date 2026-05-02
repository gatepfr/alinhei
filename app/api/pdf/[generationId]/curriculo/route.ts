import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateCurriculoPDF } from '@/lib/pdf-generator'

export async function GET(_req: NextRequest, { params }: { params: { generationId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: generation } = await serviceClient
    .from('generations')
    .select('id, curriculo_otimizado')
    .eq('id', params.generationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!generation || !generation.curriculo_otimizado) {
    return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const pdfBuffer = await generateCurriculoPDF(generation.curriculo_otimizado as string)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="curriculo-ats.pdf"',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
