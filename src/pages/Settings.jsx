import { useState } from 'react';
import { Bell, Building2, Lock, ShieldCheck, UserRound } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import { ADMIN_USER } from '../data/mockData.js';

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

function Section({ icon: Icon, title, description, children, footer }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-blue-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

/**
 * Settings: Profile, Notifications, System Preferences, Security.
 * Local state only — nothing is persisted to a backend yet.
 */
export default function Settings() {
  const [saved, setSaved] = useState('');

  const [profile, setProfile] = useState({
    name: ADMIN_USER.name,
    email: ADMIN_USER.email,
    phone: '+91 98100 12345',
    designation: 'Senior Grievance Officer',
  });

  const [notifications, setNotifications] = useState({
    newComplaints: true,
    slaBreach: true,
    escalations: true,
    dailyDigest: false,
    browserPush: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'English',
    dateFormat: 'DD MMM YYYY',
    defaultSla: '10',
    pageSize: '10',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
  });
  const [securityError, setSecurityError] = useState('');

  const showSaved = (key) => {
    setSaved(key);
    window.setTimeout(() => setSaved(''), 2500);
  };

  const handleSaveSecurity = () => {
    if (security.newPassword && security.newPassword !== security.confirmPassword) {
      setSecurityError('New password and confirmation do not match.');
      return;
    }
    setSecurityError('');
    showSaved('security');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">
          Manage your profile, notifications, preferences and security
        </p>
      </div>

      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Changes saved locally for “{saved}”. Persisting to the backend comes with the API integration.
        </div>
      ) : null}

      {/* Profile */}
      <Section
        icon={UserRound}
        title="Profile"
        description="Your account details and contact information"
        footer={
          <Button size="sm" onClick={() => showSaved('profile')}>
            Save Profile
          </Button>
        }
      >
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white">
              {ADMIN_USER.initials}
            </span>
            <button
              type="button"
              className="text-xs font-medium text-blue-700 hover:underline"
              onClick={() => showSaved('avatar')}
            >
              Change photo
            </button>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-phone">Phone</label>
              <input
                id="profile-phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-designation">Designation</label>
              <input
                id="profile-designation"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section
        icon={Bell}
        title="Notifications"
        description="Choose which updates you want to receive"
        footer={
          <Button size="sm" onClick={() => showSaved('notifications')}>
            Save Preferences
          </Button>
        }
      >
        <div className="divide-y divide-slate-100">
          <Toggle
            label="New complaint alerts"
            description="Get notified when a new complaint is submitted"
            checked={notifications.newComplaints}
            onChange={(v) => setNotifications({ ...notifications, newComplaints: v })}
          />
          <Toggle
            label="SLA breach alerts"
            description="Alert when a complaint is about to breach or has breached its SLA"
            checked={notifications.slaBreach}
            onChange={(v) => setNotifications({ ...notifications, slaBreach: v })}
          />
          <Toggle
            label="Escalation alerts"
            description="Notify when a complaint is escalated for intervention"
            checked={notifications.escalations}
            onChange={(v) => setNotifications({ ...notifications, escalations: v })}
          />
          <Toggle
            label="Daily digest"
            description="Receive a daily summary of grievance activity"
            checked={notifications.dailyDigest}
            onChange={(v) => setNotifications({ ...notifications, dailyDigest: v })}
          />
          <Toggle
            label="Browser push notifications"
            description="Show desktop notifications while the console is open"
            checked={notifications.browserPush}
            onChange={(v) => setNotifications({ ...notifications, browserPush: v })}
          />
        </div>
      </Section>

      {/* System Preferences */}
      <Section
        icon={Building2}
        title="System Preferences"
        description="Console-wide display and default behaviour"
        footer={
          <Button size="sm" onClick={() => showSaved('preferences')}>
            Save Preferences
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="pref-language">Language</label>
            <select
              id="pref-language"
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="pref-date">Date Format</label>
            <select
              id="pref-date"
              value={preferences.dateFormat}
              onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="DD MMM YYYY">DD MMM YYYY (22 Oct 2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-22)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (10/22/2026)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="pref-sla">Default SLA (days)</label>
            <select
              id="pref-sla"
              value={preferences.defaultSla}
              onChange={(e) => setPreferences({ ...preferences, defaultSla: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="5">5 days</option>
              <option value="10">10 days</option>
              <option value="15">15 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="pref-page">Rows per page</label>
            <select
              id="pref-page"
              value={preferences.pageSize}
              onChange={(e) => setPreferences({ ...preferences, pageSize: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section
        icon={Lock}
        title="Security"
        description="Password and account protection"
        footer={
          <Button size="sm" onClick={handleSaveSecurity}>
            Update Security
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="sec-current">Current Password</label>
            <input
              id="sec-current"
              type="password"
              value={security.currentPassword}
              onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
              placeholder="••••••••"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="sec-new">New Password</label>
            <input
              id="sec-new"
              type="password"
              value={security.newPassword}
              onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
              placeholder="••••••••"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="sec-confirm">Confirm New Password</label>
            <input
              id="sec-confirm"
              type="password"
              value={security.confirmPassword}
              onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {securityError ? <p className="mt-3 text-sm text-red-600">{securityError}</p> : null}

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-blue-700" />
          <div className="flex-1">
            <Toggle
              label="Two-factor authentication"
              description="Require a second verification step at sign-in"
              checked={security.twoFactor}
              onChange={(v) => setSecurity({ ...security, twoFactor: v })}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Security changes are UI-only until the authentication backend is connected.
        </p>
      </Section>
    </div>
  );
}
