import { io } from 'socket.io-client';

// In production (Vercel), VITE_API_URL is set to the Render backend URL e.g. https://tmc-choir-backend.onrender.com
// In development, Vite's dev proxy forwards /socket.io to the backend
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

const socket = io(SOCKET_URL, {
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
