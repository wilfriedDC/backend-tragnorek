const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Helper fetch ──────────────────────────────────────────────────────────
const http = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // envoie les cookies de session
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.message || 'Erreur serveur.' };
  return { ok: true, ...data };
};

const getToken = () => localStorage.getItem('asso_token');

// ── Auth ──────────────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) =>
    http('POST', '/auth/login', { email, password }),

  register: (formData) =>
    http('POST', '/auth/register', formData),

  logout: () =>
    http('POST', '/auth/logout', null, getToken()),

  me: () =>
    http('GET', '/auth/me', null, getToken()),

  refresh: () =>
    http('POST', '/auth/refresh'),
};

// ── Members ───────────────────────────────────────────────────────────────
export const membersService = {
  getBureau: () =>
    http('GET', '/members/bureau'),

  getCommunity: (search = '') =>
    http('GET', `/members${search ? `?search=${search}` : ''}`),

  getPending: () =>
    http('GET', '/admin/members/pending', null, getToken()),

  approve: (id) =>
    http('PATCH', `/admin/members/${id}/approve`, null, getToken()),

  reject: (id) =>
    http('DELETE', `/admin/members/${id}/reject`, null, getToken()),

  updateProfile: (data) =>
    http('PATCH', '/members/me', data, getToken()),
};

// ── Events ────────────────────────────────────────────────────────────────
export const eventsService = {
  getUpcoming: () =>
    http('GET', '/events?status=upcoming'),

  getPast: () =>
    http('GET', '/events?status=past'),

  getRegistrations: () =>
    http('GET', '/admin/events/registrations', null, getToken()),

  registerForEvent: (eventId, formData) =>
    http('POST', `/events/${eventId}/register`, formData, getToken()),

  create: (eventData) =>
    http('POST', '/admin/events', eventData, getToken()),

  delete: (id) =>
    http('DELETE', `/admin/events/${id}`, null, getToken()),
};

// ── Gallery ───────────────────────────────────────────────────────────────
export const galleryService = {
  getAll: () =>
    http('GET', '/gallery', null, getToken()),
};

// ── Contact ───────────────────────────────────────────────────────────────
export const contactService = {
  sendMessage: (formData) =>
    http('POST', '/contact', formData),

  getMessages: () =>
    http('GET', '/admin/contact', null, getToken()),
};
