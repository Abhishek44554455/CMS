import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  TriangleAlert,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';

const TYPE_STYLES = {
  critical: { dot: 'bg-red-500', icon: <TriangleAlert className="h-4 w-4 text-red-600" /> },
  warning: { dot: 'bg-orange-500', icon: <TriangleAlert className="h-4 w-4 text-orange-600" /> },
  success: { dot: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
  info: { dot: 'bg-blue-500', icon: <Bell className="h-4 w-4 text-blue-600" /> },
};

const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  OFFICER: 'Officer',
  BUREAU_HEAD: 'Bureau Head',
  ADMIN: 'Administrator',
};

function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Admin header: branding, notification bell (GET /api/notifications with
 * mark-one / mark-all read) and the profile dropdown (session from AuthContext).
 */
export default function Header({ onMenuClick = () => {} }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    if (!api.getToken()) return;
    setNotifLoading(true);
    setNotifError('');
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      setNotifError(err?.message || 'Unable to load notifications.');
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    // Optimistic update; roll back if the API rejects it.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    try {
      await api.markNotificationRead(notification.id);
    } catch {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      loadNotifications();
    }
  };

  const closeMenus = () => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    closeMenus();
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const displayName = user?.name || 'Account';
  const displayRole = ROLE_LABELS[user?.role] || user?.role || '';
  const initials = initialsOf(displayName);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-wide text-slate-900 sm:text-base">
            AICTE COMPLAINT MANAGEMENT
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Centralised grievance redressal platform
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications (${unreadCount} unread)`}
              onClick={() => {
                setNotificationsOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {unreadCount} new
                    </span>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </span>
                </div>

                {notifLoading && notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">
                    Loading notifications…
                  </p>
                ) : notifError ? (
                  <p className="px-4 py-6 text-center text-sm text-red-600">{notifError}</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n)}
                          className={`flex w-full gap-3 px-4 py-3 text-left ${
                            n.read ? 'bg-white' : 'bg-slate-50'
                          } hover:bg-slate-100`}
                        >
                          <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                            {(TYPE_STYLES[n.type] || TYPE_STYLES.info).icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {n.title}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {n.message}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {n.time}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-slate-100"
              aria-label="Open profile menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-slate-800">
                  {displayName}
                </span>
                <span className="block text-[11px] leading-tight text-slate-500">
                  {displayRole}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/admin/settings"
                    onClick={closeMenus}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Click-away layer for open dropdowns */}
      {notificationsOpen || profileOpen ? (
        <div className="fixed inset-0 z-20" onClick={closeMenus} aria-hidden="true" />
      ) : null}
    </header>
  );
}
