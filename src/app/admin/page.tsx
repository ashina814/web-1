import { getDb, type VoteRow } from '@/lib/db';
import { ALL_CANDIDATES, getCandidate } from '@/lib/candidates';
import { CATEGORIES, getCategoryLabel } from '@/lib/categories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function fmtDate(s: string | Date): string {
  if (s instanceof Date) return s.toLocaleString('ja-JP');
  if (typeof s !== 'string') return String(s);
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? s : d.toLocaleString('ja-JP');
}

function buildRanking(votes: VoteRow[]) {
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.candidate_id, (counts.get(v.candidate_id) ?? 0) + 1);
  return ALL_CANDIDATES
    .map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

function buildCategoryMatrix(votes: VoteRow[]) {
  const matrix = new Map<string, Map<string, number>>();
  for (const v of votes) {
    if (!matrix.has(v.candidate_id)) matrix.set(v.candidate_id, new Map());
    const row = matrix.get(v.candidate_id)!;
    row.set(v.category, (row.get(v.category) ?? 0) + 1);
  }
  return matrix;
}

export default async function AdminPage() {
  const votes = await getDb().listVotes();
  const ranking = buildRanking(votes);
  const matrix = buildCategoryMatrix(votes);
  const uniqueVoters = new Set(votes.map((v) => v.voter_hash)).size;

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="text-2xl text-meigoku-gold font-bold">
          🛠️ 冥獄魔剣士総選挙 — 管理画面
        </h1>
        <a
          href="/admin/export.csv"
          className="text-sm bg-meigoku-accent/80 hover:bg-meigoku-accent text-meigoku-bg px-4 py-2 rounded font-bold"
        >
          ⬇ CSVダウンロード
        </a>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Stat label="総投票数" value={votes.length} />
        <Stat label="ユニーク投票者" value={uniqueVoters} />
        <Stat label="候補者数" value={ALL_CANDIDATES.length} />
        <Stat label="部門数" value={CATEGORIES.length} />
      </section>

      <section className="mb-10">
        <h2 className="text-xl text-meigoku-gold mb-3 border-b border-meigoku-border pb-2">
          🏆 ランキング
        </h2>
        <table className="w-full text-sm">
          <thead className="text-meigoku-accent">
            <tr>
              <th className="text-left py-2 px-2">順位</th>
              <th className="text-left py-2 px-2">魔剣士</th>
              <th className="text-right py-2 px-2">得票</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.id} className="border-t border-meigoku-border">
                <td className="py-2 px-2">{i + 1}</td>
                <td className="py-2 px-2">{r.name}</td>
                <td className="py-2 px-2 text-right font-bold">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-10 overflow-x-auto">
        <h2 className="text-xl text-meigoku-gold mb-3 border-b border-meigoku-border pb-2">
          🏷️ 部門別集計
        </h2>
        <table className="text-sm min-w-full">
          <thead className="text-meigoku-accent">
            <tr>
              <th className="text-left py-2 px-2">魔剣士</th>
              {CATEGORIES.map((c) => (
                <th key={c.id} className="text-right py-2 px-2">
                  {c.label}
                </th>
              ))}
              <th className="text-right py-2 px-2">計</th>
            </tr>
          </thead>
          <tbody>
            {ALL_CANDIDATES.map((c) => {
              const row = matrix.get(c.id);
              const total = row ? [...row.values()].reduce((a, b) => a + b, 0) : 0;
              return (
                <tr key={c.id} className="border-t border-meigoku-border">
                  <td className="py-2 px-2">{c.name}</td>
                  {CATEGORIES.map((cat) => (
                    <td key={cat.id} className="text-right py-2 px-2">
                      {row?.get(cat.id) ?? 0}
                    </td>
                  ))}
                  <td className="text-right py-2 px-2 font-bold">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl text-meigoku-gold mb-3 border-b border-meigoku-border pb-2">
          🗒️ 投票一覧 ({votes.length})
        </h2>
        <div className="space-y-3">
          {votes.map((v) => (
            <div
              key={v.id}
              className="bg-meigoku-panel/70 border border-meigoku-border rounded p-3"
            >
              <div className="flex justify-between text-xs text-meigoku-accent mb-1 flex-wrap gap-2">
                <span>
                  <span className="text-meigoku-gold font-bold">
                    {getCandidate(v.candidate_id)?.name ?? v.candidate_id}
                  </span>{' '}
                  / {getCategoryLabel(v.category)}
                </span>
                <span>{fmtDate(v.created_at)}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{v.reason}</div>
            </div>
          ))}
          {votes.length === 0 && (
            <div className="text-meigoku-accent/60 text-center py-10">
              まだ投票はありません。
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-meigoku-panel/70 border border-meigoku-border rounded p-4 text-center">
      <div className="text-xs text-meigoku-accent">{label}</div>
      <div className="text-2xl font-bold text-meigoku-gold mt-1">{value}</div>
    </div>
  );
}
