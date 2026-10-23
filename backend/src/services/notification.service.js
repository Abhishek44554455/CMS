import { db } from '../config/supabase.js';
import {
  notFoundError,
  handleSupabaseError,
  assertValidUuid,
} from '../middleware/error.middleware.js';

/** GET — notifications for the authenticated user. */
export async function getNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const client = db();
  let builder = client
    .from('notifications')
    .select('*, complaint:complaint_id (complaint_number, title)')
    .eq('user_id', userId);

  if (unreadOnly) builder = builder.eq('is_read', false);

  const { data, error } = await builder
    .order('created_at', { ascending: false })
    .limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 50)));
  if (error) throw handleSupabaseError(error);

  return data || [];
}

/** PUT /:id/read — marks one notification as read (owner only). */
export async function markRead(id, userId) {
  assertValidUuid(id, 'notification id');
  const client = db();

  const { data: existing, error: findError } = await client
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();
  if (findError) throw handleSupabaseError(findError);
  if (!existing) throw notFoundError('Notification not found');
  if (existing.user_id !== userId) {
    const err = new Error('You do not have access to this notification');
    err.statusCode = 403;
    throw err;
  }

  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw handleSupabaseError(error);
  return data;
}

/** PUT /read-all — marks every unread notification of the user as read. */
export async function markAllRead(userId) {
  const client = db();
  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select('id');
  if (error) throw handleSupabaseError(error);
  return (data || []).length;
}

/**
 * Used by other services (complaint lifecycle events).
 * Silently skipped when no target user is supplied.
 */
export async function createNotification({
  user_id,
  title,
  message,
  type,
  complaint_id = null,
}) {
  if (!user_id || !title || !message || !type) return null;
  const { data, error } = await db()
    .from('notifications')
    .insert([{ user_id, title, message, type, complaint_id }])
    .select('*')
    .single();
  if (error) throw handleSupabaseError(error);
  return data;
}
