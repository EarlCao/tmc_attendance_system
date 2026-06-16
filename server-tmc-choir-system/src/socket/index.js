import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

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

  // Authenticate every socket connection with the same JWT used for the REST API.
  // Sockets broadcast member/auditionee PII, so unauthenticated connections must
  // be rejected during the handshake.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('Unauthorized: missing token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, ... }
      next();
    } catch (_err) {
      next(new Error('Unauthorized: invalid token'));
    }
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

/** Broadcast to ALL connected clients (safe: no-op if socket not yet ready) */
export const emit = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/** Broadcast to a specific room only (safe: no-op if socket not yet ready) */
export const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

// ─── Prisma socket-aware extension ───────────────────────────────────────────
// Wraps a Prisma client so every mutation automatically fires the matching
// Socket.IO broadcast — keeping controllers free of any socket imports.

export const createSocketAwarePrisma = (baseClient) => {
  return baseClient.$extends({
    query: {
      member: {
        async create({ args, query }) {
          const result = await query(args);
          emit('member:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          // Skip internal attendance-rate note updates (only `notes` field touched)
          const keys = Object.keys(args.data || {});
          if (!(keys.length === 1 && keys[0] === 'notes')) {
            emit('member:updated', result);
          }
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('member:deleted', { id: result.id });
          return result;
        },
      },

      officer: {
        async create({ args, query }) {
          const result = await query(args);
          emit('officer:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          emit('officer:updated', result);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('officer:deleted', { id: result.id });
          return result;
        },
      },

      judge: {
        async create({ args, query }) {
          const result = await query(args);
          emit('judge:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          emit('judge:updated', result);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('judge:deleted', { id: result.id });
          return result;
        },
      },

      auditionee: {
        async create({ args, query }) {
          const result = await query(args);
          emit('auditionee:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          const keys = Object.keys(args.data || {});
          if (keys.length === 1 && keys[0] === 'averageRating') {
            emit('auditionee:evaluated', { auditioneeId: result.id, averageRating: result.averageRating });
          } else if (keys.length === 1 && keys[0] === 'status') {
            emit('auditionee:statusChanged', result);
          } else {
            emit('auditionee:updated', result);
          }
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('auditionee:deleted', { id: result.id });
          return result;
        },
      },

      session: {
        async create({ args, query }) {
          const result = await query(args);
          emit('session:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          emit('session:updated', result);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('session:deleted', { id: result.id });
          return result;
        },
      },

      semester: {
        async create({ args, query }) {
          const result = await query(args);
          emit('semester:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          const keys = Object.keys(args.data || {});
          if (keys.length === 1 && keys[0] === 'endDate') {
            emit('semester:ended', result);
          } else {
            emit('semester:updated', result);
          }
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('semester:deleted', { id: result.id });
          return result;
        },
      },

      ruleRegulation: {
        async create({ args, query }) {
          const result = await query(args);
          emit('rule:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          emit('rule:updated', result);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('rule:deleted', { id: result.id });
          return result;
        },
      },

      evaluationCategory: {
        async create({ args, query }) {
          const result = await query(args);
          emit('category:created', result);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          emit('category:updated', result);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('category:deleted', { id: result.id });
          return result;
        },
      },

      user: {
        async create({ args, query }) {
          const result = await query(args);
          const { passwordHash, ...safeUser } = result;
          emit('user:created', safeUser);
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          const { passwordHash, ...safeUser } = result;
          emit('user:updated', safeUser);
          return result;
        },
        async delete({ args, query }) {
          const result = await query(args);
          emit('user:deleted', { id: result.id });
          return result;
        },
      },

      attendanceRecord: {
        async upsert({ args, query }) {
          const result = await query(args);
          emitToRoom(`session:${result.sessionId}`, 'attendance:updated', {
            sessionId: result.sessionId,
            record: result,
          });
          emit('attendance:saved', { sessionId: result.sessionId });
          return result;
        },
        async update({ args, query }) {
          const result = await query(args);
          if (Object.keys(args.data || {}).includes('excuseStatus')) {
            emit('excuse:updated', {
              id: result.id,
              excuseStatus: result.excuseStatus,
              notes: result.notes || '',
            });
          }
          return result;
        },
      },
    },
  });
};
