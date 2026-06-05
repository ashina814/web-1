import VoteForm from '@/components/VoteForm';
import { checkPeriod, periodMessage } from '@/lib/period';

export default function HomePage() {
  const status = checkPeriod();
  const closedMsg = periodMessage(status);

  return (
    <main className="min-h-screen flex justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <div className="text-meigoku-gold text-sm tracking-widest">👑 EVENT 👑</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-meigoku-gold mt-2 drop-shadow">
            冥獄魔剣士総選挙
          </h1>
          <p className="text-meigoku-accent mt-3 text-sm">
            冥獄城で最も支持された魔剣士は誰だ──
          </p>
        </header>

        <div className="bg-meigoku-panel/70 border border-meigoku-border rounded-lg p-6 shadow-xl backdrop-blur">
          {closedMsg ? (
            <div className="text-center py-10 text-meigoku-gold">{closedMsg}</div>
          ) : (
            <VoteForm />
          )}
        </div>
      </div>
    </main>
  );
}
