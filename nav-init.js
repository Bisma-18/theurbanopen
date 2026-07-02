/**
 * nav-init.js — Hamburger + Auth injection for every page.
 * Call after DOM is ready. Pass the active page ID string.
 */
function initPageNav() {
  const nav    = document.querySelector('nav');
  const links  = document.getElementById('navLinks');
  if (!nav || !links) return;

  // Inject hamburger before the links
  if (!document.getElementById('navHamburger')) {
    const hamburger = document.createElement('button');
    hamburger.className = 'nav-hamburger';
    hamburger.id = 'navHamburger';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    nav.insertBefore(hamburger, links);

    hamburger.addEventListener('click', () => {
      links.classList.toggle('open');
      hamburger.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        links.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  // Auth dropdown
  Auth.injectNavAuth();
}

document.addEventListener('DOMContentLoaded', initPageNav);
