/* nav.js — Shared navigation logic */

(function () {
  'use strict';

  const MODULES = [
    { num: '01', title: 'UAV Systems Overview',       href: '../modules/m01-uav-systems.html' },
    { num: '02', title: 'Flight Dynamics',            href: '../modules/m02-flight-dynamics.html' },
    { num: '03', title: 'GNC Fundamentals',           href: '../modules/m03-gnc-fundamentals.html' },
    { num: '04', title: 'GNSS-Denied Navigation',     href: '../modules/m04-gnss-denied-nav.html' },
    { num: '05', title: 'Sensor Fusion',              href: '../modules/m05-sensor-fusion.html' },
    { num: '06', title: 'ML Foundations for UAV',     href: '../modules/m06-ml-foundations.html' },
    { num: '07', title: 'Deep Learning & Perception', href: '../modules/m07-deep-learning-uav.html' },
    { num: '08', title: 'Autonomy & Decision-Making', href: '../modules/m08-autonomy-decision.html' },
    { num: '09', title: 'Swarm Systems',              href: '../modules/m09-swarm-systems.html' },
    { num: '10', title: 'Systems Engineering',        href: '../modules/m10-systems-engineering.html' },
  ];

  function buildNav(basePath) {
    const bar = document.getElementById('main-nav');
    if (!bar) return;

    const logo = document.createElement('a');
    logo.className = 'nav-logo';
    logo.href = basePath + 'index.html';
    logo.innerHTML = 'AERO<span>KNOW</span>';
    bar.appendChild(logo);

    const ul = document.createElement('ul');
    ul.className = 'nav-links';

    // Home
    const homeLi = document.createElement('li');
    homeLi.innerHTML = `<a href="${basePath}index.html">Home</a>`;
    ul.appendChild(homeLi);

    // Modules dropdown
    const dropLi = document.createElement('li');
    dropLi.className = 'nav-dropdown';
    const dropA = document.createElement('a');
    dropA.href = '#';
    dropA.textContent = 'Modules ▾';
    dropLi.appendChild(dropA);

    const dropMenu = document.createElement('ul');
    dropMenu.className = 'nav-dropdown-menu';

    MODULES.forEach(m => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${basePath}${m.href.replace('../','')}">
        <span class="nav-module-num">M${m.num}</span>${m.title}
      </a>`;
      dropMenu.appendChild(li);
    });

    dropLi.appendChild(dropMenu);
    ul.appendChild(dropLi);

    // Status
    const statusDiv = document.createElement('div');
    statusDiv.className = 'nav-status';
    statusDiv.textContent = 'SIM ACTIVE';
    bar.appendChild(ul);
    bar.appendChild(statusDiv);

    // Highlight active
    const currentPath = window.location.pathname;
    bar.querySelectorAll('a').forEach(link => {
      if (link.href && currentPath.endsWith(link.getAttribute('href').split('/').pop())) {
        link.classList.add('active');
      }
    });
  }

  function buildProgressBar() {
    const wrap = document.createElement('div');
    wrap.className = 'progress-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.id = 'read-progress';
    wrap.appendChild(bar);
    document.body.insertBefore(wrap, document.body.firstChild);

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Detect base path: are we in /modules/ or root?
    const inModule = window.location.pathname.includes('/modules/');
    const basePath = inModule ? '../' : '';
    buildNav(basePath);
    buildProgressBar();
  });
})();
