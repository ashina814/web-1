export default function ThanksPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🏆</div>
        <h1 className="text-2xl text-meigoku-gold font-bold mb-4">
          投票ありがとうございました
        </h1>
        <p className="text-meigoku-accent leading-relaxed">
          あなたの一票を受け付けました。
          <br />
          結果発表をお楽しみに。
        </p>
        <p className="text-xs text-meigoku-accent/60 mt-8">
          内容を修正したい場合は、同じブラウザから再投票すると上書きされます。
        </p>
      </div>
    </main>
  );
}
