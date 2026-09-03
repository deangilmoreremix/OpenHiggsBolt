import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

export async function GET(request: Request) {
  if (isProduction) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const response = NextResponse.redirect(new URL('/studio', request.url));
  response.cookies.set('__e2e_auth_bypass', '1', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
