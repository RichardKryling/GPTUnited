import { useState } from 'react';
import { apiChat, apiTeach } from './api';
import { getSessionId } from './session';
import type { Source } from './types';

function SourcesList({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 text-sm text-zinc-300">
      <div className="font-semibold text-zinc-200">Sources:</div>
      <ul className="list-disc ml-5 mt-1 space-y-1">
        {sources.map((s, i) => (
          <li key={(s.id ?? '') + i}>
            <span className="text-zinc-100">{s.text ?? '(no text)'}</span>
            {typeof s.score === 'number' && (
              <span className="ml-2 text-zinc-400">[score: {s.score.toFixed(3)}]</span>
            )}
            {s.tags && s.tags.length > 0 && (
              <span className="ml-2 text-zinc-400">tags: {s.tags.join(', ')}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState<string>('');
  const [sources, setSources] = useState<Source[] | undefined>(undefined);

  const [teachText, setTeachText] = useState('');
  const [teachTags, setTeachTags] = useState('project,alpha');
  const [teachScope, setTeachScope] = useState<'global'|'session'>('session');
  const [teachRes, setTeachRes] = useState<string>('');

  const sid = getSessionId();

  async function onSend() {
    if (!input.trim()) return;
    setReply('…');
    setSources(undefined);
    try {
      const res = await apiChat(input);
      setReply(res.reply ?? '(no reply)');
      setSources(res.sources);
    } catch (e: any) {
      setReply('Error: ' + (e?.message ?? 'unknown'));
    }
  }

  async function onTeach() {
    if (!teachText.trim()) return;
    setTeachRes('…');
    try {
      const res = await apiTeach(teachText, teachTags, teachScope);
      setTeachRes(res.ok ? `ok (id=${res.id})` : 'failed');
      setTeachText('');
    } catch (e: any) {
      setTeachRes('Error: ' + (e?.response?.status ? `Request failed with status code ${e.response.status}` : (e?.message ?? 'unknown')));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-1">GPTUnited — Frontend Sprint 1</h1>
        <div className="text-xs text-zinc-400 mb-6">Session: <code>{sid}</code></div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-8">
          <div className="text-xl font-semibold mb-3">Chat</div>
          <label className="block text-sm text-zinc-400 mb-1">Message</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something…"
            className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <button
            onClick={onSend}
            className="mt-3 inline-flex items-center rounded-md bg-zinc-200 text-zinc-900 px-3 py-1.5 text-sm font-medium hover:bg-white"
          >
            Send
          </button>

          <div className="mt-4">
            <div className="font-semibold">Reply:</div>
            <div className="mt-1 whitespace-pre-wrap text-zinc-100">{reply}</div>
            <SourcesList sources={sources} />
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <div className="text-xl font-semibold mb-3">Teach</div>

          <label className="block text-sm text-zinc-400 mb-1">Text</label>
          <textarea
            value={teachText}
            onChange={(e) => setTeachText(e.target.value)}
            rows={3}
            placeholder="Knowledge to store…"
            className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-end">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Tags (comma-sep)</label>
              <input
                value={teachTags}
                onChange={(e) => setTeachTags(e.target.value)}
                className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Scope</label>
              <select
                value={teachScope}
                onChange={(e) => setTeachScope(e.target.value as 'global'|'session')}
                className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="session">session</option>
                <option value="global">global</option>
              </select>
            </div>
          </div>

          <button
            onClick={onTeach}
            className="mt-3 inline-flex items-center rounded-md bg-zinc-200 text-zinc-900 px-3 py-1.5 text-sm font-medium hover:bg-white"
          >
            Teach
          </button>

          <div className="mt-3 text-sm text-zinc-300">
            <span className="font-semibold text-zinc-200">Result:</span> {teachRes}
          </div>
        </div>
      </div>
    </div>
  );
}
