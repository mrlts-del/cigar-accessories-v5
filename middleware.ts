import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log('pathname:', pathname);
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('token:', JSON.stringify(token, null, 2));
  
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/signin') {
      return NextResponse.next(); // Allow access to signin page
    }
    if (!token) {
      console.log('No token found, redirecting to signin');
      return NextResponse.redirect(new URL('/admin/signin', req.url));
    }
    if (token.role !== 'ADMIN' && token.email !== process.env.ADMIN_EMAIL) {
      console.log('Not admin, redirecting to signin');
      return NextResponse.redirect(new URL('/admin/signin', req.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/signin') {
      return NextResponse.next(); // Allow access to signin page
    }
    if (!token) {
      return NextResponse.redirect(new URL('/admin/signin', req.url));
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/signin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'], // Apply middleware to admin routes
};