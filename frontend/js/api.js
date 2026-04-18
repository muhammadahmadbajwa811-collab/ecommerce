// js/api.js — shared helpers used by every page
// ─────────────────────────────────────────────────────────────

const API_URL = 'https://ecommerce-backend-62s2.onrender.com/api';

// ── Token helpers ─────────────────────────────────────────────
const getToken  = ()        => localStorage.getItem('token');
const getUser   = ()        => JSON.parse(localStorage.getItem('user') || 'null');
const saveAuth  = (t, u)    => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); };
const clearAuth = ()        => { localStorage.removeItem('token'); localStorage.removeItem('user'); };
const isLoggedIn = ()       => !!getToken();

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

// ── Product API ───────────────────────────────────────────────
const productAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/products?${q}`);
  },
  get: (id) => apiFetch(`/products/${id}`),
  categories: () => apiFetch('/products/categories'),
};

// ── Cart API ──────────────────────────────────────────────────
const cartAPI = {
  get:    ()                          => apiFetch('/cart'),
  add:    (product_id, quantity = 1)  => apiFetch('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  update: (id, quantity)              => apiFetch(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (id)                        => apiFetch(`/cart/${id}`, { method: 'DELETE' }),
  clear:  ()                          => apiFetch('/cart', { method: 'DELETE' }),
};

// ── Auth API ──────────────────────────────────────────────────
const authAPI = {
  register: (name, email, password) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login:    (email, password)       => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:       ()                      => apiFetch('/auth/me'),
};

// ── Order API ─────────────────────────────────────────────────
const orderAPI = {
  place:  (data) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) }),
  list:   ()     => apiFetch('/orders'),
  get:    (id)   => apiFetch(`/orders/${id}`),
};

// ═══════════════════════════════════════════════════════════════
//  UI UTILITIES
// ═══════════════════════════════════════════════════════════════

// ── Toast notifications ───────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '🔔' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Cart count badge ──────────────────────────────────────────
async function updateCartBadge() {
  if (!isLoggedIn()) return;
  try {
    const data = await cartAPI.get();
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = data.items.reduce((s, i) => s + i.quantity, 0);
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  } catch {}
}

// ── Render nav based on login state ──────────────────────────
function renderNav() {
  const user = getUser();
  const authArea = document.getElementById('nav-auth');
  if (!authArea) return;

  if (user) {
    authArea.innerHTML = `
      <span class="text-sm text-grey">Hi, ${user.name.split(' ')[0]}</span>
      <button class="btn-outline-sm" onclick="logout()">Logout</button>
    `;
  } else {
    authArea.innerHTML = `
      <a href="login.html" class="btn-outline-sm">Login</a>
      <a href="register.html" class="btn btn-primary" style="padding:0.4rem 1rem;font-size:0.85rem;">Sign Up</a>
    `;
  }
}

function logout() {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = 'index.html', 800);
}

// ── Require auth (redirect to login if not) ───────────────────
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ── Price formatter ───────────────────────────────────────────
const formatPrice = (n) => `$${parseFloat(n).toFixed(2)}`;

// ── Date formatter ────────────────────────────────────────────
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric'
});

// ── Stock label ───────────────────────────────────────────────
function stockLabel(stock) {
  if (stock === 0) return `<span class="product-stock out">Out of stock</span>`;
  if (stock < 5)  return `<span class="product-stock low">Only ${stock} left</span>`;
  return `<span class="product-stock">In stock (${stock})</span>`;
}

// ── Run on every page ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  updateCartBadge();
});