import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer, frontendUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Allow clients to subscribe to named rooms for scoped updates
    socket.on('join:room', (room) => {
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:room', (room) => {
      socket.leave(room);
      console.log(`[Socket.IO] ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('[Socket.IO] Initialized');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket() first.');
  return io;
};

// ─── Broadcast helpers ───────────────────────────────────────────────────────

/** Broadcast to ALL connected clients */
export const emit = (event, data) => getIO().emit(event, data);

/** Broadcast to a specific room only */
export const emitToRoom = (room, event, data) => getIO().to(room).emit(event, data);
