import { useState } from 'react';
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

import { ADMIN_USER, NOTIFICATIONS } from '../../data/mockData.js';

const TYPE_STYLES = {
  critical: { dot: 'bg-red-500', icon: <TriangleAlert className="h-4 w-4 text-red-600" /> },
  warning: { dot: 'bg-orange-500', icon: <TriangleAlert className="h-4 w-4 text-orange-600" /> },
  success: { dot: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
  info: { dot: 'bg-blue-500', icon: <Bell className="h-4 w-4 text-blue-600" /> },
};

/**
 * Admin header: branding, notification bell with unread count,
 * profile dropdown with settings + logout.
 */
export default function Header({ onMenuClick = () => {} }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  const closeMenus = () => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    navigate('/login');
  };

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
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {unreadCount} new
                  </span>
                </div>
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <li
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 ${n.read ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                        {(TYPE_STYLES[n.type] || TYPE_STYLES.info).icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="truncate text-xs text-slate-500">{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
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
                {ADMIN_USER.initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-slate-800">
                  {ADMIN_USER.name}
                </span>
                <span className="block text-[11px] leading-tight text-slate-500">
                  {ADMIN_USER.role}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{ADMIN_USER.name}</p>
                  <p className="truncate text-xs text-slate-500">{ADMIN_USER.email}</p>
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
