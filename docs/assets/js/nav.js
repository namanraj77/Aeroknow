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
    { num: '11', title: 'Semantic SLAM',               href: '../modules/m11-semantic-slam.html' },
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
    { num: 'B03', title: 'The Brain of a Drone',       href: 'beginner/b03-autopilots-sensors.html',   done: false },
    { num: 'B04', title: 'When GPS Fails',             href: 'beginner/b04-when-gps-fails.html',       done: false },
    { num: 'B05', title: 'Eyes in the Sky',            href: 'beginner/b05-eyes-in-the-sky.html',      done: false },
    { num: 'B06', title: 'Teaching Drones to Think',   href: 'beginner/b06-teaching-drones.html',      done: false },
    { num: 'B07', title: 'Drones That See',            href: 'beginner/b07-drones-that-see.html',      done: false },
    { num: 'B08', title: 'Drones That Decide',         href: 'beginner/b08-drones-that-decide.html',   done: false },
    { num: 'B09', title: 'The Swarm',                  href: 'beginner/b09-the-swarm.html',            done: false },
    { num: 'B10', title: 'Building the Full System',   href: 'beginner/b10-building-the-system.html',  done: false },
  ];

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

    // Status indicator
    const statusDiv = document.createElement('div');
    statusDiv.className = 'nav-status';
    statusDiv.textContent = 'SIM ACTIVE';

    bar.appendChild(ul);
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

    window.addEventListener('scroll', function() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const inSubdir = path.includes('/modules/') || path.includes('/labs/') || path.includes('/beginner/');
    const basePath = inSubdir ? '../' : '';
    buildNav(basePath);
    buildProgressBar();
  });
})();