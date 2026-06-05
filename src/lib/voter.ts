import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'voter_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getClientIp(): string {
  const h = headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = h.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export function getOrCreateCookieId(): { cookieId: string; isNew: boolean } {
  const jar = cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return { cookieId: existing, isNew: false };
  const id = randomUUID();
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return { cookieId: id, isNew: true };
}

export function hashVoter(ip: string, cookieId: string): string {
  const salt = process.env.VOTER_SALT ?? 'dev-salt';
  return createHash('sha256').update(`${salt}|${ip}|${cookieId}`).digest('hex');
}

export function maskIp(ip: string): string {
  if (!ip || ip === 'unknown') return ip;
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 2).join(':') + ':***';
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip;
}
