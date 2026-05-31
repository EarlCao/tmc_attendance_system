import { io } from 'socket.io-client';

// The socket connects to the same origin as the page.
// In dev, Vite proxies /socket.io to the backend.
// In production (Docker), the frontend and backend share the same origin via nginx or Vite preview proxy.
const socket = io({
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  autoConnect: true,
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('[Socket.IO] Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket.IO] Disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.error('[Socket.IO] Connection error:', err.message);
});

export default socket;
