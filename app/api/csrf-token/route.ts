// app/api/csrf-token/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET() {
  const csrfToken = crypto.randomBytes(32).toString('hex');

  const response = NextResponse.json({ csrfToken });
  const cookieStore = await cookies();
  cookieStore.set('csrfToken', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}