/**
 * API service layer — the single place the React app talks to the backend.
 *
 * Data flow:
 *   React component -> src/services/api.js -> Express API -> Controller -> Service -> Supabase -> PostgreSQL
 *
 * The frontend never talks to Supabase directly. All credentials stay in
 * backend/.env; the browser only ever sees VITE_API_URL (a public address).
 *
 * The backend stores canonical values (PENDING, FEE, …) while the UI renders
 * display labels (Pending, Fees & Finance, …). Every mapping happens here so
 * pages and components keep their existing design.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

const API_BASE_URL = String(
  env.VITE_API_URL || env.VITE_API_BASE_URL || '/api'
).replace(/\/+$/, '');

const TOKEN_KEY = 'aicte_access_token';
const USER_KEY = 'aicte_auth_user';

/* ------------------------------------------------------------------ */
/* Session storage                                                     */
/* Access token + profile live in sessionStorage (per-tab), NOT         */
/* localStorage — nothing sensitive persists across browser sessions.   */
/* ------------------------------------------------------------------ */

function sessionStore() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return sessionStore()?.getItem(TOKEN_KEY) || null;
}

export function getStoredUser() {
  try {
    const raw = sessionStore()?.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  const store = sessionStore();
  if (!store) return;
  if (token) store.setItem(TOKEN_KEY, token);
  if (user) store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  const store = sessionStore();
  if (!store) return;
  store.removeItem(TOKEN_KEY);
  store.removeItem(USER_KEY);
}

/* ------------------------------------------------------------------ */
/* Error handling                                                      */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/* ------------------------------------------------------------------ */
/* Fetch wrapper                                                       */
/* ------------------------------------------------------------------ */

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:5173';
  const base = /^[a-z]+:\/\//i.test(API_BASE_URL) ? API_BASE_URL : `${origin}${API_BASE_URL}`;
  const url = new URL(base + path);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      signal,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Unable to reach the server. Is the backend running?', 0, null);
  }

  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      (response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : `Request failed (${response.status})`);
    const error = new ApiError(message, response.status, payload);
    if (response.status === 401 && path !== '/auth/login') clearSession();
    throw error;
  }

  return payload;
}

/* ------------------------------------------------------------------ */
/* Value mapping: backend canonical values <-> UI display labels       */
/* ------------------------------------------------------------------ */

export const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const PRIORITY_LABELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const CATEGORY_LABELS = {
  FEE: 'Fees & Finance',
  ACADEMIC: 'Academics',
  APPROVAL: 'Approval',
  INFRASTRUCTURE: 'Infrastructure',
  LEGAL: 'Legal',
  ADMINISTRATION: 'Administration',
  OTHER: 'Other',
};

/** UI category labels -> backend canonical categories. */
const CATEGORY_TO_API = {
  'Fees & Finance': 'FEE',
  Academics: 'ACADEMIC',
  Examination: 'ACADEMIC',
  Library: 'ACADEMIC',
  Approval: 'APPROVAL',
  Infrastructure: 'INFRASTRUCTURE',
  Transport: 'INFRASTRUCTURE',
  Hostel: 'INFRASTRUCTURE',
  Legal: 'LEGAL',
  Harassment: 'LEGAL',
  Administration: 'ADMINISTRATION',
  'IT Services': 'ADMINISTRATION',
  Placements: 'ADMINISTRATION',
  Other: 'OTHER',
};

const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  OFFICER: 'Officer',
  BUREAU_HEAD: 'Bureau Head',
  ADMIN: 'Administrator',
};

function invert(map) {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
}
const STATUS_TO_API = invert(STATUS_LABELS);
const PRIORITY_TO_API = invert(PRIORITY_LABELS);

const toStatusApi = (value) => STATUS_TO_API[value] || value;
const toPriorityApi = (value) => PRIORITY_TO_API[value] || value;
const toCategoryApi = (value) => CATEGORY_TO_API[value] || value;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(fromIso, toMs = Date.now()) {
  if (!fromIso) return 0;
  const diff = toMs - new Date(fromIso).getTime();
  return diff > 0 ? Math.floor(diff / DAY_MS) : 0;
}

