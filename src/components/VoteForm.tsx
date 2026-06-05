'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CANDIDATE_GROUPS } from '@/lib/candidates';
import { CATEGORIES } from '@/lib/categories';

export default function VoteForm() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState('');
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!candidateId) return setError('魔剣士を選択してください。');
    if (!category) return setError('部門を選択してください。');
    if (reason.trim().length < 10)
      return setError('投票理由は10文字以上で記入してください。');

    setSubmitting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, category, reason: reason.trim() }),
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
      <section>
        <h2 className="text-meigoku-gold text-lg mb-3 border-b border-meigoku-border pb-2">
          🗡️ 魔剣士を選択
        </h2>
        <div className="space-y-4">
          {CANDIDATE_GROUPS.map((group) => (
            <div key={group.rank}>
              <div className="text-meigoku-accent text-sm mb-2">【{group.rank}】</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.members.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition ${
                      candidateId === m.id
                        ? 'border-meigoku-gold bg-meigoku-border/40'
                        : 'border-meigoku-border hover:border-meigoku-accent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="candidate"
                      value={m.id}
                      checked={candidateId === m.id}
                      onChange={() => setCandidateId(m.id)}
                      className="accent-meigoku-gold"
                    />
                    <span>{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-meigoku-gold text-lg mb-3 border-b border-meigoku-border pb-2">
          🏷️ 部門を選択
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition ${
                category === c.id
                  ? 'border-meigoku-gold bg-meigoku-border/40'
                  : 'border-meigoku-border hover:border-meigoku-accent'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={category === c.id}
                onChange={() => setCategory(c.id)}
                className="accent-meigoku-gold"
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-meigoku-gold text-lg mb-3 border-b border-meigoku-border pb-2">
          📝 投票理由
        </h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          maxLength={1000}
          placeholder="例: いつも雑談で盛り上げてくれて場が明るくなるから。"
          className="w-full bg-meigoku-panel border border-meigoku-border rounded p-3 focus:border-meigoku-accent focus:outline-none"
        />
        <div className="text-right text-xs text-meigoku-accent/70 mt-1">
          {reason.length} / 1000
        </div>
      </section>

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
        ※ 同じブラウザから再投票すると、最新の内容で上書きされます。
      </p>
    </form>
  );
}
