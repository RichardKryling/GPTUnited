import { useState } from 'react';
import { apiTeach } from '../logic/api';

export default function TeachPanel() {
  const [text, setText] = useState('');
  const [tags, setTags] = useState('project,alpha');
  const [scope, setScope] = useState<'global'|'session'>('session');
  const [result, setResult] = useState<string>('');

  async function onTeach() {
    if (!text.trim()) return;
    setResult('…');
    try {
      const res = await apiTeach(text, tags, scope);
      setResult(res.ok ? `ok (id=${res.id})` : 'failed');
      setText('');
    } catch (e: any) {
      setResult('Error: ' + (e?.response?.status ? `Request failed with status code ${e.response.status}` : (e?.message ?? 'unknown')));
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#0c1320] p-4">
      <div className="text-lg font-semibold text-zinc-100 mb-3">Teach</div>

      <label className="block text-sm text-zinc-400 mb-1">Text</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Knowledge to store…"
        className="w-full rounded-md bg-[#0b0f14] border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 text-zinc-100"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-end">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Tags (comma-sep)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-md bg-[#0b0f14] border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'global'|'session')}
            className="w-full rounded-md bg-[#0b0f14] border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 text-zinc-100"
          >
            <option value="session">session</option>
            <option value="global">global</option>
          </select>
        </div>
      </div>

      <button
        onClick={onTeach}
        className="mt-3 inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
      >
        Teach
      </button>

      <div className="mt-3 text-sm">
        <span className="font-semibold text-zinc-200">Result:</span>
        <span className="ml-2 text-zinc-300">{result}</span>
      </div>
    </div>
  );
}
