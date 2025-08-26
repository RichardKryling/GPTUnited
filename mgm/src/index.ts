import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';

// ---- env ----
const PORT = Number(process.env.PORT ?? 8090);
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://gptu:gptu@127.0.0.1:5432/gptu';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ---- app ----
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---- db ----
const pool = new Pool({ connectionString: DATABASE_URL });

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
  await pool.query(`
    CREATE INDEX IF NOT EXISTS teachings_scope_created_idx
      ON teachings(scope, created_at DESC);
  `);
}
initDb().catch(err => {
  console.error('DB init failed', err);
  process.exit(1);
});

// ---- openai client (optional) ----
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ---- tiny local scoring (stand-in until vectors) ----
// simple overlap-based “score” in [0,1]
function cheapScore(query: string, text: string): number {
  const q = new Set(
    query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  );
  if (q.size === 0) return 0;
  const t = new Set(
    text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  );
  let hit = 0;
  for (const w of q) if (t.has(w)) hit++;
  return Math.min(1, hit / Math.max(3, q.size)); // soften small queries
}

// ---- health ----
app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({
      ok: true,
      db: 'up',
      qdrant: 'up',         // placeholder; swap when you wire Qdrant health
      usesOpenAI: !!OPENAI_API_KEY
    });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'down', error: (e as Error).message });
  }
});

// ---- teach ----
app.post('/teach', async (req, res) => {
  try {
    const { text, tags, scope = 'session', session: sid } = req.body ?? {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    if (!['global', 'session'].includes(scope)) {
      return res.status(400).json({ error: "scope must be 'global' or 'session'" });
    }
    const id = randomUUID();
    const arrTags: string[] = Array.isArray(tags)
      ? tags.filter((x: any) => typeof x === 'string')
      : [];
    await pool.query(
      `insert into teachings (id, text, tags, scope, session_id)
       values ($1,$2,$3,$4,$5)`,
      [id, text, arrTags, scope, sid || null]
    );
    res.json({ ok: true, id });
  } catch (err) {
    console.error('teach failed', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// ---- respond (local >=0.7 else OpenAI; save AI >=0.6 to global) ----
app.post('/respond', async (req, res) => {
  const { input, session: sid } = req.body ?? {};
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'input required' });
  }

  try {
    // 1) local retrieval: recent global+session
    const r = await pool.query(
      `select * from teachings
       where scope in ('global','session')
       order by created_at desc
       limit 50`
    );

    const ranked = r.rows
      .map(row => ({ ...row, score: cheapScore(input, row.text) }))
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    if (top && top.score >= 0.7) {
      return res.json({
        reply: top.text,
        sources: ranked.slice(0, 4)
      });
    }

    // 2) fallback to OpenAI
    if (!openai) {
      return res.json({
        reply: 'stub (no OpenAI key configured)',
        sources: ranked.slice(0, 4)
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are MGM. Be concise and accurate.' },
        { role: 'user', content: input }
      ]
    });

    const aiText =
      completion.choices?.[0]?.message?.content?.trim() ||
      'Sorry, no answer.';
    // TEMP: set pseudo-confidence. Replace with vector similarity soon.
    const aiScore = 0.65;

    if (aiScore >= 0.6) {
      const id = randomUUID();
      await pool.query(
        `insert into teachings (id, text, tags, scope, session_id)
         values ($1,$2,$3,$4,$5)`,
        [id, aiText, ['ai_reply'], 'global', sid || null]
      );
    }

    return res.json({
      reply: aiText,
      sources: ranked.slice(0, 4)
    });
  } catch (err) {
    console.error('respond failed', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// ---- start ----
app.listen(PORT, () => {
  console.log(`MGM listening on http://127.0.0.1:${PORT}`);
});
