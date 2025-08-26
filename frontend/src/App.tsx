import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { apiChat } from './api';
import { getSessionId } from './session';
import { ChatItem, Message } from './types';
import { connectWs } from './socket';
import TeachPage from './pages/TeachPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const mySid = useMemo(() => getSessionId(), []);
  const [wsReady, setWsReady] = useState(false);

  // sessions (chat list)
  const [sessions, setSessions] = useState<ChatItem[]>([{ id: mySid, name: mySid }]);
  const [activeId, setActiveId] = useState<string>(mySid);
  const [page, setPage] = useState<string>('Chat');

  // messages keyed by session
  const [messagesBySession, setMessagesBySession] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = connectWs((import.meta.env.VITE_API_URL as string) || '');
    s.on('ready', () => setWsReady(true));
    const iv = setInterval(() => s.emit('ping', { t: Date.now() }), 8000);
    return () => { clearInterval(iv); s.close(); };
  }, []);

  const activeMsgs = messagesBySession[activeId] || [];

  async function sendChat(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const me: Message = { id: crypto.randomUUID(), role: 'user', text, at: Date.now() };
    setMessagesBySession(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), me] }));
    setInput('');
    setBusy(true);
    try {
      const res = await apiChat(text, undefined, activeId);
      const bot: Message = { id: crypto.randomUUID(), role: 'assistant', text: String(res?.reply ?? 'stub'), at: Date.now() };
      setMessagesBySession(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), bot] }));
    } catch (err: any) {
      const bot: Message = { id: crypto.randomUUID(), role: 'assistant', text: `Error: ${err?.message||String(err)}`, at: Date.now() };
      setMessagesBySession(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), bot] }));
    } finally {
      setBusy(false);
    }
  }

  function newSession() {
    const sid = crypto.randomUUID();
    setSessions(prev => [...prev, { id: sid, name: sid }]);
    setActiveId(sid);
  }

  function onKeyDownComposer(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = (e.currentTarget.closest('form') as HTMLFormElement | null);
      form?.requestSubmit();
    }
  }

  return (
    <div className="layout">
      <Sidebar onSelect={(k)=>{ if (k==='Admin') setPage('Admin'); else setPage(k); }}/>
      <main className="main">
        <div className="topbar">
          <div className="tb-left">
            <button className="hamburger" title="Menu">☰</button>
            <h1>{page}</h1>
          </div>
          <div className="tb-right">
            <button className="pill" onClick={()=>setPage('Admin')}>Admin</button>
            <span className={`pill ${wsReady ? 'ok' : 'warn'}`}>{wsReady ? 'WS ready' : 'WS…'}</span>
            {page==='Chat' && <button className="pill" onClick={newSession}>+ New Session</button>}
          </div>
        </div>

        {page === 'Chat' ? (
          <div className="cols">
            <div className="mid">
              <ChatList chats={sessions} activeId={activeId} onPick={setActiveId}/>
            </div>
            <div className="right">
              <ChatWindow title={activeId || 'Conversation'} messages={activeMsgs}/>
              <form className="composer" onSubmit={sendChat}>
                <input
                  placeholder="Type your message…"
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={onKeyDownComposer}
                />
                <button type="submit" disabled={!input.trim() || busy}>{busy ? '…' : '➤'}</button>
              </form>
            </div>
          </div>
        ) : page === 'Teach' ? (
          <div className="cols">
            <div className="mid">
              <div className="card" style={{padding:12}}>Use the right panel to teach and manage items.</div>
            </div>
            <div className="right">
              <TeachPage session={activeId}/>
            </div>
          </div>
        ) : page === 'Admin' ? (
          <div className="cols"><div className="mid"></div><div className="right"><AdminPage/></div></div>
        ) : (
          <div className="cols"><div className="mid"><div className="card" style={{padding:12}}>Coming soon.</div></div><div className="right"></div></div>
        )}
      </main>
    </div>
  );
}
