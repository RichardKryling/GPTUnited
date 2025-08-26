import express from 'express';
import cors from 'cors';
import { Client as Pg } from 'pg';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gptu:gptu@127.0.0.1:5432/gptu';
const QDRANT_URL = (process.env.QDRANT_URL || 'http://127.0.0.1:6333').replace(/\/+$/,'');
const openaiKey = process.env.OPENAI_API_KEY || '';
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---------- Postgres ----------
const pg = new Pg({ connectionString: DATABASE_URL });
async function initPg() {
  await pg.connect();
  await pg.query(`
    CREATE TABLE IF NOT EXISTS teachings (
      id UUID PRIMARY KEY,
      text TEXT NOT NULL,
      tags TEXT[] DEFAULT '{}',
      scope TEXT NOT NULL CHECK (scope IN ('global','session')),
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

// ---------- Qdrant ----------
const VECTOR_SIZE = 1536; // text-embedding-3-small
async function qdrant(path: string, init?: RequestInit) {
  const res = await fetch(`${QDRANT_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) }
  });
  if (!res.ok) throw new Error(`Qdrant ${path} ${res.status}`);
  return res.json();
}
async function ensureCollection(name = 'teachings') {
  // create if not exists
  try {
    await qdrant(`/collections/${name}`);
  } catch {
    await fetch(`${QDRANT_URL}/collections/${name}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' }
      })
    }).then(r => {
      if (!r.ok) throw new Error(`Qdrant create ${name} ${r.status}`);
    });
  }
}

// ---------- Embeddings ----------
function localEmbed(text: string, dims = VECTOR_SIZE): number[] {
  // Deterministic, cheap embedding so service works even without OPENAI_API_KEY
  const v = new Float32Array(dims);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    v[(c + i) % dims] += ( (c % 31) - 15 ) / 50; // small spread
  }
  return Array.from(v, x => Number(x));
}

async function embed(text: string): Promise<number[]> {
  if (openai) {
    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return resp.data[0].embedding as unknown as number[];
  }
  return localEmbed(text);
}

// ---------- Routes ----------
app.get('/health', async (_req, res) => {
  try {
    await pg.query('SELECT 1');
    const q = await fetch(`${QDRANT_URL}/readyz`).then(r => r.text());
    res.json({ ok: true, pg: true, qdrant: q.includes('ready') });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

app.post('/teach', async (req, res) => {
  try {
    const sid = (req.headers['x-session-id'] as string) || req.body.session_id || null;
    let { text, tags = [], scope = 'session' } = req.body || {};
    if (typeof text !== 'string' || text.trim().length < 1) {
      return res.status(400).json({ error: 'text required' });
    }
    if (typeof tags === 'string') {
      tags = String(tags).split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (scope !== 'global' && scope !== 'session') scope = 'session';

    const id = randomUUID();
    await pg.query(
      'INSERT INTO teachings(id, text, tags, scope, session_id) VALUES ($1,$2,$3,$4,$5)',
      [id, text, tags, scope, sid]
    );

    await ensureCollection('teachings');
    const vector = await embed(text);
    // upsert to Qdrant
    await qdrant(`/collections/teachings/points?wait=true`, {
      method: 'PUT',
      body: JSON.stringify({
        points: [
          {
            id,
            vector,
            payload: { id, text, tags, scope, session_id: sid }
          }
        ]
      })
    });

    res.json({ ok: true, id, scope, tags, session: sid });
  } catch (err: any) {
    console.error('teach error', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

app.post('/respond', async (req, res) => {
  try {
    const { input, top_k = 5 } = req.body || {};
    if (typeof input !== 'string' || input.trim().length < 1) {
      return res.status(400).json({ error: 'input required' });
    }
    await ensureCollection('teachings');
    const vector = await embed(input);
    const r = await qdrant(`/collections/teachings/points/search`, {
      method: 'POST',
      body: JSON.stringify({
        vector,
        limit: top_k,
        with_payload: true
      })
    });
    const sources = (r?.result || []).map((p: any) => ({
      id: p.id, score: p.score, ...(p.payload || {})
    }));
    // Stub reply for now
    res.json({ reply: 'stub (retrieval ok)', sources });
  } catch (err: any) {
    console.error('respond error', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// ---------- Boot ----------
(async () => {
  await initPg();
  await ensureCollection('teachings');
  app.listen(PORT, () => {
    console.log(`MGM listening on http://127.0.0.1:${PORT}`);
  });
})();
