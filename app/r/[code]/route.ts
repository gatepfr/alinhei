import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const supabase = createServiceClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('referral_code', code)
    .single();

  if (error || !profile) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  
  // Set cookie vc_ref for 30 days
  response.cookies.set('vc_ref', profile.user_id, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}
