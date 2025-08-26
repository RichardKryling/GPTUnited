import { useEffect, useRef } from 'react';
import { Message } from '../types';

export default function ChatWindow({
  title,
  messages,
}: {
  title: string;
  messages: Message[];
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="chatwin">
      <div className="cw-top">
        <div className="cw-title">{title}</div>
        <div className="cw-actions">
          <button className="ghost" title="Call">📞</button>
          <button className="ghost" title="Video">🎥</button>
          <button className="ghost" title="More">⋯</button>
        </div>
      </div>
      <div className="cw-scroll">
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="bubble">
              <div className="text">{m.text}</div>
              <div className="meta">{new Date(m.at).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
    </div>
  );
}
