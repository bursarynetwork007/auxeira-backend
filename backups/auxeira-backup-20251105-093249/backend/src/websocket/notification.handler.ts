/**
 * WebSocket Notification Handler
 * Handles real-time notifications, alerts, and messaging
 */

import { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { WebSocketUser, WebSocketServer } from './index';
import { pool } from '../config/database';

export interface NotificationEvent {
  notificationId: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  deliveryStatus: NotificationDeliveryStatus;
  readStatus: NotificationReadStatus;
  expiresAt?: Date;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | 'sse_update'
  | 'investor_interest'
  | 'partnership_opportunity'
  | 'payment_reminder'
  | 'achievement_unlocked'
  | 'challenge_completed'
  | 'milestone_achieved'
  | 'system_alert'
  | 'security_alert'
  | 'feature_announcement'
  | 'maintenance_notice'
  | 'welcome'
  | 'reminder'
  | 'warning'
  | 'error';

export type NotificationCategory =
  | 'system'
  | 'business'
  | 'social'
  | 'financial'
  | 'security'
  | 'product'
  | 'marketing'
  | 'support';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type NotificationChannel = 'websocket' | 'email' | 'sms' | 'push' | 'in_app';

export type NotificationDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'expired';

export type NotificationReadStatus = 'unread' | 'read' | 'archived' | 'dismissed';

export interface NotificationPreferences {
  userId: string;
  channels: {
    websocket: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  };
  types: Record<NotificationType, boolean>;
  categories: Record<NotificationCategory, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
  };
  frequency: {
    immediate: NotificationType[];
    batched: NotificationType[];
    daily_digest: NotificationType[];
    weekly_digest: NotificationType[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  templateId: string;
  templateName: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  variables: string[];
  channels: NotificationChannel[];
  priority: NotificationPriority;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationHandler {
  private notificationQueue: Map<string, NotificationEvent[]> = new Map();
  private deliveryTimers: Map<string, NodeJS.Timeout> = new Map();
  private batchingTimers: Map<string, NodeJS.Timeout> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();

  /**
   * Set up notification event handlers for a socket
   */
  setupHandlers(socket: Socket, user: WebSocketUser, wsServer: WebSocketServer): void {
    // Get user notifications
    socket.on('notifications_get', async (data: {
      limit?: number;
      offset?: number;
      status?: NotificationReadStatus;
      type?: NotificationType;
      category?: NotificationCategory;
    }) => {
      await this.handleGetNotifications(socket, user, data);
    });

    // Mark notification as read
    socket.on('notification_mark_read', async (data: { notificationId: string }) => {
      await this.handleMarkNotificationRead(socket, user, data.notificationId);
    });

    // Mark all notifications as read
    socket.on('notifications_mark_all_read', async () => {
      await this.handleMarkAllNotificationsRead(socket, user);
    });

    // Archive notification
    socket.on('notification_archive', async (data: { notificationId: string }) => {
      await this.handleArchiveNotification(socket, user, data.notificationId);
    });

    // Dismiss notification
    socket.on('notification_dismiss', async (data: { notificationId: string }) => {
      await this.handleDismissNotification(socket, user, data.notificationId);
    });

    // Update notification preferences
    socket.on('notifications_update_preferences', async (data: { preferences: Partial<NotificationPreferences> }) => {
      await this.handleUpdateNotificationPreferences(socket, user, data.preferences);
    });

    // Get notification preferences
    socket.on('notifications_get_preferences', async () => {
      await this.handleGetNotificationPreferences(socket, user);
    });

    // Test notification
    socket.on('notification_test', async (data: { type: NotificationType; message?: string }) => {
      await this.handleTestNotification(socket, user, data.type, data.message);
    });

    // Get notification statistics
    socket.on('notifications_get_stats', async () => {
      await this.handleGetNotificationStats(socket, user);
    });

    // Subscribe to notification types
    socket.on('notifications_subscribe', async (data: { types: NotificationType[] }) => {
      await this.handleNotificationSubscription(socket, user, data.types);
    });

    // Unsubscribe from notification types
    socket.on('notifications_unsubscribe', async (data: { types: NotificationType[] }) => {
      await this.handleNotificationUnsubscription(socket, user, data.types);
    });
  }

  /**
   * Handle get notifications
   */
  private async handleGetNotifications(
    socket: Socket,
    user: WebSocketUser,
    data: {
      limit?: number;
      offset?: number;
      status?: NotificationReadStatus;
      type?: NotificationType;
      category?: NotificationCategory;
    }
  ): Promise<void> {
    const timer = performanceTimer('websocket_notifications_get');

    try {
      const notifications = await this.getUserNotifications(user.userId, data);

      socket.emit('notifications_data', {
        notifications,
        pagination: {
          limit: data.limit || 50,
          offset: data.offset || 0,
          total: notifications.length,
          hasMore: notifications.length === (data.limit || 50)
        },
        filters: {
          status: data.status,
          type: data.type,
          category: data.category
        },
        timestamp: new Date()
      });

      timer.end();

      logger.info('Notifications retrieved', {
        userId: user.userId,
        count: notifications.length,
        filters: data,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get notifications', {
        userId: user.userId,
        filters: data,
        error: (error as Error).message
      });

      socket.emit('notifications_error', {
        error: 'Failed to retrieve notifications',
        code: 'GET_NOTIFICATIONS_FAILED'
      });
    }
  }

  /**
   * Handle mark notification as read
   */
  private async handleMarkNotificationRead(
    socket: Socket,
    user: WebSocketUser,
    notificationId: string
  ): Promise<void> {
    const timer = performanceTimer('websocket_notification_mark_read');

    try {
      await this.markNotificationAsRead(user.userId, notificationId);

      socket.emit('notification_marked_read', {
        notificationId,
        timestamp: new Date()
      });

      // Update unread count
      const unreadCount = await this.getUnreadNotificationCount(user.userId);
      socket.emit('notifications_unread_count', {
        count: unreadCount,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Notification marked as read', {
        userId: user.userId,
        notificationId,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to mark notification as read', {
        userId: user.userId,
        notificationId,
        error: (error as Error).message
      });

      socket.emit('notification_mark_read_error', {
        error: 'Failed to mark notification as read',
        notificationId
      });
    }
  }

  /**
   * Handle mark all notifications as read
   */
  private async handleMarkAllNotificationsRead(socket: Socket, user: WebSocketUser): Promise<void> {
    const timer = performanceTimer('websocket_notifications_mark_all_read');

    try {
      const markedCount = await this.markAllNotificationsAsRead(user.userId);

      socket.emit('notifications_all_marked_read', {
        markedCount,
        timestamp: new Date()
      });

      // Update unread count to 0
      socket.emit('notifications_unread_count', {
        count: 0,
        timestamp: new Date()
      });

      timer.end();

      logger.info('All notifications marked as read', {
        userId: user.userId,
        markedCount,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to mark all notifications as read', {
        userId: user.userId,
        error: (error as Error).message
      });

      socket.emit('notifications_mark_all_read_error', {
        error: 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * Handle update notification preferences
   */
  private async handleUpdateNotificationPreferences(
    socket: Socket,
    user: WebSocketUser,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const timer = performanceTimer('websocket_notifications_update_preferences');

    try {
      const updatedPreferences = await this.updateNotificationPreferences(user.userId, preferences);

      socket.emit('notifications_preferences_updated', {
        preferences: updatedPreferences,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Notification preferences updated', {
        userId: user.userId,
        updatedFields: Object.keys(preferences),
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to update notification preferences', {
        userId: user.userId,
        preferences,
        error: (error as Error).message
      });

      socket.emit('notifications_preferences_error', {
        error: 'Failed to update notification preferences'
      });
    }
  }

  /**
   * Handle test notification
   */
  private async handleTestNotification(
    socket: Socket,
    user: WebSocketUser,
    type: NotificationType,
    message?: string
  ): Promise<void> {
    const timer = performanceTimer('websocket_notification_test');

    try {
      const testNotification: NotificationEvent = {
        notificationId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.userId,
        type,
        category: 'system',
        title: 'Test Notification',
        message: message || `This is a test ${type} notification`,
        priority: 'medium',
        channels: ['websocket'],
        deliveryStatus: 'delivered',
        readStatus: 'unread',
        createdAt: new Date(),
        deliveredAt: new Date(),
        metadata: {
          isTest: true,
          requestedBy: user.userId,
          socketId: socket.id
        }
      };

      // Send test notification
      socket.emit('notification', testNotification);

      socket.emit('notification_test_sent', {
        testNotification,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Test notification sent', {
        userId: user.userId,
        type,
        notificationId: testNotification.notificationId,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send test notification', {
        userId: user.userId,
        type,
        error: (error as Error).message
      });

      socket.emit('notification_test_error', {
        error: 'Failed to send test notification',
        type
      });
    }
  }

  // Public methods for external services

  /**
   * Send notification to user
   */
  async sendNotification(notification: Omit<NotificationEvent, 'notificationId' | 'deliveryStatus' | 'readStatus' | 'createdAt'>): Promise<string> {
    const timer = performanceTimer('websocket_send_notification');

    try {
      const notificationEvent: NotificationEvent = {
        notificationId: this.generateNotificationId(),
        deliveryStatus: 'pending',
        readStatus: 'unread',
        createdAt: new Date(),
        ...notification
      };

      // Check user preferences
      const preferences = await this.getNotificationPreferences(notification.userId);
      if (!this.shouldSendNotification(notificationEvent, preferences)) {
        logger.info('Notification blocked by user preferences', {
          userId: notification.userId,
          type: notification.type,
          notificationId: notificationEvent.notificationId
        });
        return notificationEvent.notificationId;
      }

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        await this.queueNotificationForLater(notificationEvent);
        return notificationEvent.notificationId;
      }

      // Send via WebSocket if user is connected
      const wsServer = this.getWebSocketServer();
      if (wsServer.isUserConnected(notification.userId)) {
        await wsServer.sendToUser(notification.userId, 'notification', notificationEvent);
        notificationEvent.deliveryStatus = 'delivered';
        notificationEvent.deliveredAt = new Date();
      }

      // Store notification
      await this.storeNotification(notificationEvent);

      // Send via other channels if configured
      await this.sendViaOtherChannels(notificationEvent, preferences);

      timer.end();

      logger.info('Notification sent', {
        userId: notification.userId,
        type: notification.type,
        priority: notification.priority,
        notificationId: notificationEvent.notificationId,
        channels: notification.channels
      });

      return notificationEvent.notificationId;

    } catch (error) {
      timer.end();
      logger.error('Failed to send notification', {
        userId: notification.userId,
        type: notification.type,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: Array<Omit<NotificationEvent, 'notificationId' | 'deliveryStatus' | 'readStatus' | 'createdAt'>>): Promise<string[]> {
    const timer = performanceTimer('websocket_send_bulk_notifications');

    try {
      const notificationIds: string[] = [];
      const batchSize = 50;

      // Process in batches
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const batchPromises = batch.map(notification => this.sendNotification(notification));
        const batchIds = await Promise.all(batchPromises);
        notificationIds.push(...batchIds);

        // Small delay between batches to prevent overwhelming
        if (i + batchSize < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      timer.end();

      logger.info('Bulk notifications sent', {
        totalNotifications: notifications.length,
        batchesProcessed: Math.ceil(notifications.length / batchSize),
        successfulSends: notificationIds.length
      });

      return notificationIds;

    } catch (error) {
      timer.end();
      logger.error('Failed to send bulk notifications', {
        totalNotifications: notifications.length,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Send system-wide announcement
   */
  async sendSystemAnnouncement(announcement: {
    title: string;
    message: string;
    priority: NotificationPriority;
    targetUsers?: string[];
    targetRoles?: string[];
    actionUrl?: string;
    imageUrl?: string;
    expiresAt?: Date;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_system_announcement');

    try {
      const wsServer = this.getWebSocketServer();

      // Create announcement notification
      const announcementNotification = {
        type: 'feature_announcement' as NotificationType,
        category: 'system' as NotificationCategory,
        title: announcement.title,
        message: announcement.message,
        priority: announcement.priority,
        actionUrl: announcement.actionUrl,
        imageUrl: announcement.imageUrl,
        channels: ['websocket', 'email'] as NotificationChannel[],
        expiresAt: announcement.expiresAt,
        metadata: {
          isSystemAnnouncement: true,
          targetUsers: announcement.targetUsers,
          targetRoles: announcement.targetRoles
        }
      };

      if (announcement.targetUsers && announcement.targetUsers.length > 0) {
        // Send to specific users
        const notifications = announcement.targetUsers.map(userId => ({
          ...announcementNotification,
          userId
        }));
        await this.sendBulkNotifications(notifications);
      } else {
        // Broadcast to all connected users or specific roles
        await wsServer.broadcast('system_announcement', announcementNotification);
      }

      timer.end();

      logger.info('System announcement sent', {
        title: announcement.title,
        priority: announcement.priority,
        targetUsers: announcement.targetUsers?.length || 'all',
        targetRoles: announcement.targetRoles
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send system announcement', {
        title: announcement.title,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(userId: string, achievement: {
    achievementId: string;
    achievementName: string;
    description: string;
    rarity: string;
    rewards: {
      experiencePoints: number;
      auxTokens: number;
      badges?: string[];
    };
    imageUrl?: string;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_achievement_notification');

    try {
      const notification = {
        userId,
        type: 'achievement_unlocked' as NotificationType,
        category: 'social' as NotificationCategory,
        title: '🏆 Achievement Unlocked!',
        message: `Congratulations! You've unlocked "${achievement.achievementName}"`,
        priority: achievement.rarity === 'legendary' ? 'high' as NotificationPriority : 'medium' as NotificationPriority,
        imageUrl: achievement.imageUrl,
        channels: ['websocket', 'email'] as NotificationChannel[],
        data: {
          achievementId: achievement.achievementId,
          achievementName: achievement.achievementName,
          description: achievement.description,
          rarity: achievement.rarity,
          rewards: achievement.rewards,
          celebration: true
        },
        metadata: {
          isAchievement: true,
          rarity: achievement.rarity,
          totalRewards: achievement.rewards.experiencePoints + achievement.rewards.auxTokens
        }
      };

      await this.sendNotification(notification);

      // Send special celebration event for rare achievements
      if (['epic', 'legendary'].includes(achievement.rarity)) {
        const wsServer = this.getWebSocketServer();
        await wsServer.sendToUser(userId, 'achievement_celebration', {
          achievement,
          celebrationType: achievement.rarity,
          duration: achievement.rarity === 'legendary' ? 10000 : 5000, // milliseconds
          timestamp: new Date()
        });
      }

      timer.end();

      logger.info('Achievement notification sent', {
        userId,
        achievementId: achievement.achievementId,
        achievementName: achievement.achievementName,
        rarity: achievement.rarity
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send achievement notification', {
        userId,
        achievementId: achievement.achievementId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send investor interest notification
   */
  async sendInvestorInterestNotification(startupUserId: string, investorData: {
    investorId: string;
    investorName: string;
    investorType: string;
    interestLevel: string;
    investmentAmount?: number;
    message?: string;
    profileUrl?: string;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_investor_interest_notification');

    try {
      const urgency = investorData.interestLevel === 'ready_to_invest';

      const notification = {
        userId: startupUserId,
        type: 'investor_interest' as NotificationType,
        category: 'business' as NotificationCategory,
        title: '💰 Investor Interest!',
        message: `${investorData.investorName} (${investorData.investorType}) has shown ${investorData.interestLevel} in your startup`,
        priority: urgency ? 'urgent' as NotificationPriority : 'high' as NotificationPriority,
        actionUrl: `/dashboard/investors/${investorData.investorId}`,
        actionText: 'View Investor Profile',
        channels: urgency ? ['websocket', 'email', 'sms'] as NotificationChannel[] : ['websocket', 'email'] as NotificationChannel[],
        data: {
          investorId: investorData.investorId,
          investorName: investorData.investorName,
          investorType: investorData.investorType,
          interestLevel: investorData.interestLevel,
          investmentAmount: investorData.investmentAmount,
          message: investorData.message,
          profileUrl: investorData.profileUrl
        },
        metadata: {
          isInvestorInterest: true,
          urgent: urgency,
          investorType: investorData.investorType,
          interestLevel: investorData.interestLevel
        }
      };

      await this.sendNotification(notification);

      timer.end();

      logger.info('Investor interest notification sent', {
        startupUserId,
        investorId: investorData.investorId,
        investorName: investorData.investorName,
        interestLevel: investorData.interestLevel,
        urgent: urgency
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send investor interest notification', {
        startupUserId,
        investorId: investorData.investorId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(userId: string, paymentData: {
    subscriptionId: string;
    planName: string;
    amount: number;
    currency: string;
    dueDate: Date;
    isOverdue: boolean;
    gracePeriodDays?: number;
  }): Promise<void> {
    const timer = performanceTimer('websocket_send_payment_reminder');

    try {
      const isUrgent = paymentData.isOverdue ||
        (paymentData.dueDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000; // Due within 24 hours

      const notification = {
        userId,
        type: 'payment_reminder' as NotificationType,
        category: 'financial' as NotificationCategory,
        title: paymentData.isOverdue ? '⚠️ Payment Overdue' : '💳 Payment Reminder',
        message: paymentData.isOverdue
          ? `Your ${paymentData.planName} subscription payment of ${paymentData.currency} ${paymentData.amount} is overdue`
          : `Your ${paymentData.planName} subscription payment of ${paymentData.currency} ${paymentData.amount} is due soon`,
        priority: isUrgent ? 'urgent' as NotificationPriority : 'high' as NotificationPriority,
        actionUrl: '/dashboard/billing',
        actionText: 'Update Payment Method',
        channels: isUrgent ? ['websocket', 'email', 'sms'] as NotificationChannel[] : ['websocket', 'email'] as NotificationChannel[],
        data: {
          subscriptionId: paymentData.subscriptionId,
          planName: paymentData.planName,
          amount: paymentData.amount,
          currency: paymentData.currency,
          dueDate: paymentData.dueDate,
          isOverdue: paymentData.isOverdue,
          gracePeriodDays: paymentData.gracePeriodDays
        },
        metadata: {
          isPaymentReminder: true,
          isOverdue: paymentData.isOverdue,
          urgent: isUrgent,
          daysUntilDue: Math.ceil((paymentData.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        }
      };

      await this.sendNotification(notification);

      timer.end();

      logger.info('Payment reminder sent', {
        userId,
        subscriptionId: paymentData.subscriptionId,
        amount: paymentData.amount,
        isOverdue: paymentData.isOverdue,
        urgent: isUrgent
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send payment reminder', {
        userId,
        subscriptionId: paymentData.subscriptionId,
        error: (error as Error).message
      });
    }
  }

  // Private helper methods

  private async getUserNotifications(
    userId: string,
    filters: {
      limit?: number;
      offset?: number;
      status?: NotificationReadStatus;
      type?: NotificationType;
      category?: NotificationCategory;
    }
  ): Promise<NotificationEvent[]> {
    try {
      // Get from Redis cache
      const cacheKey = `notifications_${userId}_${JSON.stringify(filters)}`;
      const cachedNotifications = await redisClient.get(cacheKey);

      if (cachedNotifications) {
        return JSON.parse(cachedNotifications);
      }

      // Mock data - would implement database query
      const mockNotifications: NotificationEvent[] = [
        {
          notificationId: 'notif_1',
          userId,
          type: 'sse_update',
          category: 'business',
          title: 'SSE Score Updated',
          message: 'Your SSE score has improved by 5 points!',
          priority: 'medium',
          channels: ['websocket'],
          deliveryStatus: 'delivered',
          readStatus: 'unread',
          createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          deliveredAt: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          notificationId: 'notif_2',
          userId,
          type: 'achievement_unlocked',
          category: 'social',
          title: 'Achievement Unlocked!',
          message: 'You\'ve unlocked the "SSE Pioneer" achievement',
          priority: 'high',
          channels: ['websocket', 'email'],
          deliveryStatus: 'delivered',
          readStatus: 'read',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          readAt: new Date(Date.now() - 60 * 60 * 1000)
        }
      ];

      // Apply filters
      let filteredNotifications = mockNotifications;

      if (filters.status) {
        filteredNotifications = filteredNotifications.filter(n => n.readStatus === filters.status);
      }

      if (filters.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
      }

      if (filters.category) {
        filteredNotifications = filteredNotifications.filter(n => n.category === filters.category);
      }

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      filteredNotifications = filteredNotifications.slice(offset, offset + limit);

      // Cache results
      await redisClient.setex(cacheKey, 5 * 60, JSON.stringify(filteredNotifications)); // 5 minutes

      return filteredNotifications;

    } catch (error) {
      logger.error('Failed to get user notifications', {
        userId,
        filters,
        error: (error as Error).message
      });
      return [];
    }
  }

  private async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // Update in database (would implement)
      // await notificationService.markAsRead(userId, notificationId);

      // Update in cache
      await redisClient.setex(
        `notification_read_${notificationId}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify({
          userId,
          readAt: new Date(),
          status: 'read'
        })
      );

      logger.info('Notification marked as read', {
        userId,
        notificationId
      });

    } catch (error) {
      logger.error('Failed to mark notification as read', {
        userId,
        notificationId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async markAllNotificationsAsRead(userId: string): Promise<number> {
    try {
      // Update all unread notifications in database (would implement)
      // const markedCount = await notificationService.markAllAsRead(userId);

      // Clear unread count cache
      await redisClient.del(`unread_count_${userId}`);

      // Mock return value
      const markedCount = 5;

      logger.info('All notifications marked as read', {
        userId,
        markedCount
      });

      return markedCount;

    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      // Check cache first
      const cachedCount = await redisClient.get(`unread_count_${userId}`);
      if (cachedCount) {
        return parseInt(cachedCount);
      }

      // Query database (would implement)
      // const count = await notificationService.getUnreadCount(userId);

      // Mock count
      const count = 3;

      // Cache the count
      await redisClient.setex(`unread_count_${userId}`, 5 * 60, count.toString()); // 5 minutes

      return count;

    } catch (error) {
      logger.error('Failed to get unread notification count', {
        userId,
        error: (error as Error).message
      });
      return 0;
    }
  }

  private async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Get from cache
      const cachedPreferences = await redisClient.get(`notification_preferences_${userId}`);
      if (cachedPreferences) {
        return JSON.parse(cachedPreferences);
      }

      // Get from database (would implement)
      // const preferences = await notificationService.getPreferences(userId);

      // Return default preferences
      const defaultPreferences: NotificationPreferences = {
        userId,
        channels: {
          websocket: true,
          email: true,
          sms: false,
          push: true,
          in_app: true
        },
        types: {
          sse_update: true,
          investor_interest: true,
          partnership_opportunity: true,
          payment_reminder: true,
          achievement_unlocked: true,
          challenge_completed: true,
          milestone_achieved: true,
          system_alert: true,
          security_alert: true,
          feature_announcement: true,
          maintenance_notice: true,
          welcome: true,
          reminder: true,
          warning: true,
          error: true
        },
        categories: {
          system: true,
          business: true,
          social: true,
          financial: true,
          security: true,
          product: true,
          marketing: true,
          support: true
        },
        priorities: {
          low: true,
          medium: true,
          high: true,
          urgent: true,
          critical: true
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC'
        },
        frequency: {
          immediate: ['investor_interest', 'payment_reminder', 'security_alert', 'system_alert'],
          batched: ['sse_update', 'achievement_unlocked'],
          daily_digest: ['partnership_opportunity', 'feature_announcement'],
          weekly_digest: ['challenge_completed', 'milestone_achieved']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Cache preferences
      await redisClient.setex(
        `notification_preferences_${userId}`,
        60 * 60, // 1 hour
        JSON.stringify(defaultPreferences)
      );

      return defaultPreferences;

    } catch (error) {
      logger.error('Failed to get notification preferences', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const currentPreferences = await this.getNotificationPreferences(userId);
      const updatedPreferences = {
        ...currentPreferences,
        ...updates,
        updatedAt: new Date()
      };

      // Save to database (would implement)
      // await notificationService.updatePreferences(userId, updatedPreferences);

      // Update cache
      await redisClient.setex(
        `notification_preferences_${userId}`,
        60 * 60, // 1 hour
        JSON.stringify(updatedPreferences)
      );

      return updatedPreferences;

    } catch (error) {
      logger.error('Failed to update notification preferences', {
        userId,
        updates,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private shouldSendNotification(notification: NotificationEvent, preferences: NotificationPreferences): boolean {
    // Check if notification type is enabled
    if (!preferences.types[notification.type]) {
      return false;
    }

    // Check if notification category is enabled
    if (!preferences.categories[notification.category]) {
      return false;
    }

    // Check if notification priority is enabled
    if (!preferences.priorities[notification.priority]) {
      return false;
    }

    // Check if WebSocket channel is enabled
    if (notification.channels.includes('websocket') && !preferences.channels.websocket) {
      return false;
    }

    return true;
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().substr(0, 5); // HH:MM format

    // Simple time comparison (would implement proper timezone handling)
    return currentTime >= preferences.quietHours.startTime ||
           currentTime <= preferences.quietHours.endTime;
  }

  private async queueNotificationForLater(notification: NotificationEvent): Promise<void> {
    try {
      // Queue notification for delivery after quiet hours
      await redisClient.lpush(
        `notification_queue_${notification.userId}`,
        JSON.stringify(notification)
      );

      logger.info('Notification queued for later delivery', {
        userId: notification.userId,
        notificationId: notification.notificationId,
        type: notification.type
      });

    } catch (error) {
      logger.error('Failed to queue notification', {
        userId: notification.userId,
        notificationId: notification.notificationId,
        error: (error as Error).message
      });
    }
  }

  private async storeNotification(notification: NotificationEvent): Promise<void> {
    try {
      // Store in database (would implement)
      // await notificationService.store(notification);

      // Store in Redis for quick access
      await redisClient.setex(
        `notification_${notification.notificationId}`,
        30 * 24 * 60 * 60, // 30 days
        JSON.stringify(notification)
      );

      // Update user's notification list
      await redisClient.lpush(
        `user_notifications_${notification.userId}`,
        notification.notificationId
      );

      // Trim to keep only recent notifications
      await redisClient.ltrim(`user_notifications_${notification.userId}`, 0, 999); // Keep 1000 most recent

    } catch (error) {
      logger.error('Failed to store notification', {
        notificationId: notification.notificationId,
        userId: notification.userId,
        error: (error as Error).message
      });
    }
  }

  private async sendViaOtherChannels(
    notification: NotificationEvent,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      // Send via email if enabled
      if (notification.channels.includes('email') && preferences.channels.email) {
        // await emailService.sendNotificationEmail(notification);
      }

      // Send via SMS if enabled and urgent
      if (notification.channels.includes('sms') && preferences.channels.sms &&
          ['urgent', 'critical'].includes(notification.priority)) {
        // await smsService.sendNotificationSMS(notification);
      }

      // Send via push notification if enabled
      if (notification.channels.includes('push') && preferences.channels.push) {
        // await pushService.sendPushNotification(notification);
      }

    } catch (error) {
      logger.error('Failed to send via other channels', {
        notificationId: notification.notificationId,
        userId: notification.userId,
        channels: notification.channels,
        error: (error as Error).message
      });
    }
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private getWebSocketServer(): WebSocketServer {
    // This would be injected or accessed through a singleton
    // For now, return a mock interface
    return {
      sendToUser: async (userId: string, eventType: string, data: any) => {
        // Implementation would be provided by the main WebSocket server
      },
      sendToRoom: async (roomId: string, eventType: string, data: any) => {
        // Implementation would be provided by the main WebSocket server
      },
      broadcast: async (eventType: string, data: any) => {
        // Implementation would be provided by the main WebSocket server
      },
      isUserConnected: (userId: string) => {
        // Implementation would be provided by the main WebSocket server
        return true;
      }
    } as any;
  }

  /**
   * Get notification statistics for user
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byCategory: Record<NotificationCategory, number>;
    byPriority: Record<NotificationPriority, number>;
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
  }> {
    try {
      // Mock statistics - would implement database queries
      return {
        total: 25,
        unread: 3,
        byType: {
          sse_update: 8,
          investor_interest: 2,
          partnership_opportunity: 3,
          payment_reminder: 1,
          achievement_unlocked: 5,
          challenge_completed: 2,
          milestone_achieved: 1,
          system_alert: 2,
          security_alert: 0,
          feature_announcement: 1,
          maintenance_notice: 0,
          welcome: 0,
          reminder: 0,
          warning: 0,
          error: 0
        },
        byCategory: {
          system: 3,
          business: 13,
          social: 7,
          financial: 1,
          security: 0,
          product: 1,
          marketing: 0,
          support: 0
        },
        byPriority: {
          low: 5,
          medium: 15,
          high: 4,
          urgent: 1,
          critical: 0
        },
        recentActivity: [
          { date: '2024-08-31', count: 3 },
          { date: '2024-08-30', count: 5 },
          { date: '2024-08-29', count: 2 },
          { date: '2024-08-28', count: 4 },
          { date: '2024-08-27', count: 1 }
        ]
      };

    } catch (error) {
      logger.error('Failed to get notification stats', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const timer = performanceTimer('websocket_cleanup_expired_notifications');

    try {
      const now = new Date();
      let cleanedCount = 0;

      // Get all notification keys from Redis
      const notificationKeys = await redisClient.keys('notification_*');

      for (const key of notificationKeys) {
        const notificationData = await redisClient.get(key);
        if (notificationData) {
          const notification: NotificationEvent = JSON.parse(notificationData);

          if (notification.expiresAt && notification.expiresAt < now) {
            await redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      timer.end();

      logger.info('Expired notifications cleaned up', {
        cleanedCount,
        totalChecked: notificationKeys.length
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to cleanup expired notifications', {
        error: (error as Error).message
      });
    }
  }
}

export const notificationHandler = new NotificationHandler();