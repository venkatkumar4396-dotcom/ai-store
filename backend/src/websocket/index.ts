import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken, JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';
import { whatsappService } from '../services/whatsapp.service';
import { fileTrackerService } from '../services/fileTracker.service';
import env from '../config/env';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export function initWebSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const isAllowed =
          env.NODE_ENV === 'development' ||
          origin === env.CORS_ORIGIN ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.endsWith('.devtunnels.ms');
        if (isAllowed) {
          callback(null, origin);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach Socket.IO to the services
  whatsappService.setSocketIO(io);
  fileTrackerService.setSocketIO(io);

  // Authentication Middleware for Socket.IO
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;

      // Check cookies for token fallback
      if (!token && socket.handshake.headers.cookie) {
        const cookies: Record<string, string> = {};
        socket.handshake.headers.cookie.split(';').forEach((item) => {
          const parts = item.split('=');
          const name = parts[0].trim();
          if (name) {
            cookies[name] = parts.slice(1).join('=').trim();
          }
        });
        if (cookies.nexora_token) {
          token = cookies.nexora_token;
        }
      }

      if (!token) {
        logger.warn(`Socket connection rejected: No token provided (socket ID: ${socket.id})`);
        return next(new Error('Authentication error: Token required'));
      }

      const payload = verifyToken(token as string);
      socket.user = payload;
      next();
    } catch (err: any) {
      logger.warn(`Socket connection rejected: Invalid token (socket ID: ${socket.id}): ${err.message}`);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    const roomName = `user:${userId}`;
    socket.join(roomName);
    logger.info(`User ${userId} (socket ID: ${socket.id}) connected and joined room ${roomName}`);

    // Listen for client-side events if any, routing or handling them accordingly
    socket.on('ping_connection', (data) => {
      socket.emit('pong_connection', { timestamp: new Date(), ...data });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`User ${userId} (socket ID: ${socket.id}) disconnected: ${reason}`);
    });
  });

  return io;
}