function formatRelative(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return 'just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/** Backend complaint row -> the complaint shape the UI already renders. */
export function mapComplaint(row) {
  if (!row) return null;

  const status = STATUS_LABELS[row.status] || row.status;
  const isFinished = row.status === 'RESOLVED' || row.status === 'CLOSED';
  const daysOverdue = !isFinished ? daysBetween(row.sla_due_at) : 0;
  const inst = row.institutions || {};
  const officer = row.assigned_officer || null;
  const bureau = row.bureau || officer?.bureaus || null;

  return {
    id: row.complaint_number,
    uuid: row.id,
    title: row.title,
    description: row.description,
    category: CATEGORY_LABELS[row.category] || row.category,
    priority: PRIORITY_LABELS[row.priority] || row.priority,
    status,
    institution: {
      id: row.institution_id,
      name: inst.name || 'Unknown institution',
      shortName: inst.name || 'Unknown institution',
      code: inst.institution_code || '',
      state: inst.state || '',
      district: inst.district || '',
      type: inst.type || '',
    },
    institutionCode: inst.institution_code || '',
    assignedOfficer: row.assigned_officer_id
      ? {
          id: row.assigned_officer_id,
          name: officer?.name || 'Assigned officer',
          email: officer?.email || '',
          bureau: bureau?.name || '',
        }
      : null,
    complainant: {
      name: row.complainant?.name || '—',
      email: row.complainant?.email || '—',
      phone: '',
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slaDueDate: row.sla_due_at,
    slaDays: row.sla_days ?? null,
    daysOverdue,
    slaBreached: daysOverdue > 0,
    escalationReason: null,
    attachments: [],
    comments: [],
    timeline: [],
  };
}

const HISTORY_TITLES = {
  SUBMITTED: 'Complaint Submitted',
  REVIEWED: 'Complaint Reviewed',
  ASSIGNED: 'Officer Assigned',
  STATUS_CHANGED: 'Status Updated',
  ESCALATED: 'Escalated',
  COMMENT_ADDED: 'Comment Added',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

/** Backend complaint_history rows -> timeline steps for ComplaintTimeline. */
export function mapHistory(rows, { isFinal = false } = {}) {
  const list = rows || [];
  return list.map((row, index) => {
    const isLast = index === list.length - 1;
    let description = row.comment || '';
    if (!description && row.action === 'STATUS_CHANGED' && row.old_status && row.new_status) {
      description = `Status changed from ${STATUS_LABELS[row.old_status] || row.old_status} to ${
        STATUS_LABELS[row.new_status] || row.new_status
      }.`;
    }
    if (!description && row.action === 'ASSIGNED') description = 'Assigned to the concerned officer.';
    return {
      title: HISTORY_TITLES[row.action] || row.action,
      date: row.created_at,
      description: row.performer?.name ? `${description} (${row.performer.name})`.trim() : description,
      completed: true,
      current: isLast && !isFinal,
    };
  });
}

function mapInstitution(row) {
  if (!row) return null;
  return {
    id: row.id,
    uuid: row.id,
    name: row.name,
    shortName: row.name,
    code: row.institution_code,
    state: row.state,
    district: row.district,
    type: row.type,
    status: row.status === 'INACTIVE' ? 'Inactive' : 'Active',
    totalComplaints: row.totalComplaints ?? 0,
    pending: row.pending ?? 0,
    resolved: row.resolved ?? 0,
  };
}

function mapOfficer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: ROLE_LABELS[row.role] || row.role,
    roleKey: row.role,
    bureau: row.bureaus?.name || 'Unassigned bureau',
    institution: row.institutions?.name || '—',
    institutionId: row.institution_id,
    bureauId: row.bureau_id,
    assigned: row.assigned ?? 0,
    pending: row.pending ?? 0,
    resolved: row.resolved ?? 0,
    slaBreaches: row.slaBreaches ?? 0,
    status: 'Active',
  };
}

const NOTIFICATION_TYPES = {
  COMPLAINT_ASSIGNED: 'info',
  STATUS_CHANGED: 'info',
  SLA_WARNING: 'warning',
  SLA_BREACH: 'critical',
  ESCALATION: 'warning',
  RESOLUTION: 'success',
};

function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: NOTIFICATION_TYPES[row.type] || 'info',
    typeKey: row.type,
    read: Boolean(row.is_read),
    complaintId: row.complaint?.complaint_number || null,
    createdAt: row.created_at,
    time: formatRelative(row.created_at),
  };
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function login({ email, password }) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  const data = response?.data || {};
  setSession({ token: data.access_token, user: data.user });
  return data.user;
}

