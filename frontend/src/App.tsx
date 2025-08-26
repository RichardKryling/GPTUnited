import { useMemo, useState } from 'react';
import { getSessionId } from './session';
import { apiChat, apiTeach } from './api';

export default function App() {
  const sid = useMemo(() => getSessionId(), []);
  const [input, setInput] = useState('');
  const [teachText, setTeachText] = useState('');
  const [tags, setTags] = useState('');
  const [scope, setScope] = useState<'global' | 'session'>('session');
  const [reply, setReply] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [teachOk, setTeachOk] = useState<string>('');

  async function onSendChat(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setReply('');
    try {
      const data = await apiChat(input.trim(), undefined, sid);
      setReply(data?.reply ?? '');
    } catch (err: any) {
      setReply(`Error: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function onTeach(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTeachOk('');
    try {
      const t = tags
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const data = await apiTeach(teachText.trim(), t, scope, sid);
      setTeachOk(data.ok ? `ok (id=${data.id})` : 'failed');
      if (data.ok) setTeachText('');
    } catch (err: any) {
      setTeachOk(`Error: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>GPTUnited — Frontend Sprint 1</h1>
        <div className="sid">Session: <code>{sid}</code></div>
      </header>

      <section className="card">
        <h2>Chat</h2>
        <form onSubmit={onSendChat}>
          <label>
            Message
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something…"
              required
            />
          </label>
          <button type="submit" disabled={busy || !input.trim()}>
            {busy ? 'Sending…' : 'Send'}
          </button>
        </form>
        <div className="reply">
          <strong>Reply:</strong>
          <pre>{reply}</pre>
        </div>
      </section>

      <section className="card">
        <h2>Teach</h2>
        <form onSubmit={onTeach}>
          <label>
            Text
            <textarea
              value={teachText}
              onChange={(e) => setTeachText(e.target.value)}
              placeholder="Knowledge to store…"
              required
            />
          </label>
          <div className="row">
            <label>
              Tags (comma-sep)
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="project,alpha"
              />
            </label>
            <label>
              Scope
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as 'global' | 'session')}
              >
                <option value="session">session</option>
                <option value="global">global</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={busy || !teachText.trim()}>
            {busy ? 'Sending…' : 'Teach'}
          </button>
        </form>
        <div className="status">{teachOk && <span><strong>Result:</strong> {teachOk}</span>}</div>
      </section>
    </div>
  );
}
