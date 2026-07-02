/**
 * theme.js — Shared Dark Mode logic for The Urban Open
 * Include on every page. Call initTheme() on DOMContentLoaded.
 */
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Apply saved theme
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
    if (toggleBtn) toggleBtn.textContent = '☀️ Light';
  } else {
    root.removeAttribute('data-theme');
    if (toggleBtn) toggleBtn.textContent = '🌙 Dark';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        toggleBtn.textContent = '🌙 Dark';
      } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        toggleBtn.textContent = '☀️ Light';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initTheme);
