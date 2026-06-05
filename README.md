# 冥獄魔剣士総選挙 投票サイト

Discord「冥獄城」の魔剣士総選挙のための匿名投票Webアプリ。

## ローカル起動

```bash
npm install
cp .env.local.example .env.local
# .env.local の ADMIN_PASS と VOTER_SALT を編集
npm run dev
```

- 投票ページ: http://localhost:3000/
- 管理画面: http://localhost:3000/admin (Basic認証)

`POSTGRES_URL` を設定しない場合は `data/votes.json` (JSONファイル) に保存されます (ローカル開発用)。

## 環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `POSTGRES_URL` | 本番のみ | Vercel Postgres / Neon の接続文字列 |
| `ADMIN_USER` | ○ | 管理画面のBasic認証ユーザー名 (デフォルト `admin`) |
| `ADMIN_PASS` | ○ | 管理画面のBasic認証パスワード |
| `VOTER_SALT` | ○ | 投票者ハッシュ用ソルト (推測不能なランダム文字列) |
| `VOTE_START` |  | 投票開始日時 (ISO8601 / 例: `2026-06-10T00:00:00+09:00`) |
| `VOTE_END` |  | 投票終了日時 (ISO8601) |
| `VOTE_CLOSED` |  | `true` で投票停止 (期間設定より優先) |

## Vercelへのデプロイ

1. GitHubにpush後、Vercelで新規プロジェクトとしてインポート。
2. Storage → Postgres を有効化 (`POSTGRES_URL` が自動セットされる)。
3. Environment Variables で `ADMIN_USER` / `ADMIN_PASS` / `VOTER_SALT` を設定。
4. デプロイ後、`/admin` から初回アクセスするとテーブルが自動作成されます。

## 重複投票対策

- 投票者識別子は `SHA-256(VOTER_SALT + IP + cookie_id)` のハッシュ。
- 生IPはDBに保存されません。
- 同一ハッシュの投票は最新の内容で上書きされます (再投票OK)。

## 機能

- 階級グループ別の魔剣士選択 (ラジオ)
- 部門選択 (6種)
- 投票理由の自由記述 (10–1000文字)
- 管理画面: ランキング / 部門別集計 / 全投票一覧 / CSVエクスポート
- 期間/手動クローズによる投票停止

## ファイル構成

- `src/lib/candidates.ts` — 魔剣士マスタ
- `src/lib/categories.ts` — 部門マスタ
- `src/lib/db.ts` — DB抽象化 (Postgres / JSONファイル)
- `src/lib/voter.ts` — IP取得・ハッシュ化・Cookie
- `src/lib/period.ts` — 投票期間判定
- `src/middleware.ts` — `/admin` Basic認証
- `src/app/page.tsx` — 投票ページ
- `src/app/thanks/page.tsx` — 完了ページ
- `src/app/admin/page.tsx` — 管理ダッシュボード
- `src/app/admin/export.csv/route.ts` — CSVエクスポート
- `src/app/api/vote/route.ts` — 投票API
