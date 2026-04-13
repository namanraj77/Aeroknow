/* nav.js — Shared navigation logic */

(function () {
  'use strict';

  const MODULES = [
    { num: '01', title: 'UAV Systems Overview',       href: 'modules/m01-uav-systems.html' },
    { num: '02', title: 'Flight Dynamics',            href: 'modules/m02-flight-dynamics.html' },
    { num: '03', title: 'GNC Fundamentals',           href: 'modules/m03-gnc-fundamentals.html' },
    { num: '04', title: 'GNSS-Denied Navigation',     href: 'modules/m04-gnss-denied-nav.html' },
    { num: '05', title: 'Sensor Fusion',              href: 'modules/m05-sensor-fusion.html' },
    { num: '06', title: 'ML Foundations for UAV',     href: 'modules/m06-ml-foundations.html' },
    { num: '07', title: 'Deep Learning & Perception', href: 'modules/m07-deep-learning-uav.html' },
    { num: '08', title: 'Autonomy & Decision-Making', href: 'modules/m08-autonomy-decision.html' },
    { num: '09', title: 'Swarm Systems',              href: 'modules/m09-swarm-systems.html' },
    { num: '10', title: 'Systems Engineering',        href: 'modules/m10-systems-engineering.html' },
    { num: '11', title: 'Semantic SLAM',               href: 'modules/m11-semantic-slam.html' },
  ];

  const LABS = [
    { num: 'L01', title: 'Environment Setup',         href: 'labs/l01-environment-setup.html',   done: true  },
    { num: 'L02', title: 'ROS2 Fundamentals',         href: 'labs/l02-ros2-fundamentals.html',   done: true  },
    { num: 'L03', title: 'PX4 + MAVROS2',             href: 'labs/l03-px4-mavros2.html',         done: true  },
    { num: 'L04', title: 'Gazebo Simulation',         href: 'labs/l04-gazebo-simulation.html',   done: true  },
    { num: 'L05', title: 'GNSS-Denied Navigation',    href: 'labs/l05-gnss-denied-nav.html',     done: true  },
    { num: 'L06', title: 'Computer Vision Pipeline',  href: 'labs/l06-computer-vision.html',     done: true  },
    { num: 'L07', title: 'Custom GCS',                href: 'labs/l07-custom-gcs.html',          done: true  },
    { num: 'L08', title: 'Swarm Simulation',          href: 'labs/l08-swarm-simulation.html',    done: true  },
  ];

  const BEGINNER = [
    { num: 'B01', title: 'What Is a Drone?',          href: 'beginner/b01-what-is-a-drone.html',      done: true  },
    { num: 'B02', title: 'Why Drones Fly',             href: 'beginner/b02-why-drones-fly.html',       done: true },
    { num: 'B03', title: 'The Brain of a Drone',       href: 'beginner/b03-autopilots-sensors.html',   done: true },
    { num: 'B04', title: 'When GPS Fails',             href: 'beginner/b04-when-gps-fails.html',       done: true },
    { num: 'B05', title: 'Eyes in the Sky',            href: 'beginner/b05-eyes-in-the-sky.html',      done: true },
    { num: 'B06', title: 'Teaching Drones to Think',   href: 'beginner/b06-teaching-drones.html',      done: true },
    { num: 'B07', title: 'Drones That See',            href: 'beginner/b07-drones-that-see.html',      done: true},
    { num: 'B08', title: 'Drones That Decide',         href: 'beginner/b08-drones-that-decide.html',   done: true},
    { num: 'B09', title: 'The Swarm',                  href: 'beginner/b09-the-swarm.html',            done: false },
    { num: 'B10', title: 'Building the Full System',   href: 'beginner/b10-building-the-system.html',  done: false },
  ];

  const STORAGE_KEYS = {
    progress: 'aeroknow:progress:v1',
    theme: 'aeroknow:theme:v1',
    tocCollapsed: 'aeroknow:toc:collapsed:v1'
  };
  const PAGE_COMPLETE_THRESHOLD = 85;

  function getPageKey() {
    return window.location.pathname;
  }

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (_error) {
      return fallback;
    }
  }

  function readProgressStore() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.progress), { pages: {} });
  }

  function writeProgressStore(store) {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(store));
  }

  function updatePageProgress(patch) {
    const store = readProgressStore();
    const key = getPageKey();
    const current = store.pages[key] || {
      pagePath: key,
      scrollPct: 0,
      sectionsSeen: [],
      completedAt: null
    };

    const next = Object.assign({}, current, patch);
    if (typeof next.scrollPct === 'number' && next.scrollPct >= PAGE_COMPLETE_THRESHOLD && !next.completedAt) {
      next.completedAt = new Date().toISOString();
    }

    store.pages[key] = next;
    writeProgressStore(store);
    return store;
  }

  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function initTheme() {
    applyTheme(getSavedTheme());
  }

  function isTocCollapsed() {
    return localStorage.getItem(STORAGE_KEYS.tocCollapsed) === '1';
  }

  function setTocCollapsed(collapsed) {
    localStorage.setItem(STORAGE_KEYS.tocCollapsed, collapsed ? '1' : '0');
  }

  function buildNav(basePath) {
    const bar = document.getElementById('main-nav');
    if (!bar) return;

    // Logo
    const logo = document.createElement('a');
    logo.className = 'nav-logo';
    logo.href = basePath + 'index.html';
    logo.innerHTML = 'AEROKNOW';
    bar.appendChild(logo);

    const ul = document.createElement('ul');
    ul.className = 'nav-links';

    // Home
    const homeLi = document.createElement('li');
    homeLi.innerHTML = '<a href="' + basePath + 'index.html">Home</a>';
    ul.appendChild(homeLi);

    // Beginner Track dropdown
    const beginDrop = document.createElement('li');
    beginDrop.className = 'nav-dropdown';
    beginDrop.innerHTML = '<a href="#" style="color:var(--accent-amber);">Beginner \u25be</a>';
    const beginMenu = document.createElement('ul');
    beginMenu.className = 'nav-dropdown-menu';
    const beginHeader = document.createElement('li');
    beginHeader.innerHTML = '<span style="display:block;font-family:var(--font-mono);font-size:0.55rem;letter-spacing:0.2em;color:var(--accent-amber);padding:0.4rem 1rem 0.2rem;border-bottom:1px solid rgba(255,183,0,0.15);text-transform:uppercase;pointer-events:none;">Beginner Track</span>';
    beginMenu.appendChild(beginHeader);
    BEGINNER.forEach(function(b) {
      const li = document.createElement('li');
      const style = !b.done ? 'style="opacity:0.45;pointer-events:none;"' : '';
      const soon  = !b.done ? ' <span style="font-family:var(--font-mono);font-size:0.55rem;color:var(--text-muted);">SOON</span>' : '';
      li.innerHTML = '<a href="' + basePath + b.href + '" ' + style + '><span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--accent-amber);margin-right:0.5rem;">' + b.num + '</span>' + b.title + soon + '</a>';
      beginMenu.appendChild(li);
    });
    beginDrop.appendChild(beginMenu);
    ul.appendChild(beginDrop);

    // Modules dropdown
    const modDrop = document.createElement('li');
    modDrop.className = 'nav-dropdown';
    modDrop.innerHTML = '<a href="#">Modules \u25be</a>';
    const modMenu = document.createElement('ul');
    modMenu.className = 'nav-dropdown-menu';
    MODULES.forEach(function(m) {
      const li = document.createElement('li');
      li.innerHTML = '<a href="' + basePath + m.href + '">M' + m.num + ' ' + m.title + '</a>';
      modMenu.appendChild(li);
    });
    modDrop.appendChild(modMenu);
    ul.appendChild(modDrop);

    // Labs dropdown
    const labDrop = document.createElement('li');
    labDrop.className = 'nav-dropdown';
    labDrop.innerHTML = '<a href="#">Labs \u25be</a>';
    const labMenu = document.createElement('ul');
    labMenu.className = 'nav-dropdown-menu';
    LABS.forEach(function(l) {
      const li = document.createElement('li');
      li.innerHTML = '<a href="' + basePath + l.href + '">' + l.num + ' ' + l.title + (!l.done ? ' SOON' : '') + '</a>';
      labMenu.appendChild(li);
    });
    labDrop.appendChild(labMenu);
    ul.appendChild(labDrop);

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'nav-theme-toggle';
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    themeBtn.textContent = getSavedTheme() === 'light' ? 'DARK' : 'LIGHT';
    themeBtn.addEventListener('click', function () {
      const current = getSavedTheme();
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEYS.theme, next);
      applyTheme(next);
      themeBtn.textContent = next === 'light' ? 'DARK' : 'LIGHT';
    });

    // Status indicator
    const statusDiv = document.createElement('div');
    statusDiv.className = 'nav-status';
    statusDiv.id = 'progress-status';
    statusDiv.textContent = 'PROGRESS 0/0';

    bar.appendChild(ul);
    bar.appendChild(themeBtn);
    bar.appendChild(statusDiv);

    // Highlight active link
    const currentPath = window.location.pathname;
    bar.querySelectorAll('a[href]').forEach(function(link) {
      const href = link.getAttribute('href');
      if (href && href !== '#' && currentPath.endsWith(href.split('/').pop())) {
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

    let writeTimer = null;
    window.addEventListener('scroll', function() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';

      if (writeTimer) {
        window.clearTimeout(writeTimer);
      }
      writeTimer = window.setTimeout(function () {
        const store = updatePageProgress({ scrollPct: Math.max(0, Math.min(100, Number(pct.toFixed(2)))) });
        updateProgressStatus(store);
      }, 160);
    });
  }

  function updateProgressStatus(storeOverride) {
    const status = document.getElementById('progress-status');
    if (!status) return;
    const store = storeOverride || readProgressStore();
    const pages = Object.values(store.pages || {});
    const completed = pages.filter(function (page) { return Boolean(page.completedAt); }).length;
    status.textContent = 'PROGRESS ' + completed + '/' + pages.length;
  }

  function initSectionProgressTracking() {
    const anchors = Array.from(document.querySelectorAll('.section-anchor[id]'));
    if (!anchors.length) return;

    const seen = new Set((readProgressStore().pages[getPageKey()] || {}).sectionsSeen || []);
    const observer = new IntersectionObserver(function (entries) {
      let changed = false;
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.target && entry.target.id && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          changed = true;
        }
      });
      if (changed) {
        const store = updatePageProgress({ sectionsSeen: Array.from(seen) });
        updateProgressStatus(store);
      }
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0.05 });

    anchors.forEach(function (anchor) {
      observer.observe(anchor);
    });
  }

  function makeTocItem(anchor, index) {
    const heading = anchor.querySelector('h2, h3') || document.querySelector('h2[id="' + anchor.id + '"], h3[id="' + anchor.id + '"]');
    const text = heading ? heading.textContent.trim() : ('Section ' + (index + 1));
    return { id: anchor.id, text: text };
  }

  function slugifyHeading(text, fallbackIndex) {
    const clean = (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return clean || ('section-' + (fallbackIndex + 1));
  }

  function buildStickyToc() {
    const modulePage = document.querySelector('.module-page');
    if (!modulePage) return;

    let anchors = Array.from(document.querySelectorAll('.section-anchor[id]'));
    if (anchors.length < 2) {
      const headings = Array.from(modulePage.querySelectorAll('h2'));
      headings.forEach(function (heading, idx) {
        if (!heading.id) {
          heading.id = slugifyHeading(heading.textContent, idx);
        }
      });
      anchors = headings;
    }
    if (anchors.length < 2) return;

    if (modulePage.classList.contains('module-layout-main')) return;

    const layout = document.createElement('div');
    layout.className = 'module-layout';
    const aside = document.createElement('aside');
    aside.className = 'toc-sidebar';
    aside.innerHTML =
      '<div class="toc-header">' +
      '<div class="toc-title">Contents</div>' +
      '<button class="toc-toggle" type="button" aria-label="Toggle table of contents">Collapse</button>' +
      '</div>';

    const list = document.createElement('nav');
    list.className = 'toc-list';
    list.setAttribute('aria-label', 'Section table of contents');
    const tocItems = anchors.map(makeTocItem);
    tocItems.forEach(function (item, idx) {
      const link = document.createElement('a');
      link.className = 'toc-link';
      link.href = '#' + item.id;
      link.dataset.target = item.id;
      link.innerHTML = '<span class="toc-index">' + String(idx + 1).padStart(2, '0') + '</span>' + item.text;
      list.appendChild(link);
    });
    const path = window.location.pathname;
    const inSubdir = path.includes('/modules/') || path.includes('/labs/') || path.includes('/beginner/');
    const basePath = inSubdir ? '../' : '';
    const currentFile = getPageFilename();

    function buildJumpGroup(groupTitle, items, groupKey, expandedDefault) {
      const wrap = document.createElement('div');
      wrap.className = 'toc-jump-group' + (expandedDefault ? ' expanded' : '');
      wrap.dataset.group = groupKey;

      const headerBtn = document.createElement('button');
      headerBtn.type = 'button';
      headerBtn.className = 'toc-jump-header';
      headerBtn.setAttribute('aria-expanded', expandedDefault ? 'true' : 'false');
      headerBtn.innerHTML =
        '<span class="toc-jump-title">' + groupTitle + '</span>' +
        '<span class="toc-jump-chevron" aria-hidden="true">\u2304</span>';
      wrap.appendChild(headerBtn);

      const nav = document.createElement('nav');
      nav.className = 'toc-jump-list';

      if (expandedDefault && tocItems.length) {
        const inlineContents = document.createElement('div');
        inlineContents.className = 'toc-inline-contents';
        const inlineLabel = document.createElement('div');
        inlineLabel.className = 'toc-inline-label';
        inlineLabel.textContent = 'On this page';
        inlineContents.appendChild(inlineLabel);
        inlineContents.appendChild(list);
        nav.appendChild(inlineContents);
      }

      items.forEach(function (item) {
        const link = document.createElement('a');
        const itemFile = item.href.split('/').pop();
        link.className = 'toc-jump-link' + (itemFile === currentFile ? ' active' : '');
        link.href = basePath + item.href;
        link.textContent = item.num + ' ' + item.title;
        nav.appendChild(link);
      });
      wrap.appendChild(nav);

      headerBtn.addEventListener('click', function () {
        const parent = wrap.parentNode;
        if (!parent) return;
        Array.from(parent.querySelectorAll('.toc-jump-group')).forEach(function (groupEl) {
          const isTarget = groupEl === wrap;
          groupEl.classList.toggle('expanded', isTarget ? !groupEl.classList.contains('expanded') : false);
          const btn = groupEl.querySelector('.toc-jump-header');
          if (btn) btn.setAttribute('aria-expanded', groupEl.classList.contains('expanded') ? 'true' : 'false');
        });
      });

      return wrap;
    }

    const isModulePage = path.includes('/modules/');
    const isLabPage = path.includes('/labs/');
    const isBeginnerPage = path.includes('/beginner/');
    aside.appendChild(buildJumpGroup('Beginner Pages', BEGINNER, 'beginner', isBeginnerPage));
    aside.appendChild(buildJumpGroup('Module Pages', MODULES, 'modules', isModulePage));
    aside.appendChild(buildJumpGroup('Lab Pages', LABS, 'labs', isLabPage));

    const main = document.createElement('div');
    main.className = 'module-layout-main';

    modulePage.parentNode.insertBefore(layout, modulePage);
    layout.appendChild(aside);
    layout.appendChild(main);
    main.appendChild(modulePage);

    const toggleBtn = aside.querySelector('.toc-toggle');
    function syncTocState() {
      const collapsed = layout.classList.contains('toc-collapsed');
      toggleBtn.textContent = collapsed ? 'Expand' : 'Collapse';
      toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    if (isTocCollapsed()) {
      layout.classList.add('toc-collapsed');
    }
    syncTocState();
    toggleBtn.addEventListener('click', function () {
      layout.classList.toggle('toc-collapsed');
      const collapsed = layout.classList.contains('toc-collapsed');
      setTocCollapsed(collapsed);
      syncTocState();
    });

    const links = Array.from(layout.querySelectorAll('.toc-link'));
    const linkById = {};
    links.forEach(function (link) {
      linkById[link.dataset.target] = link;
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (link) { link.classList.remove('active'); });
          const active = linkById[entry.target.id];
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-22% 0px -70% 0px', threshold: 0 });

    anchors.forEach(function (anchor) { observer.observe(anchor); });
  }

  function getPageFilename() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || '';
  }

  function getTrackContext(pathname) {
    if (pathname.includes('/modules/')) {
      return { key: 'modules', title: 'Modules', items: MODULES };
    }
    if (pathname.includes('/labs/')) {
      return { key: 'labs', title: 'Labs', items: LABS };
    }
    if (pathname.includes('/beginner/')) {
      return { key: 'beginner', title: 'Beginner Track', items: BEGINNER };
    }
    return null;
  }

  function buildTrackNavigator(basePath) {
    const context = getTrackContext(window.location.pathname);
    if (!context) return;
    if (document.querySelector('.track-nav')) return;

    const filename = getPageFilename();
    const currentIdx = context.items.findIndex(function (item) {
      return item.href.split('/').pop() === filename;
    });
    if (currentIdx < 0) return;

    const prevItem = currentIdx > 0 ? context.items[currentIdx - 1] : null;
    const nextItem = currentIdx < context.items.length - 1 ? context.items[currentIdx + 1] : null;

    const section = document.createElement('section');
    section.className = 'track-nav';

    const top = document.createElement('div');
    top.className = 'track-nav-top';
    top.innerHTML = '<span class="track-nav-label">' + context.title + ' Navigator</span>';

    const links = document.createElement('div');
    links.className = 'track-nav-links';
    context.items.forEach(function (item, idx) {
      const a = document.createElement('a');
      a.className = 'track-nav-link' + (idx === currentIdx ? ' active' : '');
      a.href = basePath + item.href;
      a.innerHTML =
        '<span class="track-nav-link-title">' + item.num + ' ' + item.title + '</span>' +
        '<span class="track-nav-chevron" aria-hidden="true">\u2304</span>';
      links.appendChild(a);
    });

    const bottom = document.createElement('div');
    bottom.className = 'track-nav-bottom';
    const prev = document.createElement('a');
    prev.className = 'track-nav-prev';
    if (prevItem) {
      prev.href = basePath + prevItem.href;
      prev.textContent = '\u25c2 ' + prevItem.num + ' ' + prevItem.title;
    } else {
      prev.href = basePath + context.items[0].href;
      prev.textContent = '\u25c2 Start of ' + context.title;
    }
    const next = document.createElement('a');
    next.className = 'track-nav-next';
    if (nextItem) {
      next.href = basePath + nextItem.href;
      next.textContent = nextItem.num + ' ' + nextItem.title + ' \u25b8';
    } else {
      next.href = basePath + context.items[context.items.length - 1].href;
      next.textContent = 'End of ' + context.title + ' \u25b8';
    }
    bottom.appendChild(prev);
    bottom.appendChild(next);

    section.appendChild(top);
    section.appendChild(links);
    section.appendChild(bottom);

    const footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(section, footer);
    } else {
      document.body.appendChild(section);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    const path = window.location.pathname;
    const inSubdir = path.includes('/modules/') || path.includes('/labs/') || path.includes('/beginner/');
    const basePath = inSubdir ? '../' : '';
    buildNav(basePath);
    buildProgressBar();
    buildStickyToc();
    buildTrackNavigator(basePath);
    updatePageProgress({});
    initSectionProgressTracking();
    updateProgressStatus();
  });
})();