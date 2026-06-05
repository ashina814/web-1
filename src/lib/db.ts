import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

export type VoteRow = {
  id: number;
  candidate_id: string;
  category: string;
  reason: string;
  voter_hash: string;
  cookie_id: string;
  created_at: string;
  updated_at: string;
};

type Db = {
  upsertVote: (v: {
    candidateId: string;
    category: string;
    reason: string;
    voterHash: string;
    cookieId: string;
  }) => Promise<void>;
  listVotes: () => Promise<VoteRow[]>;
};

let cached: Db | null = null;

export function getDb(): Db {
  if (cached) return cached;
  cached = process.env.POSTGRES_URL ? createPostgresDb() : createJsonDb();
  return cached;
}

function createJsonDb(): Db {
  const dir = path.join(process.cwd(), 'data');
  const file = path.join(dir, 'votes.json');
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8');

  let writing: Promise<void> = Promise.resolve();

  async function readAll(): Promise<VoteRow[]> {
    const txt = await fsp.readFile(file, 'utf8').catch(() => '[]');
    try {
      const parsed = JSON.parse(txt);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async function writeAll(rows: VoteRow[]): Promise<void> {
    const tmp = file + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
    await fsp.rename(tmp, file);
  }

  return {
    async upsertVote(v) {
      const op = writing.then(async () => {
        const rows = await readAll();
        const now = new Date().toISOString();
        const existing = rows.find((r) => r.voter_hash === v.voterHash);
        if (existing) {
          existing.candidate_id = v.candidateId;
          existing.category = v.category;
          existing.reason = v.reason;
          existing.cookie_id = v.cookieId;
          existing.updated_at = now;
        } else {
          const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
          rows.push({
            id: nextId,
            candidate_id: v.candidateId,
            category: v.category,
            reason: v.reason,
            voter_hash: v.voterHash,
            cookie_id: v.cookieId,
            created_at: now,
            updated_at: now,
          });
        }
        await writeAll(rows);
      });
      writing = op.catch(() => undefined);
      await op;
    },
    async listVotes() {
      const rows = await readAll();
      return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  };
}

function createPostgresDb(): Db {
  const { sql } = require('@vercel/postgres');
  let initialized = false;
  async function init() {
    if (initialized) return;
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        voter_hash TEXT NOT NULL UNIQUE,
        cookie_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    initialized = true;
  }
  return {
    async upsertVote(v) {
      await init();
      await sql`
        INSERT INTO votes (candidate_id, category, reason, voter_hash, cookie_id)
        VALUES (${v.candidateId}, ${v.category}, ${v.reason}, ${v.voterHash}, ${v.cookieId})
        ON CONFLICT (voter_hash) DO UPDATE SET
          candidate_id = EXCLUDED.candidate_id,
          category = EXCLUDED.category,
          reason = EXCLUDED.reason,
          cookie_id = EXCLUDED.cookie_id,
          updated_at = NOW();
      `;
    },
    async listVotes() {
      await init();
      const { rows } = await sql<VoteRow>`SELECT * FROM votes ORDER BY created_at DESC`;
      return rows;
    },
  };
}
