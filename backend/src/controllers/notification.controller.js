import * as notificationService from '../services/notification.service.js';

/** GET /api/notifications */
export async function getNotifications(req, res) {
  const notifications = await notificationService.getNotifications(req.user.id, {
    unreadOnly: req.query.unread === 'true',
    limit: req.query.limit,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  res.status(200).json({
    success: true,
    message: 'Notifications fetched successfully',
    data: { notifications, unreadCount },
  });
}

/** PUT /api/notifications/:id/read */
export async function markRead(req, res) {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
}

/** PUT /api/notifications/read-all */
export async function markAllRead(req, res) {
  const updated = await notificationService.markAllRead(req.user.id);
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: { updated },
  });
}
