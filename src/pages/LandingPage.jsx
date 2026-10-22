import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  BookOpen,
  Briefcase,
  Bus,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Monitor,
  Search,
  ShieldCheck,
  Send,
  UserRound,
} from 'lucide-react';

// Mock data import — public stats come from the same central source as the dashboard.
import { CATEGORIES, DASHBOARD_STATS, INSTITUTIONS } from '../data/mockData.js';

const CATEGORY_ICONS = {
  Academics: GraduationCap,
  Infrastructure: Landmark,
  'Fees & Finance': FileText,
  Examination: ClipboardCheck,
  Hostel: BedDouble,
  Harassment: HeartHandshake,
  Transport: Bus,
  'IT Services': Monitor,
  Library: BookOpen,
  Placements: Briefcase,
  Administration: Landmark,
  Other: ShieldCheck,
};

const STEPS = [
  { title: '1. Submit', description: 'File your complaint with institution details, category and evidence.' },
  { title: '2. Review', description: 'The grievance desk verifies and categorises your complaint.' },
  { title: '3. Assigned', description: 'A responsible officer is assigned within the SLA window.' },
  { title: '4. Resolved', description: 'Track progress until resolution with full timeline transparency.' },
];

function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">AICTE CMS</span>
            <span className="block text-[11px] text-slate-500">Complaint Management</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link to="/" className="hover:text-blue-700">Home</Link>
          <Link to="/submit-complaint" className="hover:text-blue-700">Submit Complaint</Link>
          <Link to="/track" className="hover:text-blue-700">Track Complaint</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Login
          </Link>
          <Link
            to="/submit-complaint"
            className="hidden rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 sm:inline-flex"
          >
            Submit Complaint
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
            <Landmark className="h-3.5 w-3.5" />
            Government of India · Ministry of Education
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Centralised complaint management for technical institutions
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Submit, track and resolve grievances across AICTE-approved institutions — with clear
            ownership, SLA deadlines and full transparency at every stage.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/submit-complaint"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              <Send className="h-4 w-4" />
              Submit a Complaint
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Search className="h-4 w-4" />
              Track Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">How It Works</h2>
        <p className="mt-1 text-sm text-slate-500">Four simple stages from submission to resolution</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">{step.title}</p>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Complaint Categories */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900">Complaint Categories</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose the category that best describes your grievance
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category] || ShieldCheck;
              return (
                <Link
                  key={category}
                  to="/submit-complaint"
                  className="group rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-slate-700 group-hover:text-blue-700">
                    {category}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Complaint Tracking */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Complaint Tracking</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Already filed a complaint? Enter your complaint number (for example{' '}
              <span className="font-medium text-slate-800">CMP-10245</span>) to see its live status,
              SLA due date and complete timeline.
            </p>
          </div>
          <Link
            to="/track"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Track Complaint
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Statistics */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900">Platform Statistics</h2>
          <p className="mt-1 text-sm text-slate-500">Grievance redressal at a glance</p>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-2xl font-bold text-blue-700 sm:text-3xl">
                {DASHBOARD_STATS.totalComplaints.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Complaints Registered</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-2xl font-bold text-green-600 sm:text-3xl">
                {DASHBOARD_STATS.resolved.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Complaints Resolved</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {DASHBOARD_STATS.resolutionRate}%
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Resolution Rate</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {DASHBOARD_STATS.avgResolutionDays} days
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Avg. Resolution Time</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Serving {INSTITUTIONS.length * 104}+ AICTE-approved institutions across India.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-white">AICTE CMS</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              A centralized complaint management platform for technical education institutions in
              India.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-white">Home</Link></li>
              <li><Link to="/submit-complaint" className="text-slate-400 hover:text-white">Submit Complaint</Link></li>
              <li><Link to="/track" className="text-slate-400 hover:text-white">Track Complaint</Link></li>
              <li><Link to="/login" className="text-slate-400 hover:text-white">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">For Administrators</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/admin" className="text-slate-400 hover:text-white">Admin Dashboard</Link></li>
              <li><Link to="/admin/complaints" className="text-slate-400 hover:text-white">Manage Complaints</Link></li>
              <li><Link to="/admin/analytics" className="text-slate-400 hover:text-white">Analytics</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>grievance@aicte.gov.in</li>
              <li>Shiksha Sagar, 49-18 NVSD Campus</li>
              <li>New Delhi – 110016</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
            <p>© 2026 AICTE Complaint Management System. All rights reserved.</p>
            <p className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              Demo build · data shown is illustrative
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
