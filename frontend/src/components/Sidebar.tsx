import { FiMessageSquare, FiBookOpen, FiUsers, FiBarChart2, FiGithub, FiShield, FiSettings } from 'react-icons/fi';

const items = [
  { key: 'Chat',        icon: <FiMessageSquare/>, active: true },
  { key: 'Teach',       icon: <FiBookOpen/> },
  { key: 'Work Groups', icon: <FiUsers/> },
  { key: 'Analytics',   icon: <FiBarChart2/> },
  { key: 'GitHub',      icon: <FiGithub/> },
  { key: 'Admin',       icon: <FiShield/> },
  { key: 'Settings',    icon: <FiSettings/> }
];

export default function Sidebar({ onSelect }: { onSelect?: (key: string)=>void }) {
  return (
    <aside className="sb">
      <div className="brand">GPTUnited</div>
      <nav className="sb-nav">
        {items.map((it, i) => (
          <button
            key={i}
            className={`sb-item ${it.active ? 'active' : ''}`}
            onClick={() => onSelect?.(it.key)}
          >
            <span className="sb-icon">{it.icon}</span>
            <span className="sb-label">{it.key}</span>
          </button>
        ))}
      </nav>
      <div className="sb-footer">Terms &amp; Conditions</div>
    </aside>
  );
}
