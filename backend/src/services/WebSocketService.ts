import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthUser } from '../types';
import { logger } from '../utils/logger';

interface SocketData {
  user: AuthUser;
}

interface AuthenticatedSocket extends Socket {
  data: SocketData;
}

class WebSocketService {
  private io!: SocketServer;
  private userSockets: Map<number, Set<string>> = new Map();

  initialize(httpServer: HttpServer): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Auth middleware — verify JWT on connection
    this.io.use((socket: Socket, next: (err?: Error) => void) => {
      const token =
        (socket.handshake.auth.token as string) ||
        (socket.handshake.query.token as string);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const user = socket.data.user;
      const workspaceId = user.workspaceId;

      logger.info(`Socket connected: ${socket.id} (user: ${user.id})`);

      // Join workspace room
      socket.join(`workspace:${workspaceId}`);

      // Join user-specific room for direct messages
      socket.join(`user:${user.id}`);

      // Track user sockets for presence
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(socket.id);

      // Broadcast user presence to workspace
      this.io.to(`workspace:${workspaceId}`).emit('user:online', {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // Board subscription management
      socket.on('board:subscribe', (boardId: number) => {
        socket.join(`board:${boardId}`);
        logger.debug(`Socket ${socket.id} subscribed to board:${boardId}`);
      });

      socket.on('board:unsubscribe', (boardId: number) => {
        socket.leave(`board:${boardId}`);
        logger.debug(`Socket ${socket.id} unsubscribed from board:${boardId}`);
      });

      // User presence — disconnect
      socket.on('disconnect', (reason: string) => {
        logger.info(`Socket disconnected: ${socket.id} (${reason})`);

        // Remove from tracked sockets
        const sockets = this.userSockets.get(user.id);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(user.id);
            // Only broadcast offline when all sockets for the user are gone
            this.io.to(`workspace:${workspaceId}`).emit('user:offline', {
              userId: user.id,
            });
          }
        }
      });
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Broadcast an event to everyone subscribed to a specific board.
   */
  emitToBoard(boardId: number, event: string, data: unknown): void {
    this.io.to(`board:${boardId}`).emit(event, data);
  }

  /**
   * Broadcast an event to everyone in a workspace.
   */
  emitToWorkspace(workspaceId: number, event: string, data: unknown): void {
    this.io.to(`workspace:${workspaceId}`).emit(event, data);
  }

  /**
   * Send an event to a specific user (all their connected sockets).
   */
  emitToUser(userId: number, event: string, data: unknown): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Check whether a given user is currently connected.
   */
  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Return the underlying Socket.io server instance.
   */
  getIO(): SocketServer {
    return this.io;
  }
}

export const wsService = new WebSocketService();
export default wsService;
