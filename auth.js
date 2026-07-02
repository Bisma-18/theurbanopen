/**
 * ============================================================
 * AUTH.JS — The Urban Open | Authentication System
 * ============================================================
 * Handles: Registration, Login, Logout, Session, Roles
 * Storage: localStorage (frontend-only, production-ready structure)
 * Roles: 'user' | 'admin'
 * ============================================================
 */

const Auth = (() => {

  // ── Storage Keys ──────────────────────────────────────────
  const USERS_KEY   = 'tuo_users';
  const SESSION_KEY = 'tuo_session';

  // ── Helpers ───────────────────────────────────────────────
  function hashPassword(password) {
    // Simple deterministic hash for localStorage (NOT for production backend)
    // In a real app, use bcrypt server-side. This simulates hashed storage.
    let hash = 0;
    const str = password + 'tuo_salt_2026';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(16);
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function generateId() {
    return 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ── Public API ────────────────────────────────────────────

  function register({ firstName, lastName, email, password, age }) {
    const users = getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, error: 'An account with this email already exists.' };

    const newUser = {
      id: generateId(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      age: parseInt(age),
      role: 'user',
      avatar: null,
      walletAddress: null,
      registrationDate: new Date().toISOString(),
      paymentHistory: [],
      bio: ''
    };

    users.push(newUser);
    saveUsers(users);
    return { success: true, user: sanitize(newUser) };
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'No account found with this email.' };
    if (user.passwordHash !== hashPassword(password)) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const session = {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: sanitize(user) };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getCurrentSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  }

  function getCurrentUser() {
    const session = getCurrentSession();
    if (!session) return null;
    const users = getUsers();
    const user = users.find(u => u.id === session.userId);
    return user ? sanitize(user) : null;
  }

  function isLoggedIn() {
    return getCurrentSession() !== null;
  }

  function isAdmin() {
    const session = getCurrentSession();
    return session && session.role === 'admin';
  }

  function updateProfile(updates) {
    const session = getCurrentSession();
    if (!session) return { success: false, error: 'Not logged in.' };

    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    // Only allow safe fields to be updated
    const allowed = ['firstName', 'lastName', 'bio', 'avatar', 'walletAddress', 'age'];
    allowed.forEach(k => {
      if (updates[k] !== undefined) users[idx][k] = updates[k];
    });

    saveUsers(users);
    return { success: true, user: sanitize(users[idx]) };
  }

  function changePassword(currentPassword, newPassword) {
    const session = getCurrentSession();
    if (!session) return { success: false, error: 'Not logged in.' };

    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    if (users[idx].passwordHash !== hashPassword(currentPassword)) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    users[idx].passwordHash = hashPassword(newPassword);
    saveUsers(users);
    return { success: true };
  }

  function requestPasswordReset(email) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'No account found with this email.' };

    // In production: send a real email. Here we store a reset token.
    const token = Math.random().toString(36).substr(2, 12).toUpperCase();
    const resets = JSON.parse(localStorage.getItem('tuo_resets') || '{}');
    resets[email.toLowerCase()] = { token, expires: Date.now() + 3600000 };
    localStorage.setItem('tuo_resets', JSON.stringify(resets));

    return { success: true, token }; // In production, only return success (not token)
  }

  function resetPassword(email, token, newPassword) {
    const resets = JSON.parse(localStorage.getItem('tuo_resets') || '{}');
    const record = resets[email.toLowerCase()];
    if (!record || record.token !== token || Date.now() > record.expires) {
      return { success: false, error: 'Invalid or expired reset token.' };
    }

    const users = getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return { success: false, error: 'User not found.' };

    users[idx].passwordHash = hashPassword(newPassword);
    saveUsers(users);

    delete resets[email.toLowerCase()];
    localStorage.setItem('tuo_resets', JSON.stringify(resets));
    return { success: true };
  }

  function addPayment(paymentRecord) {
    const session = getCurrentSession();
    if (!session) return;

    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return;

    users[idx].paymentHistory = users[idx].paymentHistory || [];
    users[idx].paymentHistory.unshift({
      ...paymentRecord,
      date: new Date().toISOString()
    });
    saveUsers(users);
  }

  function sanitize(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // ── Redirect Helpers ──────────────────────────────────────

  function requireLogin(redirectTo = 'login.html') {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  function requireAdmin(redirectTo = 'index.html') {
    if (!isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  // ── Nav Injection: call on every page ────────────────────
  function injectNavAuth() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Remove old auth links if any
    nav.querySelectorAll('.nav-auth-item').forEach(el => el.remove());

    const user = getCurrentUser();
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-auth-wrapper nav-auth-item';

    if (user) {
      const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
      wrapper.innerHTML = `
        <div class="nav-avatar-wrapper">
          <div class="nav-avatar" id="navAvatarBtn">
            ${user.avatar
              ? `<img src="${user.avatar}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
              : `<span>${initials}</span>`
            }
          </div>
          <div class="nav-dropdown" id="navDropdown">
            <div class="nav-dropdown-header">
              <strong>${user.firstName} ${user.lastName}</strong>
              <span class="nav-role-badge">${user.role}</span>
            </div>
            <a href="profile.html" class="nav-dropdown-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Profile
            </a>
            ${user.role === 'admin' ? `<a href="admin-dashboard.html" class="nav-dropdown-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Admin Panel
            </a>` : ''}
            <div class="nav-dropdown-divider"></div>
            <button class="nav-dropdown-item nav-logout-btn" id="navLogoutBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="nav-auth-buttons">
          <a href="login.html" class="nav-btn-login">Login</a>
          <a href="signup.html" class="nav-btn-register">Register</a>
        </div>
      `;
    }

    nav.appendChild(wrapper);

    // Toggle dropdown
    const avatarBtn = document.getElementById('navAvatarBtn');
    const dropdown = document.getElementById('navDropdown');
    if (avatarBtn && dropdown) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    // Logout
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'index.html';
      });
    }
  }

  return {
    register, login, logout,
    getCurrentSession, getCurrentUser, isLoggedIn, isAdmin,
    updateProfile, changePassword,
    requestPasswordReset, resetPassword,
    addPayment, requireLogin, requireAdmin,
    injectNavAuth
  };
})();
