import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '冥獄魔剣士総選挙',
  description: '冥獄城で最も支持された魔剣士は誰だ──',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-serif antialiased">{children}</body>
    </html>
  );
}
