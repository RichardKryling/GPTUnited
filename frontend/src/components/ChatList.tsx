import { ChatItem } from '../types';

export default function ChatList({
  chats,
  activeId,
  onPick
}: {
  chats: ChatItem[];
  activeId?: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="chatlist">
      <div className="cl-tabs">
        <button className="tab active">SESSIONS ({chats.length})</button>
        <button className="tab" onClick={(e)=>e.preventDefault()}>New</button>
      </div>
      <div className="cl-scroll">
        {chats.length === 0 && (
          <div style={{opacity:.7, fontSize:13, padding:'10px 8px'}}>
            No sessions yet.
          </div>
        )}
        {chats.map(c => (
          <button
            key={c.id}
            className={`cl-row ${activeId === c.id ? 'active' : ''}`}
            onClick={() => onPick(c.id)}
          >
            <div className="cl-main">
              <div className="cl-top">
                <span className="name">{c.name}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
