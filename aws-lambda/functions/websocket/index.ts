/**
 * WebSocket Server Implementation
 * Handles real-time communication for SSE updates, notifications, and live features
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { authHandler } from './auth.handler';
import { sseHandler } from './sse.handler';
import { notificationHandler } from './notification.handler';
import { authMiddleware } from './auth.middleware';

// Extend Socket interface to include userId
declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}

export interface WebSocketUser {
  userId: string;
  socketId: string;
  userRole: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: string[];
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    deviceType?: string;
  };
}

export interface WebSocketRoom {
  roomId: string;
  roomType: RoomType;
  participants: string[]; // User IDs
  metadata: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

export type RoomType =
  | 'user_private'
  | 'sse_updates'
  | 'notifications'
  | 'mentorship_session'
  | 'investor_matching'
  | 'partnership_updates'
  | 'gamification_events'
  | 'system_alerts'
  | 'admin_dashboard';

export interface WebSocketEvent {
  eventType: string;
  eventData: any;
  userId?: string;
  roomId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  connectionsByRole: Record<string, number>;
  connectionsByRoom: Record<string, number>;
  averageSessionDuration: number;
  messagesPerSecond: number;
  errorRate: number;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, WebSocketUser> = new Map();
  private activeRooms: Map<string, WebSocketRoom> = new Map();
  private connectionMetrics: ConnectionMetrics;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true
    });

    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      connectionsByRole: {},
      connectionsByRoom: {},
      averageSessionDuration: 0,
      messagesPerSecond: 0,
      errorRate: 0
    };

    this.initializeMiddleware();
    this.initializeEventHandlers();
    this.startHeartbeat();
  }

  /**
   * Initialize WebSocket middleware
   */
  private initializeMiddleware(): void {
    // Authentication middleware
    this.io.use(authMiddleware);

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const rateLimiter = this.createRateLimiter(socket.userId);
      if (rateLimiter.isAllowed()) {
        next();
      } else {
        next(new Error('Rate limit exceeded'));
      }
    });

    // Logging middleware
    this.io.use((socket, next) => {
      logger.info('WebSocket connection attempt', {
        socketId: socket.id,
        userId: socket.userId,
        userAgent: socket.handshake.headers['user-agent'],
        ipAddress: socket.handshake.address
      });
      next();
    });
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(socket: any): Promise<void> {
    const timer = performanceTimer('websocket_connection');

    try {
      const userId = socket.userId;
      const userRole = socket.userRole || 'user';

      // Create user session
      const webSocketUser: WebSocketUser = {
        userId,
        socketId: socket.id,
        userRole,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: [],
        metadata: {
          userAgent: socket.handshake.headers['user-agent'],
          ipAddress: socket.handshake.address,
          deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'])
        }
      };

      this.connectedUsers.set(socket.id, webSocketUser);
      this.updateConnectionMetrics('connect', userRole);

      // Join user to their private room
      const privateRoom = `user_${userId}`;
      socket.join(privateRoom);
      webSocketUser.rooms.push(privateRoom);

      // Join user to relevant rooms based on role and preferences
      await this.joinRelevantRooms(socket, webSocketUser);

      // Set up event handlers for this socket
      this.setupSocketEventHandlers(socket, webSocketUser);

      // Send welcome message with connection info
      socket.emit('connection_established', {
        socketId: socket.id,
        userId,
        rooms: webSocketUser.rooms,
        serverTime: new Date(),
        features: this.getAvailableFeatures(userRole)
      });

      timer.end();

      logger.info('WebSocket connection established', {
        socketId: socket.id,
        userId,
        userRole,
        rooms: webSocketUser.rooms.length
      });

    } catch (error) {
      timer.end();
      logger.error('WebSocket connection failed', {
        socketId: socket.id,
        error: (error as Error).message
      });
      socket.disconnect(true);
    }
  }

  /**
   * Set up event handlers for a socket
   */
  private setupSocketEventHandlers(socket: any, user: WebSocketUser): void {
    // Authentication events
    authHandler.setupHandlers(socket, user, this);

    // SSE-related events
    sseHandler.setupHandlers(socket, user, this);

    // Notification events
    notificationHandler.setupHandlers(socket, user, this);

    // General events
    socket.on('join_room', async (data: { roomId: string; roomType: RoomType }) => {
      await this.handleJoinRoom(socket, user, data.roomId, data.roomType);
    });

    socket.on('leave_room', async (data: { roomId: string }) => {
      await this.handleLeaveRoom(socket, user, data.roomId);
    });

    socket.on('send_message', async (data: { roomId: string; message: any }) => {
      await this.handleSendMessage(socket, user, data.roomId, data.message);
    });

    socket.on('heartbeat', () => {
      user.lastActivity = new Date();
      socket.emit('heartbeat_ack', { serverTime: new Date() });
    });

    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, user, reason);
    });

    socket.on('error', (error: Error) => {
      this.handleError(socket, user, error);
    });
  }

  /**
   * Handle user joining a room
   */
  private async handleJoinRoom(
    socket: any,
    user: WebSocketUser,
    roomId: string,
    roomType: RoomType
  ): Promise<void> {
    const timer = performanceTimer('websocket_join_room');

    try {
      // Validate room access
      const hasAccess = await this.validateRoomAccess(user, roomId, roomType);
      if (!hasAccess) {
        socket.emit('room_join_error', {
          roomId,
          error: 'Access denied to room'
        });
        return;
      }

      // Join the room
      socket.join(roomId);
      user.rooms.push(roomId);

      // Update or create room
      if (!this.activeRooms.has(roomId)) {
        const room: WebSocketRoom = {
          roomId,
          roomType,
          participants: [user.userId],
          metadata: {},
          createdAt: new Date(),
          lastActivity: new Date()
        };
        this.activeRooms.set(roomId, room);
      } else {
        const room = this.activeRooms.get(roomId)!;
        if (!room.participants.includes(user.userId)) {
          room.participants.push(user.userId);
        }
        room.lastActivity = new Date();
      }

      // Notify room about new participant
      socket.to(roomId).emit('user_joined_room', {
        roomId,
        userId: user.userId,
        userRole: user.userRole,
        timestamp: new Date()
      });

      // Send room info to user
      socket.emit('room_joined', {
        roomId,
        roomType,
        participants: this.activeRooms.get(roomId)?.participants.length || 1,
        timestamp: new Date()
      });

      timer.end();

      logger.info('User joined room', {
        socketId: socket.id,
        userId: user.userId,
        roomId,
        roomType
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to join room', {
        socketId: socket.id,
        userId: user.userId,
        roomId,
        error: (error as Error).message
      });

      socket.emit('room_join_error', {
        roomId,
        error: 'Failed to join room'
      });
    }
  }

  /**
   * Handle user leaving a room
   */
  private async handleLeaveRoom(socket: any, user: WebSocketUser, roomId: string): Promise<void> {
    const timer = performanceTimer('websocket_leave_room');

    try {
      // Leave the room
      socket.leave(roomId);
      user.rooms = user.rooms.filter(room => room !== roomId);

      // Update room participants
      const room = this.activeRooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter(id => id !== user.userId);
        room.lastActivity = new Date();

        // Remove room if empty
        if (room.participants.length === 0) {
          this.activeRooms.delete(roomId);
        }
      }

      // Notify room about participant leaving
      socket.to(roomId).emit('user_left_room', {
        roomId,
        userId: user.userId,
        timestamp: new Date()
      });

      socket.emit('room_left', {
        roomId,
        timestamp: new Date()
      });

      timer.end();

      logger.info('User left room', {
        socketId: socket.id,
        userId: user.userId,
        roomId
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to leave room', {
        socketId: socket.id,
        userId: user.userId,
        roomId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Handle sending message to room
   */
  private async handleSendMessage(
    socket: any,
    user: WebSocketUser,
    roomId: string,
    message: any
  ): Promise<void> {
    const timer = performanceTimer('websocket_send_message');

    try {
      // Validate user is in room
      if (!user.rooms.includes(roomId)) {
        socket.emit('message_error', {
          error: 'Not a member of this room'
        });
        return;
      }

      // Validate message
      if (!this.validateMessage(message)) {
        socket.emit('message_error', {
          error: 'Invalid message format'
        });
        return;
      }

      // Create message event
      const messageEvent: WebSocketEvent = {
        eventType: 'room_message',
        eventData: {
          messageId: this.generateMessageId(),
          roomId,
          senderId: user.userId,
          senderRole: user.userRole,
          content: message.content,
          messageType: message.type || 'text',
          metadata: message.metadata || {}
        },
        userId: user.userId,
        roomId,
        timestamp: new Date()
      };

      // Send to room participants
      this.io.to(roomId).emit('room_message', messageEvent.eventData);

      // Update room activity
      const room = this.activeRooms.get(roomId);
      if (room) {
        room.lastActivity = new Date();
      }

      // Update user activity
      user.lastActivity = new Date();

      timer.end();

      logger.info('Message sent to room', {
        socketId: socket.id,
        userId: user.userId,
        roomId,
        messageType: message.type || 'text'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send message', {
        socketId: socket.id,
        userId: user.userId,
        roomId,
        error: (error as Error).message
      });

      socket.emit('message_error', {
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnection(socket: any, user: WebSocketUser, reason: string): void {
    const timer = performanceTimer('websocket_disconnection');

    try {
      // Calculate session duration
      const sessionDuration = Date.now() - user.connectedAt.getTime();

      // Remove user from all rooms
      user.rooms.forEach(roomId => {
        const room = this.activeRooms.get(roomId);
        if (room) {
          room.participants = room.participants.filter(id => id !== user.userId);
          if (room.participants.length === 0 && !roomId.startsWith('user_')) {
            this.activeRooms.delete(roomId);
          }
        }

        // Notify room participants
        socket.to(roomId).emit('user_disconnected', {
          roomId,
          userId: user.userId,
          timestamp: new Date()
        });
      });

      // Remove user from connected users
      this.connectedUsers.delete(socket.id);
      this.updateConnectionMetrics('disconnect', user.userRole);

      timer.end();

      logger.info('WebSocket disconnection handled', {
        socketId: socket.id,
        userId: user.userId,
        reason,
        sessionDuration,
        roomsLeft: user.rooms.length
      });

    } catch (error) {
      timer.end();
      logger.error('Error handling disconnection', {
        socketId: socket.id,
        userId: user.userId,
        error: (error as Error).message
      });
    }
  }

  // Public methods for external services

  /**
   * Send SSE score update to user
   */
  async sendSSEUpdate(userId: string, sseData: {
    newScore: number;
    previousScore: number;
    components: Record<string, number>;
    improvements: string[];
    recommendations: string[];
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_sse_update');

    try {
      const event: WebSocketEvent = {
        eventType: 'sse_score_update',
        eventData: {
          ...sseData,
          timestamp: new Date(),
          changePercentage: ((sseData.newScore - sseData.previousScore) / sseData.previousScore) * 100
        },
        userId,
        timestamp: new Date()
      };

      // Send to user's private room
      this.io.to(`user_${userId}`).emit('sse_score_update', event.eventData);

      // Send to SSE updates room if user is subscribed
      this.io.to('sse_updates').emit('sse_score_broadcast', {
        userId,
        newScore: sseData.newScore,
        improvement: sseData.newScore - sseData.previousScore,
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE update sent', {
        userId,
        newScore: sseData.newScore,
        change: sseData.newScore - sseData.previousScore
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send SSE update', {
        userId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, notification: {
    notificationId: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_notification');

    try {
      const event: WebSocketEvent = {
        eventType: 'notification',
        eventData: {
          ...notification,
          timestamp: new Date(),
          delivered: true
        },
        userId,
        timestamp: new Date()
      };

      // Send to user's private room
      this.io.to(`user_${userId}`).emit('notification', event.eventData);

      // Send to notifications room if user is subscribed
      this.io.to('notifications').emit('notification_broadcast', {
        userId,
        type: notification.type,
        priority: notification.priority,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Notification sent', {
        userId,
        notificationId: notification.notificationId,
        type: notification.type,
        priority: notification.priority
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send notification', {
        userId,
        notificationId: notification.notificationId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send gamification event to user
   */
  async sendGamificationEvent(userId: string, event: {
    eventType: string;
    points: number;
    auxTokens: number;
    level?: number;
    achievement?: string;
    challenge?: string;
    message: string;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_gamification');

    try {
      const gamificationEvent: WebSocketEvent = {
        eventType: 'gamification_event',
        eventData: {
          ...event,
          timestamp: new Date(),
          animated: true
        },
        userId,
        timestamp: new Date()
      };

      // Send to user's private room
      this.io.to(`user_${userId}`).emit('gamification_event', gamificationEvent.eventData);

      // Send to gamification room for leaderboard updates
      this.io.to('gamification_events').emit('gamification_broadcast', {
        userId,
        eventType: event.eventType,
        points: event.points,
        auxTokens: event.auxTokens,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Gamification event sent', {
        userId,
        eventType: event.eventType,
        points: event.points,
        auxTokens: event.auxTokens
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send gamification event', {
        userId,
        eventType: event.eventType,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send investor interest notification
   */
  async sendInvestorInterest(startupUserId: string, investorData: {
    investorId: string;
    investorName: string;
    interestLevel: string;
    investmentAmount?: number;
    message?: string;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_investor_interest');

    try {
      const event: WebSocketEvent = {
        eventType: 'investor_interest',
        eventData: {
          ...investorData,
          timestamp: new Date(),
          urgent: investorData.interestLevel === 'ready_to_invest'
        },
        userId: startupUserId,
        timestamp: new Date()
      };

      // Send to startup's private room
      this.io.to(`user_${startupUserId}`).emit('investor_interest', event.eventData);

      // Send to investor matching room
      this.io.to('investor_matching').emit('investor_interest_broadcast', {
        startupUserId,
        investorId: investorData.investorId,
        interestLevel: investorData.interestLevel,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Investor interest sent', {
        startupUserId,
        investorId: investorData.investorId,
        interestLevel: investorData.interestLevel
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send investor interest', {
        startupUserId,
        investorId: investorData.investorId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Broadcast system alert
   */
  async broadcastSystemAlert(alert: {
    alertId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedUsers?: string[];
    metadata?: Record<string, any>;
  }): Promise<void> {
    const timer = performanceTimer('websocket_broadcast_alert');

    try {
      const event: WebSocketEvent = {
        eventType: 'system_alert',
        eventData: {
          ...alert,
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      if (alert.affectedUsers && alert.affectedUsers.length > 0) {
        // Send to specific users
        alert.affectedUsers.forEach(userId => {
          this.io.to(`user_${userId}`).emit('system_alert', event.eventData);
        });
      } else {
        // Broadcast to all connected users
        this.io.emit('system_alert', event.eventData);
      }

      // Send to admin dashboard
      this.io.to('admin_dashboard').emit('system_alert_admin', event.eventData);

      timer.end();

      logger.info('System alert broadcasted', {
        alertId: alert.alertId,
        type: alert.type,
        severity: alert.severity,
        affectedUsers: alert.affectedUsers?.length || 'all'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to broadcast system alert', {
        alertId: alert.alertId,
        error: (error as Error).message
      });
    }
  }

  // Private helper methods

  private async joinRelevantRooms(socket: any, user: WebSocketUser): Promise<void> {
    // Join SSE updates room for real-time score updates
    socket.join('sse_updates');
    user.rooms.push('sse_updates');

    // Join notifications room
    socket.join('notifications');
    user.rooms.push('notifications');

    // Join role-specific rooms
    if (user.userRole === 'investor') {
      socket.join('investor_matching');
      user.rooms.push('investor_matching');
    }

    if (user.userRole === 'admin') {
      socket.join('admin_dashboard');
      user.rooms.push('admin_dashboard');
    }

    // Join gamification room if user has gamification enabled
    socket.join('gamification_events');
    user.rooms.push('gamification_events');
  }

  private async validateRoomAccess(user: WebSocketUser, roomId: string, roomType: RoomType): Promise<boolean> {
    // Implement room access validation logic
    switch (roomType) {
      case 'user_private':
        return roomId === `user_${user.userId}`;
      case 'admin_dashboard':
        return user.userRole === 'admin';
      case 'investor_matching':
        return user.userRole === 'investor' || user.userRole === 'startup';
      default:
        return true; // Allow access to public rooms
    }
  }

  private validateMessage(message: any): boolean {
    return message &&
           typeof message.content === 'string' &&
           message.content.length > 0 &&
           message.content.length <= 5000;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private getAvailableFeatures(userRole: string): string[] {
    const baseFeatures = ['sse_updates', 'notifications', 'gamification'];

    switch (userRole) {
      case 'admin':
        return [...baseFeatures, 'admin_dashboard', 'system_alerts', 'user_management'];
      case 'investor':
        return [...baseFeatures, 'investor_matching', 'deal_flow', 'portfolio_updates'];
      case 'startup':
        return [...baseFeatures, 'investor_interest', 'partnership_updates', 'mentorship'];
      default:
        return baseFeatures;
    }
  }

  private createRateLimiter(userId: string): { isAllowed: () => boolean } {
    // Simple rate limiter implementation
    const key = `rate_limit_${userId}`;
    const limit = 100; // 100 events per minute
    const window = 60000; // 1 minute

    return {
      isAllowed: () => {
        // Implementation would use Redis or in-memory store
        return true; // Simplified for now
      }
    };
  }

  private updateConnectionMetrics(action: 'connect' | 'disconnect', userRole: string): void {
    if (action === 'connect') {
      this.connectionMetrics.totalConnections++;
      this.connectionMetrics.activeConnections++;
      this.connectionMetrics.connectionsByRole[userRole] =
        (this.connectionMetrics.connectionsByRole[userRole] || 0) + 1;
    } else {
      this.connectionMetrics.activeConnections--;
      this.connectionMetrics.connectionsByRole[userRole] =
        Math.max((this.connectionMetrics.connectionsByRole[userRole] || 1) - 1, 0);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      // Check for stale connections
      this.connectedUsers.forEach((user, socketId) => {
        if (now.getTime() - user.lastActivity.getTime() > staleThreshold) {
          logger.warn('Stale WebSocket connection detected', {
            socketId,
            userId: user.userId,
            lastActivity: user.lastActivity
          });

          // Disconnect stale connection
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      });

      // Update metrics
      this.updateHeartbeatMetrics();

    }, 30000); // Every 30 seconds
  }

  private updateHeartbeatMetrics(): void {
    this.connectionMetrics.activeConnections = this.connectedUsers.size;

    // Update room metrics
    this.connectionMetrics.connectionsByRoom = {};
    this.activeRooms.forEach((room, roomId) => {
      this.connectionMetrics.connectionsByRoom[roomId] = room.participants.length;
    });
  }

  // Public utility methods

  /**
   * Get connection metrics
   */
  getConnectionMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get active rooms count
   */
  getActiveRoomsCount(): number {
    return this.activeRooms.size;
  }

  /**
   * Get user connection info
   */
  getUserConnection(userId: string): WebSocketUser | null {
    for (const user of this.connectedUsers.values()) {
      if (user.userId === userId) {
        return user;
      }
    }
    return null;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.getUserConnection(userId) !== null;
  }

  /**
   * Disconnect user
   */
  disconnectUser(userId: string, reason: string = 'admin_disconnect'): void {
    const user = this.getUserConnection(userId);
    if (user) {
      const socket = this.io.sockets.sockets.get(user.socketId);
      if (socket) {
        socket.disconnect(true);
        logger.info('User disconnected by admin', {
          userId,
          reason,
          socketId: user.socketId
        });
      }
    }
  }

  /**
   * Send message to specific user
   */
  async sendToUser(userId: string, eventType: string, data: any): Promise<void> {
    const event: WebSocketEvent = {
      eventType,
      eventData: data,
      userId,
      timestamp: new Date()
    };

    this.io.to(`user_${userId}`).emit(eventType, event.eventData);

    logger.info('Message sent to user', {
      userId,
      eventType,
      dataSize: JSON.stringify(data).length
    });
  }

  /**
   * Broadcast to all users
   */
  async broadcast(eventType: string, data: any): Promise<void> {
    const event: WebSocketEvent = {
      eventType,
      eventData: data,
      timestamp: new Date()
    };

    this.io.emit(eventType, event.eventData);

    logger.info('Message broadcasted', {
      eventType,
      connectedUsers: this.connectedUsers.size
    });
  }

  /**
   * Send to room
   */
  async sendToRoom(roomId: string, eventType: string, data: any): Promise<void> {
    const event: WebSocketEvent = {
      eventType,
      eventData: data,
      roomId,
      timestamp: new Date()
    };

    this.io.to(roomId).emit(eventType, event.eventData);

    const room = this.activeRooms.get(roomId);
    logger.info('Message sent to room', {
      roomId,
      eventType,
      participants: room?.participants.length || 0
    });
  }

  /**
   * Health check for WebSocket server
   */
  async healthCheck(): Promise<{
    status: string;
    connectedUsers: number;
    activeRooms: number;
    totalConnections: number;
    averageLatency: number;
    errorRate: number;
  }> {
    try {
      return {
        status: 'healthy',
        connectedUsers: this.connectedUsers.size,
        activeRooms: this.activeRooms.size,
        totalConnections: this.connectionMetrics.totalConnections,
        averageLatency: 50, // Would calculate from actual metrics
        errorRate: this.connectionMetrics.errorRate
      };
    } catch (error) {
      logger.error('WebSocket health check failed', {
        error: (error as Error).message
      });

      return {
        status: 'unhealthy',
        connectedUsers: 0,
        activeRooms: 0,
        totalConnections: 0,
        averageLatency: 0,
        errorRate: 1.0
      };
    }
  }

  /**
   * Shutdown WebSocket server gracefully
   */
  async shutdown(): Promise<void> {
    const timer = performanceTimer('websocket_shutdown');

    try {
      // Clear heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Notify all connected users
      this.io.emit('server_shutdown', {
        message: 'Server is shutting down for maintenance',
        timestamp: new Date(),
        reconnectDelay: 30000
      });

      // Wait for messages to be sent
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Disconnect all sockets
      this.io.disconnectSockets(true);

      // Close server
      this.io.close();

      timer.end();

      logger.info('WebSocket server shutdown completed', {
        usersDisconnected: this.connectedUsers.size,
        roomsClosed: this.activeRooms.size
      });

    } catch (error) {
      timer.end();
      logger.error('WebSocket shutdown failed', {
        error: (error as Error).message
      });
    }
  }
}

export default WebSocketServer;