import type { Source } from '../logic/types';

export default function SourcesList({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-sm font-semibold text-zinc-200">Sources</div>
      <ul className="mt-2 space-y-1 text-sm">
        {sources.map((s, i) => (
          <li key={(s.id ?? '') + i} className="text-zinc-300">
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
