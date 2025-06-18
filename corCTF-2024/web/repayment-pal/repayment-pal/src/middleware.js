import { NextResponse } from 'next/server';

export function middleware(req, res) {
  const headers = new Headers(req.headers);

  const cspHeader = `
    script-src 'self' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css2;
    object-src 'none';
    frame-src 'none';
    frame-ancestors 'none';
    base-uri 'none';
  `;

  const response = NextResponse.next({
    request: {
      headers
    }
  });
  
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Cache-Control', 'no-cache, no-store');
 
  return response;
}