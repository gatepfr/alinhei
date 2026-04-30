import { createServiceClient } from './supabase/server'

export async function debitCredit(userId: string, generationId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.rpc('debit_credit', {
    p_user_id: userId,
    p_reference_id: generationId,
  })
  return data as string | null
}

export async function grantCredits(
  userId: string,
  amount: number,
  source: string,
  referenceId: string,
  expiresAt: Date | null
): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('credits').insert({
    user_id: userId,
    amount,
    source,
    reference_id: referenceId,
    expires_at: expiresAt?.toISOString() ?? null,
  })
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = createServiceClient()
  const { data } = await supabase.rpc('user_credit_balance', { p_user_id: userId })
  return (data as number) ?? 0
}
