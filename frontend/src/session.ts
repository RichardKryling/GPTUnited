const KEY = 'gptu.sid';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'sid-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

export function getSessionId(): string {
  try {
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = uuid();
      localStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return uuid();
  }
}