export async function register(payload) {
  const response = await request('/auth/register', { method: 'POST', body: payload });
  const data = response?.data || {};
  if (data.access_token) setSession({ token: data.access_token, user: data.user });
  return data.user;
}

export async function logout() {
  try {
    if (getToken()) await request('/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}

export async function getCurrentUser() {
  if (!getToken()) return null;
  const response = await request('/auth/me');
  const user = response?.data?.user || null;
  if (user) setSession({ token: getToken(), user });
  return user;
}

/* ------------------------------------------------------------------ */
/* Complaints                                                          */
/* ------------------------------------------------------------------ */

export async function getComplaints(params = {}) {
  const response = await request('/complaints', {
    params: {
      ...params,
      status: params.status ? toStatusApi(params.status) : undefined,
      priority: params.priority ? toPriorityApi(params.priority) : undefined,
      category: params.category ? toCategoryApi(params.category) : undefined,
    },
  });
  const data = response?.data || {};
  return {
    complaints: (data.complaints || []).map(mapComplaint),
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

/** Accepts a UUID or a complaint number (CMP-10245). */
export async function getComplaintById(id) {
  const response = await request(`/complaints/${encodeURIComponent(id)}`);
  return mapComplaint(response?.data?.complaint);
}

/** Accepts a UUID or a complaint number. Returns timeline steps. */
export async function getComplaintHistory(id, options = {}) {
  const response = await request(`/complaints/${encodeURIComponent(id)}/history`);
  return mapHistory(response?.data?.history, options);
}

export async function createComplaint(payload) {
  const body = {
    title: payload.title,
    description: payload.description,
    category: toCategoryApi(payload.category),
    priority: toPriorityApi(payload.priority),
    institution_id: payload.institution_id,
    complainant: payload.complainant,
  };
  const response = await request('/complaints', { method: 'POST', body });
  return mapComplaint(response?.data?.complaint);
}

export async function updateComplaint(id, payload = {}) {
  const body = { ...payload };
  if (body.category) body.category = toCategoryApi(body.category);
  if (body.priority) body.priority = toPriorityApi(body.priority);
  const response = await request(`/complaints/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
  return mapComplaint(response?.data?.complaint);
}

export async function assignComplaint(id, { assignedOfficerId, assignedBureauId, comment }) {
  const response = await request(`/complaints/${encodeURIComponent(id)}/assign`, {
    method: 'PUT',
    body: {
      assigned_officer_id: assignedOfficerId,
      assigned_bureau_id: assignedBureauId,
      comment,
    },
  });
  return mapComplaint(response?.data?.complaint);
}

export async function updateComplaintStatus(id, { status, comment }) {
  const response = await request(`/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: { status: toStatusApi(status), comment },
  });
  return mapComplaint(response?.data?.complaint);
}

export async function escalateComplaint(id, { reason, escalatedTo } = {}) {
  const response = await request(`/complaints/${encodeURIComponent(id)}/escalate`, {
    method: 'POST',
    body: { reason, escalated_to: escalatedTo },
  });
  return mapComplaint(response?.data?.complaint);
}

export async function deleteComplaint(id) {
  return request(`/complaints/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/* ------------------------------------------------------------------ */
/* Institutions                                                        */
/* ------------------------------------------------------------------ */

export async function getInstitutions(params = {}) {
  const response = await request('/institutions', { params });
  const data = response?.data || {};
  return {
    institutions: (data.institutions || []).map(mapInstitution),
    pagination: data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 },
  };
}

export async function getInstitutionById(id) {
  const response = await request(`/institutions/${encodeURIComponent(id)}`);
  return mapInstitution(response?.data?.institution);
}

export async function createInstitution(payload) {
  const response = await request('/institutions', {
    method: 'POST',
    body: {
      name: payload.name,
      institution_code: payload.code || payload.institution_code,
      state: payload.state,
      district: payload.district,
      type: payload.type,
      status: String(payload.status || 'Active').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    },
  });
  return mapInstitution(response?.data?.institution);
}

export async function updateInstitution(id, payload) {
  const body = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.code !== undefined || payload.institution_code !== undefined) {
    body.institution_code = payload.code || payload.institution_code;
  }
  if (payload.state !== undefined) body.state = payload.state;
  if (payload.district !== undefined) body.district = payload.district;
  if (payload.type !== undefined) body.type = payload.type;
  if (payload.status !== undefined) {
    body.status = String(payload.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }
  const response = await request(`/institutions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
  });
  return mapInstitution(response?.data?.institution);
}

export async function deleteInstitution(id) {
  return request(`/institutions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/* ------------------------------------------------------------------ */
/* Officers                                                            */
/* ------------------------------------------------------------------ */

export async function getOfficers(params = {}) {
  const response = await request('/officers', { params });
  const data = response?.data || {};
  return {
    officers: (data.officers || []).map(mapOfficer),
    pagination: data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 },
  };
}

export async function getOfficerById(id) {
  const response = await request(`/officers/${encodeURIComponent(id)}`);
  return mapOfficer(response?.data?.officer);
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboardStats() {
  const response = await request('/dashboard/stats');
  return response?.data || {};
}

/** Returns { recent, trends, slaBreached, critical } with complaints mapped. */
export async function getDashboardComplaints(params = {}) {
  const response = await request('/dashboard/complaints', { params });
  const data = response?.data || {};
  const trends = (data.trends || []).map((t) => ({
    month: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    submitted: t.submitted ?? t.count ?? 0,
    resolved: t.resolved ?? 0,
  }));
  return {
    recent: (data.recent || []).map(mapComplaint),
    slaBreached: (data.slaBreached || []).map(mapComplaint),
    critical: (data.critical || []).map(mapComplaint),
    trends,
  };
}

export async function getDashboardCategories() {
  const response = await request('/dashboard/categories');
  const categories = response?.data?.categories || [];
  return categories.map((c) => ({
    category: CATEGORY_LABELS[c.category] || c.category,
    count: c.total,
    pending: c.pending,
    resolved: c.resolved,
    escalated: c.escalated,
    critical: c.critical,
  }));
}

export async function getDashboardBureaus() {
  const response = await request('/dashboard/bureaus');
  return response?.data?.bureaus || [];
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function getNotifications(params = {}) {
  const response = await request('/notifications', { params });
  const data = response?.data || {};
  return {
    notifications: (data.notifications || []).map(mapNotification),
    unreadCount:
      data.unreadCount ??
      (data.notifications || []).filter((n) => !n.is_read).length,
  };
}

export async function markNotificationRead(id) {
  const response = await request(`/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
  });
  return mapNotification(response?.data?.notification);
}

export async function markAllNotificationsRead() {
  const response = await request('/notifications/read-all', { method: 'PUT' });
  return response?.data?.updated ?? 0;
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export async function getHealth() {
  return request('/health');
}

export default {
  login,
  register,
  logout,
  getCurrentUser,
  getComplaints,
  getComplaintById,
  getComplaintHistory,
  createComplaint,
  updateComplaint,
  assignComplaint,
  updateComplaintStatus,
  escalateComplaint,
  deleteComplaint,
  getInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getOfficers,
  getOfficerById,
  getDashboardStats,
  getDashboardComplaints,
  getDashboardCategories,
  getDashboardBureaus,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
