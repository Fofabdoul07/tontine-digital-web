// ─── CONFIGURATION API ───────────────────────────────────────────────────────
const API_URL = 'https://tontine-digital-backend-2.onrender.com';

// Récupère le token JWT stocké
const getToken = () => localStorage.getItem('tontine_token');

// Headers avec authentification
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// Fonction générique d'appel API
const api = async (method, path, body = null) => {
  const options = {
    method,
    headers: authHeaders(),
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Erreur serveur');
  return data;
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const signup = (name, phone, password, email) =>
  api('POST', '/api/auth/signup', { name, phone, password, email });

export const login = (phone, password) =>
  api('POST', '/api/auth/login', { phone, password });

export const getMe = () => api('GET', '/api/auth/me');

// ─── TONTINES ─────────────────────────────────────────────────────────────────
export const getTontines = () => api('GET', '/api/tontines');

export const getTontine = (id) => api('GET', `/api/tontines/${id}`);

export const createTontine = (data) => api('POST', '/api/tontines', data);

export const joinTontine = (id) => api('POST', `/api/tontines/${id}/join`);

export const updateTontine = (id, data) => api('PATCH', `/api/tontines/${id}`, data);

// ─── PAIEMENTS ────────────────────────────────────────────────────────────────
export const initiatePayment = (data) => api('POST', '/api/payments/initiate', data);

export const getPaymentHistory = () => api('GET', '/api/payments/history');

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const getAdminStats = () => api('GET', '/api/admin/stats');

export const getAdminUsers = () => api('GET', '/api/admin/users');

export const getAdminTontines = () => api('GET', '/api/admin/tontines');

export const getAdminTransactions = () => api('GET', '/api/admin/transactions');

// ─── UTILS ────────────────────────────────────────────────────────────────────
export const saveToken = (token) => localStorage.setItem('tontine_token', token);

export const removeToken = () => localStorage.removeItem('tontine_token');

export const isLoggedIn = () => !!getToken();
