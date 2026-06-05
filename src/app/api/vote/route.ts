import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCandidate } from '@/lib/candidates';
import { checkPeriod } from '@/lib/period';
import { getClientIp, getOrCreateCookieId, hashVoter } from '@/lib/voter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const status = checkPeriod();
  if (!status.open) {
    return NextResponse.json({ error: '現在投票は受け付けていません。' }, { status: 403 });
  }

  let body: { candidateId?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストです。' }, { status: 400 });
  }

  const candidateId = String(body.candidateId ?? '');
  const category = '';
  const reason = String(body.reason ?? '').trim();

  if (!getCandidate(candidateId)) {
    return NextResponse.json({ error: '魔剣士の選択が不正です。' }, { status: 400 });
  }
  if (reason.length < 10) {
    return NextResponse.json({ error: '投票理由は10文字以上で記入してください。' }, { status: 400 });
  }
  if (reason.length > 1000) {
    return NextResponse.json({ error: '投票理由が長すぎます。' }, { status: 400 });
  }

  const ip = getClientIp();
  const { cookieId } = getOrCreateCookieId();
  const voterHash = hashVoter(ip, cookieId);

  try {
    await getDb().upsertVote({ candidateId, category, reason, voterHash, cookieId });
  } catch (e) {
    console.error('vote upsert failed', e);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
