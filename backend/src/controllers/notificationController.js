import {
  listNotifications as getNotificationsService,
  getUnreadCount as getUnreadCountService,
  markAsRead as markAsReadSvc,
  markAllAsRead as markAllAsReadSvc,
  deleteNotification as deleteNotificationService
} from '../services/notificationService.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const result = await getNotificationsService(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await getUnreadCountService(req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await markAsReadSvc(req.params.id, req.user.businessId);
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await markAllAsReadSvc(req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const result = await deleteNotificationService(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
