export default function SideNav() {
  return (
    <aside className="w-60 bg-gradient-to-b from-[#0b0f14] via-[#0c1320] to-[#0e1a2c] border-r border-zinc-800/60">
      <div className="px-4 py-4 text-zinc-300 text-sm">
        <div className="text-zinc-100 font-semibold mb-2">Navigation</div>
        <nav className="space-y-1">
          <a className="block rounded-md px-3 py-2 bg-blue-600/15 text-blue-300 border border-blue-500/20">Chat</a>
          <a className="block rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800/40">Teach</a>
          <a className="block rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800/40">Health</a>
        </nav>
      </div>
    </aside>
  );
}
