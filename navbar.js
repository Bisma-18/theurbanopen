/**
 * navbar.js — Shared navbar builder for The Urban Open
 * Call buildNav(activePageId) on every page BEFORE auth.injectNavAuth()
 */

function buildNav(activePageId) {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const links = [
    { id: 'home',         href: 'index.html',        label: 'Home' },
    { id: 'leaderboard',  href: 'leaderboard.html',   label: 'Leaderboard' },
    { id: 'schedule',     href: 'schedule.html',      label: 'Schedule' },
    { id: 'players',      href: 'players.html',       label: 'Players' },
    { id: 'registration', href: 'registration.html',  label: 'Registration' },
    { id: 'contact',      href: 'contact.html',       label: 'Contact' },
  ];

  // Keep theme toggle if it exists, rebuild links
  const themeBtn = nav.querySelector('#theme-toggle');
  const metamaskSlot = nav.querySelector('.w3-nav-wallet');
  nav.innerHTML = '';

  // Hamburger toggle button
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.id = 'navHamburger';
  hamburger.setAttribute('aria-label', 'Toggle navigation');
  hamburger.innerHTML = `
    <span></span><span></span><span></span>
  `;
  nav.appendChild(hamburger);

  // Links wrapper
  const linksWrapper = document.createElement('div');
  linksWrapper.className = 'nav-links';
  linksWrapper.id = 'navLinks';

  links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    if (link.id === activePageId) a.classList.add('active');
    linksWrapper.appendChild(a);
  });

  nav.appendChild(linksWrapper);

  // Re-add theme toggle
  if (themeBtn) {
    nav.appendChild(themeBtn);
  } else {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    const saved = localStorage.getItem('theme');
    btn.textContent = saved === 'dark' ? '☀️ Light' : '🌙 Dark';
    nav.appendChild(btn);
  }

  // Re-add metamask slot if it was there
  if (metamaskSlot) nav.appendChild(metamaskSlot);

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    linksWrapper.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      linksWrapper.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });
}
