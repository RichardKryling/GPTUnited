import { TaughtItem } from './types';
const KEY = 'gptu.taught.v1';

function load(): TaughtItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(arr: TaughtItem[]) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} }

export const TaughtStore = {
  list(filter?: Partial<Pick<TaughtItem, 'session'|'scope'>>): TaughtItem[] {
    let all = load();
    if (filter?.session) all = all.filter(x => x.session === filter.session);
    if (filter?.scope) all = all.filter(x => x.scope === filter.scope);
    return all.sort((a,b)=>a.at-b.at);
  },
  upsert(item: TaughtItem) {
    const all = load();
    const i = all.findIndex(x => x.id === item.id);
    if (i >= 0) all[i] = item; else all.push(item);
    save(all);
  },
  remove(id: string) {
    save(load().filter(x => x.id !== id));
  }
};
