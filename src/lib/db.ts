import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

export type VoteRow = {
  id: number;
  candidate_id: string;
  reason: string;
  voter_hash: string;
  cookie_id: string;
  created_at: string;
  updated_at: string;
};

export type VotePick = { candidateId: string; reason: string };

type Db = {
  replaceVotes: (args: {
    picks: VotePick[];
    voterHash: string;
    cookieId: string;
  }) => Promise<void>;
  listVotes: () => Promise<VoteRow[]>;
};

let cached: Db | null = null;

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return String(v);
}

function getPostgresUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED
  );
}

export function getDb(): Db {
  if (cached) return cached;
  cached = getPostgresUrl() ? createPostgresDb() : createJsonDb();
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
    async replaceVotes({ picks, voterHash, cookieId }) {
      const op = writing.then(async () => {
        const rows = (await readAll()).filter((r) => r.voter_hash !== voterHash);
        const now = new Date().toISOString();
        let nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
        for (const p of picks) {
          rows.push({
            id: nextId++,
            candidate_id: p.candidateId,
            reason: p.reason,
            voter_hash: voterHash,
            cookie_id: cookieId,
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
  const { createPool } = require('@vercel/postgres');
  const pool = createPool({ connectionString: getPostgresUrl() });
  let initialized = false;
  async function init() {
    if (initialized) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        category TEXT,
        reason TEXT NOT NULL,
        voter_hash TEXT NOT NULL,
        cookie_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // 旧スキーマからの移行
    await pool.query(
      `ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_voter_hash_key;`,
    );
    await pool.query(`ALTER TABLE votes ALTER COLUMN category DROP NOT NULL;`);
    await pool.query(`ALTER TABLE votes ALTER COLUMN category SET DEFAULT '';`);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS votes_voter_hash_idx ON votes(voter_hash);`,
    );
    initialized = true;
  }
  return {
    async replaceVotes({ picks, voterHash, cookieId }) {
      await init();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM votes WHERE voter_hash = $1`, [voterHash]);
        for (const p of picks) {
          await client.query(
            `INSERT INTO votes (candidate_id, reason, voter_hash, cookie_id)
             VALUES ($1, $2, $3, $4)`,
            [p.candidateId, p.reason, voterHash, cookieId],
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
    async listVotes() {
      await init();
      const { rows } = await pool.query(
        `SELECT id, candidate_id, reason, voter_hash, cookie_id,
                created_at, updated_at
         FROM votes
         ORDER BY created_at DESC`,
      );
      return rows.map((r: Record<string, unknown>) => ({
        ...r,
        created_at: toIso(r.created_at),
        updated_at: toIso(r.updated_at),
      })) as VoteRow[];
    },
  };
}
