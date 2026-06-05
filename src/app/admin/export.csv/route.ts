import { getDb } from '@/lib/db';
import { getCandidate } from '@/lib/candidates';
import { getCategoryLabel } from '@/lib/categories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const votes = await getDb().listVotes();
  const header = ['id', '投票日時', '更新日時', '魔剣士', '部門', '理由', 'voter_hash'];
  const lines = [header.map(csvEscape).join(',')];
  for (const v of votes) {
    lines.push(
      [
        String(v.id),
        v.created_at,
        v.updated_at,
        getCandidate(v.candidate_id)?.name ?? v.candidate_id,
        getCategoryLabel(v.category),
        v.reason,
        v.voter_hash,
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  const bom = '﻿';
  return new Response(bom + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="meigoku-election-${Date.now()}.csv"`,
    },
  });
}
