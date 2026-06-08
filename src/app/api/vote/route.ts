import { NextResponse } from 'next/server';
import { getDb, type VotePick } from '@/lib/db';
import { getCandidate } from '@/lib/candidates';
import { checkPeriod } from '@/lib/period';
import { getClientIp, getOrCreateCookieId, hashVoter } from '@/lib/voter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Incoming = {
  picks?: Array<{ candidateId?: string; reason?: string }>;
  // 旧フォーマット互換
  candidateId?: string;
  reason?: string;
};

export async function POST(req: Request) {
  const status = checkPeriod();
  if (!status.open) {
    return NextResponse.json({ error: '現在投票は受け付けていません。' }, { status: 403 });
  }

  let body: Incoming;
  try {
    body = (await req.json()) as Incoming;
  } catch {
    return NextResponse.json({ error: '不正なリクエストです。' }, { status: 400 });
  }

  const rawPicks: Array<{ candidateId?: string; reason?: string }> = Array.isArray(body.picks)
    ? body.picks
    : [{ candidateId: body.candidateId, reason: body.reason }];

  const picks: VotePick[] = [];
  for (const p of rawPicks) {
    const candidateId = String(p.candidateId ?? '').trim();
    const reason = String(p.reason ?? '').trim();
    if (!candidateId) continue;
    if (!getCandidate(candidateId)) {
      return NextResponse.json({ error: '魔剣士の選択が不正です。' }, { status: 400 });
    }
    if (reason.length < 10) {
      return NextResponse.json(
        { error: '投票理由は10文字以上で記入してください。' },
        { status: 400 },
      );
    }
    if (reason.length > 1000) {
      return NextResponse.json({ error: '投票理由が長すぎます。' }, { status: 400 });
    }
    picks.push({ candidateId, reason });
  }

  if (picks.length === 0) {
    return NextResponse.json({ error: '魔剣士を選択してください。' }, { status: 400 });
  }
  if (picks.length > 2) {
    return NextResponse.json({ error: '投票できるのは最大2人までです。' }, { status: 400 });
  }
  const ids = picks.map((p) => p.candidateId);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: '同じ魔剣士を2回選ぶことはできません。' },
      { status: 400 },
    );
  }

  const ip = getClientIp();
  const { cookieId } = getOrCreateCookieId();
  const voterHash = hashVoter(ip, cookieId);

  try {
    await getDb().replaceVotes({ picks, voterHash, cookieId });
  } catch (e) {
    console.error('vote replace failed', e);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
