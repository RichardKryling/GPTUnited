import { io, Socket } from 'socket.io-client';

export function connectWs(base = (import.meta.env.VITE_API_URL as string) || ''): Socket {
  // If BASE is '', WS will hit the same origin where Vite proxy exposes /ws in dev
  const url = `${base}/ws`;
  const sock = io(url, { transports: ['websocket'], autoConnect: true });
  return sock;
}
