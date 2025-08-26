import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { QueryResponse } from '@qdrant/js-client-rest';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

// ---- Config ----
const PORT = Number(process.env.PORT ?? 8090);
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://gptu:gptu@127.0.0.1:5432/gptu';

const QDRANT_URL = process.env.QDRANT_URL ?? 'http://127.0.0.1:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? 'teachings';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const OPENAI_EMBED_MODEL =
  process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small';
const EMBED_DIM = 1536; // text-embedding-3-small

// ---- Clients ----
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const pool = new Pool({ connectionString: DATABASE_URL });
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const qdrant = new QdrantClient({ url: QDRANT_URL });

// ---- DB init ----
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teachings (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      tags TEXT[] DEFAULT '{}',
      scope TEXT NOT NULL CHECK (scope IN ('global','session')),
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS teachings_scope_created_idx ON teachings(scope, created_at DESC);`
  );
}
initDb().catch((err) => {
  console.error('DB init failed', err);
  process.exit(1);
});

// ---- Qdrant init ----
async function ensureCollection() {
  try {
    const exists = await qdrant.getCollection(QDRANT_COLLECTION).catch(() => null);
    if (!exists) {
      await qdrant.createCollection(QDRANT_COLLECTION, {
        vectors: { size: EMBED_DIM, distance: 'Cosine' }
      });
    }
  } catch (e) {
    // qdrant may be down; we continue and report in /health
    console.warn('Qdrant not reachable yet:', (e as Error).message);
  }
}
ensureCollection();

// ---- Helpers ----
async function embed(text: string): Promise<number[] | null> {
  if (!openai) return null;
  const out = await openai.embeddings.create({
    input: text,
    model: OPENAI_EMBED_MODEL
  });
  return out.data[0]?.embedding ?? null;
}

async function upsertVector(
  id: string,
  vec: number[] | null,
  payload: Record<string, unknown>
) {
  if (!vec) return; // no embeddings → skip vector store
  await qdrant.upsert(QDRANT_COLLECTION, {
    points: [{ id, vector: vec, payload }]
  });
}

async function searchVector(
  vec: number[],
  topK = 4
): Promise<
  Array<{ id: string; score: number; payload?: Record<string, unknown> }>
> {
  const res: QueryResponse = await qdrant.query(QDRANT_COLLECTION, {
    query: vec,
    limit: topK,
    with_payload: true
  });
  return (res.points ?? []).map((p: any) => ({
    id: String(p.id),
    score: p.score ?? 0,
    payload: p.payload ?? {}
  }));
}

// ---- Routes ----

app.get('/health', async (_req, res) => {
  // db
  let db = 'down';
  try {
    await pool.query('SELECT 1');
    db = 'up';
  } catch {}

  // qdrant
  let qdrantStatus = 'down';
  try {
    await qdrant.getCollections();
    qdrantStatus = 'up';
  } catch {}

  res.json({
    ok: true,
    db,
    qdrant: qdrantStatus,
    usesOpenAI: Boolean(openai)
  });
});

// Teach: { text, tags?: string[], scope: 'global'|'session' }
app.post('/teach', async (req, res) => {
  try {
    const { text, tags = [], scope = 'global' } = req.body ?? {};
    const sid = String(req.header('x-session-id') ?? req.body?.session ?? '');
    if (!text || !['global', 'session'].includes(scope)) {
      return res.status(400).json({ ok: false, error: 'invalid payload' });
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO teachings(id, text, tags, scope, session_id) VALUES($1,$2,$3,$4,$5)`,
      [id, text, tags, scope, scope === 'session' ? sid || null : null]
    );

    const vec = await embed(text).catch((e) => {
      console.warn('embed error:', (e as Error).message);
      return null;
    });

    await upsertVector(id, vec, {
      text,
      tags,
      scope,
      session_id: scope === 'session' ? sid || null : null,
      created_at: new Date().toISOString()
    }).catch((e) => console.warn('qdrant upsert warn:', (e as Error).message));

    res.json({ ok: true, id });
  } catch (e) {
    console.error('/teach error', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Respond: { input, actor? }
app.post('/respond', async (req, res) => {
  try {
    const { input } = req.body ?? {};
    if (!input) return res.status(400).json({ reply: 'bad request' });

    // Try semantic search if we have embeddings
    let sources: Array<{ id: string; text: string; tags: string[]; score: number }> = [];

    const vec = await embed(input).catch(() => null);

    if (vec) {
      try {
        const hits = await searchVector(vec, 4);
        sources = hits.map((h) => ({
          id: h.id,
          text: String(h.payload?.text ?? ''),
          tags: (h.payload?.tags as string[]) ?? [],
          score: typeof h.score === 'number' ? h.score : 0
        }));
      } catch (e) {
        console.warn('qdrant search warn:', (e as Error).message);
      }
    }

    // Fallback: recent rows
    if (!sources.length) {
      const { rows } = await pool.query(
        `SELECT id, text, tags FROM teachings ORDER BY created_at DESC LIMIT 4`
      );
      sources = rows.map((r) => ({
        id: r.id,
        text: r.text,
        tags: r.tags ?? [],
        score: 0.4
      }));
    }

    res.json({ reply: 'stub (retrieval ok)', sources });
  } catch (e) {
    console.error('/respond error', e);
    res.status(500).json({ reply: 'error' });
  }
});

// Optional: reindex all rows (re-embed & upsert to qdrant)
app.post('/reindex', async (_req, res) => {
  try {
    if (!openai) return res.status(400).json({ ok: false, error: 'no_openai' });
    await ensureCollection();
    const { rows } = await pool.query(`SELECT id, text, tags, scope, session_id, created_at
                                       FROM teachings ORDER BY created_at ASC`);
    let ok = 0, fail = 0;
    for (const r of rows) {
      try {
        const v = await embed(r.text);
        if (v) {
          await upsertVector(r.id, v, {
            text: r.text,
            tags: r.tags ?? [],
            scope: r.scope,
            session_id: r.session_id,
            created_at: r.created_at
          });
          ok++;
        } else fail++;
      } catch {
        fail++;
      }
    }
    res.json({ ok: true, upserted: ok, failed: fail });
  } catch (e) {
    console.error('/reindex error', e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.listen(PORT, () =>
  console.log(`MGM listening on http://127.0.0.1:${PORT}`)
);
