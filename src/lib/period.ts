export type PeriodStatus =
  | { open: true }
  | { open: false; reason: 'before' | 'after' | 'closed' };

export function checkPeriod(now: Date = new Date()): PeriodStatus {
  if (process.env.VOTE_CLOSED === 'true') return { open: false, reason: 'closed' };
  const start = process.env.VOTE_START ? new Date(process.env.VOTE_START) : null;
  const end = process.env.VOTE_END ? new Date(process.env.VOTE_END) : null;
  if (start && now < start) return { open: false, reason: 'before' };
  if (end && now > end) return { open: false, reason: 'after' };
  return { open: true };
}

export function periodMessage(status: PeriodStatus): string | null {
  if (status.open) return null;
  switch (status.reason) {
    case 'before':
      return '投票期間はまだ開始されていません。';
    case 'after':
      return '投票期間は終了しました。ご参加ありがとうございました。';
    case 'closed':
      return '現在投票は受け付けていません。';
  }
}
