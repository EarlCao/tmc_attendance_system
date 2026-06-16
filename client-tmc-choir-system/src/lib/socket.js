import { io } from 'socket.io-client';

// In production (Vercel), VITE_API_URL is set to the Render backend URL e.g. https://tmc-choir-backend.onrender.com
// In development, Vite's dev proxy forwards /socket.io to the backend
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  // Only connect once we have a token; the server rejects unauthenticated sockets.
  autoConnect: false,
  withCredentials: true,
  // Read the latest token at (re)connect time so it stays in sync with login/logout.
  auth: (cb) => cb({ token: localStorage.getItem('token') }),
});

// Connect the socket with the current token (call after login).
export const connectSocket = () => {
  if (!localStorage.getItem('token')) return;
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};

// Disconnect the socket (call on logout).
export const disconnectSocket = () => {
  socket.disconnect();
};

// Connect immediately if a token already exists (e.g. on page reload).
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  socket.connect();
}

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
