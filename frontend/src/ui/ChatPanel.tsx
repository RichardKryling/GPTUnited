import { useState } from 'react';
import { apiChat } from '../logic/api';
import SourcesList from './SourcesList';
import type { Source } from '../logic/types';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState<string>('');
  const [sources, setSources] = useState<Source[] | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function onSend() {
    if (!input.trim() || busy) return;
    setBusy(true);
    setReply('…');
    setSources(undefined);
    try {
      const res = await apiChat(input);
      setReply(res.reply ?? '(no reply)');
      setSources(res.sources);
    } catch (e: any) {
      setReply('Error: ' + (e?.message ?? 'unknown'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-[#0c1320] p-4">
      <div className="text-lg font-semibold text-zinc-100 mb-3">Chat</div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message…"
        className="w-full rounded-md bg-[#0b0f14] border border-zinc-800 px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 text-zinc-100"
      />
      <button
        onClick={onSend}
        className="mt-3 inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
        disabled={busy}
      >
        Send
      </button>
      <div className="mt-4">
        <div className="font-semibold text-zinc-200">Reply</div>
        <div className="mt-1 whitespace-pre-wrap text-zinc-100">{reply}</div>
        <SourcesList sources={sources} />
      </div>
    </div>
  );
}
