import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

function adminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 403 })
  }

  const { id } = params
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID não fornecido.' }, { status: 400 })
  }

  try {
    const authAdmin = adminClient()
    const { error } = await authAdmin.auth.admin.deleteUser(id)
    
    if (error) {
      console.error('[admin/delete-user] Supabase Error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/delete-user] Unexpected Error:', err)
    return NextResponse.json({ ok: false, error: 'Erro ao excluir usuário.' }, { status: 500 })
  }
}
