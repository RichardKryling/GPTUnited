import TopBar from './ui/TopBar';
import SideNav from './ui/SideNav';
import ChatPanel from './ui/ChatPanel';
import TeachPanel from './ui/TeachPanel';
import { getSessionId } from './logic/session';

export default function App() {
  const sid = getSessionId();
  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100">
      <TopBar />
      <div className="flex">
        <SideNav />
        <main className="flex-1 p-6">
          <div className="text-xs text-zinc-400 mb-4">Session: <code>{sid}</code></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChatPanel />
            </div>
            <div className="lg:col-span-1">
              <TeachPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
