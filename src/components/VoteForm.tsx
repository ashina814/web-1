'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CANDIDATE_GROUPS } from '@/lib/candidates';

type Pick = { candidateId: string; reason: string };

const EMPTY_PICK: Pick = { candidateId: '', reason: '' };

export default function VoteForm() {
  const router = useRouter();
  const [picks, setPicks] = useState<Pick[]>([{ ...EMPTY_PICK }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedIds = useMemo(
    () => picks.map((p) => p.candidateId).filter(Boolean),
    [picks],
  );

  function updatePick(i: number, patch: Partial<Pick>) {
    setPicks((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function addSecond() {
    setPicks((prev) => (prev.length < 2 ? [...prev, { ...EMPTY_PICK }] : prev));
  }

  function removeSecond() {
    setPicks((prev) => prev.slice(0, 1));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const filled = picks.filter((p) => p.candidateId);
    if (filled.length === 0) return setError('魔剣士を選択してください。');
    for (const p of filled) {
      if (p.reason.trim().length < 10)
        return setError('投票理由は10文字以上で記入してください。');
    }
    const ids = filled.map((p) => p.candidateId);
    if (new Set(ids).size !== ids.length)
      return setError('同じ魔剣士を2回選ぶことはできません。');

    setSubmitting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          picks: filled.map((p) => ({ candidateId: p.candidateId, reason: p.reason.trim() })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '送信に失敗しました。');
      }
      router.push('/thanks');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '送信に失敗しました。');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {picks.map((pick, idx) => (
        <PickSection
          key={idx}
          index={idx}
          pick={pick}
          otherSelectedIds={selectedIds.filter((_, i) => i !== idx)}
          onChange={(patch) => updatePick(idx, patch)}
          onRemove={idx === 1 ? removeSecond : undefined}
        />
      ))}

      {picks.length < 2 && (
        <button
          type="button"
          onClick={addSecond}
          className="w-full border border-dashed border-meigoku-accent/60 text-meigoku-accent rounded py-3 hover:bg-meigoku-border/30 transition"
        >
          ＋ もう一人投票する (任意)
        </button>
      )}

      {error && (
        <div className="text-red-300 bg-red-900/30 border border-red-700/50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-meigoku-accent to-meigoku-gold text-meigoku-bg font-bold py-3 rounded shadow-lg hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? '送信中…' : '🗳️ 投票する'}
      </button>

      <p className="text-xs text-meigoku-accent/60 text-center">
        ※ 最大2人まで投票できます (同じ人は選べません)。
        <br />
        ※ 同じブラウザから再送信すると、前回の投票はすべて上書きされます。
      </p>
    </form>
  );
}

function PickSection({
  index,
  pick,
  otherSelectedIds,
  onChange,
  onRemove,
}: {
  index: number;
  pick: Pick;
  otherSelectedIds: string[];
  onChange: (patch: Partial<Pick>) => void;
  onRemove?: () => void;
}) {
  return (
    <section className="border border-meigoku-border rounded-lg p-4 bg-meigoku-panel/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-meigoku-gold text-lg">
          🗡️ {index === 0 ? '1人目' : '2人目'} を選択
          {index === 1 && (
            <span className="text-xs text-meigoku-accent/70 ml-2">(任意)</span>
          )}
        </h2>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-meigoku-accent hover:text-red-300"
          >
            削除
          </button>
        )}
      </div>

      <div className="space-y-4">
        {CANDIDATE_GROUPS.map((group) => (
          <div key={group.rank}>
            <div className="text-meigoku-accent text-sm mb-2">【{group.rank}】</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.members.map((m) => {
                const disabled = otherSelectedIds.includes(m.id);
                const checked = pick.candidateId === m.id;
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded border transition ${
                      disabled
                        ? 'opacity-30 cursor-not-allowed border-meigoku-border'
                        : checked
                          ? 'border-meigoku-gold bg-meigoku-border/40 cursor-pointer'
                          : 'border-meigoku-border hover:border-meigoku-accent cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`candidate-${index}`}
                      value={m.id}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onChange({ candidateId: m.id })}
                      className="accent-meigoku-gold"
                    />
                    <span>{m.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-meigoku-accent text-sm mb-2">📝 投票理由</div>
        <textarea
          value={pick.reason}
          onChange={(e) => onChange({ reason: e.target.value })}
          rows={4}
          maxLength={1000}
          placeholder="例: いつも雑談で盛り上げてくれて場が明るくなるから。"
          className="w-full bg-meigoku-panel border border-meigoku-border rounded p-3 focus:border-meigoku-accent focus:outline-none"
        />
        <div className="text-right text-xs text-meigoku-accent/70 mt-1">
          {pick.reason.length} / 1000
        </div>
      </div>
    </section>
  );
}
