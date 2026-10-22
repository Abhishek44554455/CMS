import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
  { to: '/admin/escalated', label: 'Escalated', icon: AlertTriangle },
  { to: '/admin/institutions', label: 'Institutions', icon: Building2 },
  { to: '/admin/officers', label: 'Officers', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/ai-insights', label: 'AI Insights', icon: BrainCircuit },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`}
            aria-hidden="true"
          />
          <span>{item.label}</span>
          {isActive ? (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-700" aria-hidden="true" />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

/**
 * Admin sidebar. Fixed on desktop (lg+), slide-in drawer on mobile.
 * `open` / `onClose` control the mobile drawer only.
 */
export default function Sidebar({ open = false, onClose = () => {} }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">AICTE CMS</p>
              <p className="text-[11px] text-slate-500">Admin Console</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-[11px] text-slate-400">AICTE Complaint Management System</p>
          <p className="text-[11px] text-slate-400">Version 0.1.0</p>
        </div>
      </aside>
    </>
  );
}
