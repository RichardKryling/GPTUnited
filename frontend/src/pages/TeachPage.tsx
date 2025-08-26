import { useEffect, useMemo, useState } from 'react';
import { apiTeach } from '../api';
import { TaughtStore } from '../store';
import { TaughtItem } from '../types';

type Scope = 'session'|'global'|'all';

function fmt(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function TeachPage({ session }: { session: string }) {
  // left pane state
  const [filterScope, setFilterScope] = useState<Scope>('all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<TaughtItem[]>([]);

  // right pane editor state
  const [editing, setEditing] = useState<TaughtItem | null>(null);
  const [text, setText] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [scope, setScope] = useState<'session'|'global'>('session');
  const [status, setStatus] = useState('');

  // load items for this session (and global if filter says so)
  function reload() {
    const all = TaughtStore.list(); // we’ll filter client-side for richer UX
    setItems(all);
  }
  useEffect(() => { reload(); }, [session]);

  // filtered+searched view
  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(it => {
        if (filterScope === 'session' && it.session !== session) return false;
        if (filterScope === 'global' && it.scope !== 'global') return false;
        if (filterScope !== 'all' && filterScope !== 'global' && it.session !== session) return false;
        if (!q) return true;
        return (
          it.text.toLowerCase().includes(q) ||
          it.tags.join(',').toLowerCase().includes(q) ||
          it.id.toLowerCase().includes(q)
        );
      })
      .sort((a,b)=>b.at-a.at);
  }, [items, filterScope, query, session]);

  // chips from tags string
  const tags = useMemo(
    () => tagsStr.split(',').map(s=>s.trim()).filter(Boolean),
    [tagsStr]
  );

  // when picking an item to edit
  function pick(it: TaughtItem) {
    setEditing(it);
    setText(it.text);
    setTagsStr(it.tags.join(', '));
    setScope(it.scope);
  }

  function resetForm() {
    setEditing(null);
    setText('');
    setTagsStr('');
    setScope('session');
    setStatus('');
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      let id = editing?.id;
      if (!id) {
        // create through backend, then persist locally
        const res = await apiTeach(text.trim(), tags, scope, session);
        id = res.id;
      }
      const item: TaughtItem = {
        id: id!,
        text: text.trim(),
        tags,
        scope,
        session,
        at: editing?.at ?? Date.now(),
      };
      TaughtStore.upsert(item);
      setStatus(`Saved (id=${id!.slice(0,8)}…)`);
      setEditing(item);
      reload();
    } catch (err: any) {
      setStatus(`Error: ${err?.message || String(err)}`);
    }
  }

  function onDelete(it: TaughtItem) {
    if (!confirm(`Delete taught item ${it.id.slice(0,8)}…?`)) return;
    TaughtStore.remove(it.id);
    if (editing?.id === it.id) resetForm();
    reload();
  }

  return (
    <div className="teach2">
      {/* LEFT: list / filters */}
      <aside className="teach2-left">
        <div className="teach2-head">
          <div className="t2-title">Taught Items</div>
          <div className="t2-sub">Session <code className="code-inline">{session}</code></div>
        </div>
        <div className="t2-controls">
          <input
            className="t2-input"
            placeholder="Search text, tags, or id…"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <select
            className="t2-select"
            value={filterScope}
            onChange={e=>setFilterScope(e.target.value as Scope)}
            title="Scope filter"
          >
            <option value="all">all</option>
            <option value="session">this session</option>
            <option value="global">global</option>
          </select>
        </div>

        <div className="t2-list">
          {view.length === 0 && (
            <div className="t2-empty">
              No taught items yet. Use the editor → to add knowledge.
            </div>
          )}
          {view.map(it => (
            <div
              key={it.id}
              className={`t2-item ${editing?.id === it.id ? 'active' : ''}`}
              onClick={()=>pick(it)}
            >
              <div className="t2-row">
                <span className={`pill ${it.scope === 'global' ? 'pill-global' : ''}`}>
                  {it.scope}
                </span>
                <span className="t2-id">{it.id.slice(0,8)}…</span>
                <span className="t2-date">{fmt(it.at)}</span>
              </div>
              <div className="t2-text">{it.text.slice(0,140)}{it.text.length>140?'…':''}</div>
              <div className="t2-tags">
                {it.tags.length === 0 ? <span className="chip chip-empty">no tags</span> :
                  it.tags.map((t,i)=>(<span className="chip" key={i}>{t}</span>))}
              </div>
              <div className="t2-actions">
                <button className="ghost" onClick={(e)=>{e.stopPropagation(); pick(it);}}>Edit</button>
                <button className="ghost danger" onClick={(e)=>{e.stopPropagation(); onDelete(it);}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT: editor */}
      <section className="teach2-right">
        <div className="t2-editor card">
          <div className="t2-editor-head">
            <div className="t2-title">{editing ? 'Edit Taught Item' : 'New Taught Item'}</div>
            {editing && <div className="t2-sub">id <code className="code-inline">{editing.id}</code></div>}
          </div>

          <form className="t2-form" onSubmit={onSave}>
            <label className="t2-label">Text</label>
            <textarea
              className="t2-textarea"
              placeholder="Knowledge to store…"
              value={text}
              onChange={e=>setText(e.target.value)}
              required
            />

            <label className="t2-label">Tags</label>
            <input
              className="t2-input"
              placeholder="Comma separated (e.g. project,alpha)"
              value={tagsStr}
              onChange={e=>setTagsStr(e.target.value)}
            />
            <div className="t2-tagchips">
              {tags.map((t,i)=>(<span className="chip" key={i}>{t}</span>))}
              {tags.length===0 && <span className="chip chip-empty">no tags</span>}
            </div>

            <div className="t2-row">
              <div>
                <label className="t2-label">Scope</label>
                <select
                  className="t2-select"
                  value={scope}
                  onChange={e=>setScope(e.target.value as 'session'|'global')}
                >
                  <option value="session">session</option>
                  <option value="global">global</option>
                </select>
              </div>
              <div className="t2-grow" />
              <div className="t2-buttons">
                {editing && <button type="button" className="ghost" onClick={resetForm}>New</button>}
                <button type="submit" className="primary">Save (⌘/Ctrl+Enter)</button>
              </div>
            </div>
          </form>

          <div className="teach-status">{status}</div>
        </div>
      </section>
    </div>
  );
}
