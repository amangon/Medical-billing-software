import prisma from '../config/db.js';

export async function createNotification(data, businessId) {
  try {
    return await prisma.notification.create({
      data: { ...data, businessId }
    });
  } catch (err) {
    throw err;
  }
}

export async function listNotifications(businessId, { page = 1, limit = 10, userId }) {
  try {
    const where = { businessId };
    if (userId) where.userId = userId;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);
    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getUnreadCount(businessId, userId) {
  try {
    return await prisma.notification.count({
      where: { businessId, userId, isRead: false }
    });
  } catch (err) {
    throw err;
  }
}

export async function markAsRead(id, businessId) {
  try {
    const existing = await prisma.notification.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Notification not found');
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function markAllAsRead(businessId, userId) {
  try {
    return await prisma.notification.updateMany({
      where: { businessId, userId, isRead: false },
      data: { isRead: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteNotification(id, businessId) {
  try {
    const existing = await prisma.notification.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Notification not found');
    return await prisma.notification.delete({
      where: { id }
    });
  } catch (err) {
    throw err;
  }
}
