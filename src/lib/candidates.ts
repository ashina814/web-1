export type Candidate = { id: string; name: string };
export type RankGroup = { rank: string; members: Candidate[] };

export const CANDIDATE_GROUPS: RankGroup[] = [
  { rank: '魔将', members: [{ id: 'ehoba', name: 'えほば' }] },
  {
    rank: '弐級魔剣士',
    members: [{ id: 'lucifer', name: 'Lucifer' }],
  },
  {
    rank: '参級魔剣士',
    members: [
      { id: 'satan', name: 'Satan' },
      { id: 'neko', name: 'ねこ' },
      { id: 'kaoru', name: 'Kaoru' },
    ],
  },
  {
    rank: '見習い魔剣士',
    members: [
      { id: 'kero', name: 'ケロ' },
      { id: 'usami', name: 'うさみ' },
      { id: 'nano', name: 'なの' },
      { id: 'natari', name: 'なたり' },
      { id: 'astaroth', name: 'アスタロトの宣告' },
    ],
  },
];

export const ALL_CANDIDATES: Candidate[] = CANDIDATE_GROUPS.flatMap((g) => g.members);

export function getCandidate(id: string): Candidate | undefined {
  return ALL_CANDIDATES.find((c) => c.id === id);
}
