/**
 * API service layer — the single swap point for backend integration.
 *
 * Current state: the UI renders from src/data/mockData.js. Nothing imports
 * this module yet, and it performs no fake requests.
 *
 * Target architecture:
 *   React component -> src/services/api.js -> Node/Express -> Supabase (PostgreSQL)
 *
 * When the Express backend is ready:
 *   1. Set VITE_API_BASE_URL in .env (e.g. http://localhost:5000/api)
 *   2. Replace direct mockData imports in pages with calls from here.
 *   3. Add authentication headers once the auth backend exists.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Minimal fetch wrapper shared by every resource below.
 * Throws on network failure or non-2xx responses.
 */
async function request(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(API_BASE_URL + path, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      // Authorization headers will be added here after auth is implemented.
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${method} ${path} (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const complaintsApi = {
  list: (params) => request('/complaints', { params }),
  getById: (id) => request(`/complaints/${id}`),
  create: (payload) => request('/complaints', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/complaints/${id}`, { method: 'PATCH', body: payload }),
  assignOfficer: (id, officerId) =>
    request(`/complaints/${id}/assign`, { method: 'POST', body: { officerId } }),
  changeStatus: (id, status) =>
    request(`/complaints/${id}/status`, { method: 'POST', body: { status } }),
  escalate: (id, reason) => request(`/complaints/${id}/escalate`, { method: 'POST', body: { reason } }),
  resolve: (id, resolution) =>
    request(`/complaints/${id}/resolve`, { method: 'POST', body: { resolution } }),
};

export const institutionsApi = {
  list: (params) => request('/institutions', { params }),
  getById: (id) => request(`/institutions/${id}`),
  create: (payload) => request('/institutions', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/institutions/${id}`, { method: 'PATCH', body: payload }),
};

export const officersApi = {
  list: (params) => request('/officers', { params }),
  getById: (id) => request(`/officers/${id}`),
  create: (payload) => request('/officers', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/officers/${id}`, { method: 'PATCH', body: payload }),
};

export const analyticsApi = {
  overview: () => request('/analytics/overview'),
  trends: (params) => request('/analytics/trends', { params }),
};

export const notificationsApi = {
  list: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
};

export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};
