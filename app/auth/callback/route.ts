import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url); const code = requestUrl.searchParams.get('code');
  if (code) {
    const response = NextResponse.redirect(new URL('/', request.url));
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.redirect(new URL('/login?error=configuration', request.url));
    const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options)) } });
    await supabase.auth.exchangeCodeForSession(code); return response;
  }
  return NextResponse.redirect(new URL('/login', request.url));
}
