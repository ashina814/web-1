export type Category = { id: string; label: string };

export const CATEGORIES: Category[] = [
  { id: 'talk', label: '話しやすかった' },
  { id: 'funny', label: '面白かった' },
  { id: 'reliable', label: '頼りになった' },
  { id: 'active', label: 'よく浮上していた' },
  { id: 'oshi', label: '推しだから' },
  { id: 'other', label: 'その他' },
];

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
