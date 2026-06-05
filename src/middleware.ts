import { NextResponse, type NextRequest } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER ?? 'admin';
  const pass = process.env.ADMIN_PASS;
  if (!pass) {
    return new NextResponse('ADMIN_PASS is not configured.', { status: 500 });
  }

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(':');
    const u = idx >= 0 ? decoded.slice(0, idx) : decoded;
    const p = idx >= 0 ? decoded.slice(idx + 1) : '';
    if (u === user && p === pass) return NextResponse.next();
  }
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="admin"' },
  });
}
