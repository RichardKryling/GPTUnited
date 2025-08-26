import { FiMessageSquare, FiBookOpen, FiUsers, FiBarChart2, FiGithub, FiShield, FiSettings } from 'react-icons/fi';

const items = [
  { key: 'Chat',        icon: <FiMessageSquare/> },
  { key: 'Teach',       icon: <FiBookOpen/> },
  { key: 'Work Groups', icon: <FiUsers/> },
  { key: 'Analytics',   icon: <FiBarChart2/> },
  { key: 'GitHub',      icon: <FiGithub/> },
  { key: 'Admin',       icon: <FiShield/> },
  { key: 'Settings',    icon: <FiSettings/> }
];

export default function Sidebar({
  current,
  onSelect
}: {
  current?: string;
  onSelect?: (key: string) => void;
}) {
  return (
    <aside className="sb">
      <div className="brand">GPTUnited</div>
      <nav className="sb-nav">
        {items.map((it) => {
          const active = current === it.key;
          return (
            <button
              key={it.key}
              className={`sb-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect?.(it.key)}
            >
              <span className="sb-icon">{it.icon}</span>
              <span className="sb-label">{it.key}</span>
            </button>
          );
        })}
      </nav>
      <div className="sb-footer">Terms &amp; Conditions</div>
    </aside>
  );
}
