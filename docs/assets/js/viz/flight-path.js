/* flight-path.js — Three.js UAV trajectory simulation */

(function () {
  'use strict';

  window.FlightPathViz = {
    init(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const W = container.clientWidth || 800;
      const H = 420;

      // Scene
      const scene    = new THREE.Scene();
      scene.background = new THREE.Color(0x010810);
      scene.fog       = new THREE.Fog(0x010810, 80, 200);

      // Camera
      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
      camera.position.set(30, 25, 50);
      camera.lookAt(0, 5, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Grid (terrain)
      const gridHelper = new THREE.GridHelper(80, 40, 0x0a2a3a, 0x061520);
      scene.add(gridHelper);

      // Axes (small)
      const axesHelper = new THREE.AxesHelper(5);
      axesHelper.position.set(-35, 0, -35);
      scene.add(axesHelper);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x0a2040, 2);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0x00d4ff, 1.5);
      dirLight.position.set(20, 40, 20);
      scene.add(dirLight);

      // ── Waypoints ──
      const waypoints = [
        new THREE.Vector3(-30, 2, -20),
        new THREE.Vector3(-20, 8, -10),
        new THREE.Vector3(-5,  12,  0),
        new THREE.Vector3(  5, 15,  5),
        new THREE.Vector3( 15, 12, 10),
        new THREE.Vector3( 25,  8, 15),
        new THREE.Vector3( 30,  5, 20),
      ];

      // Smooth spline through waypoints
      const curve = new THREE.CatmullRomCurve3(waypoints);
      const pts   = curve.getPoints(200);

      // Trail line
      const trailGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const trailMat = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        opacity: 0.6,
        transparent: true,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      scene.add(trail);

      // Predicted path (dashed look — second curve, slightly different)
      const predPts = curve.getPoints(200).map((p, i) => {
        const t = i / 200;
        return new THREE.Vector3(p.x + Math.sin(t * 8) * 0.3, p.y, p.z);
      });
      const predGeo = new THREE.BufferGeometry().setFromPoints(predPts);
      const predMat = new THREE.LineBasicMaterial({ color: 0x00ff9d, opacity: 0.25, transparent: true });
      scene.add(new THREE.Line(predGeo, predMat));

      // Waypoint markers
      waypoints.forEach((wp, i) => {
        const geo = new THREE.SphereGeometry(0.4, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00ff9d : (i === waypoints.length - 1 ? 0xff3a3a : 0xffb700) });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(wp);
        scene.add(mesh);

        // Vertical drop line
        const dropGeo = new THREE.BufferGeometry().setFromPoints([wp, new THREE.Vector3(wp.x, 0, wp.z)]);
        const dropMat = new THREE.LineBasicMaterial({ color: 0xffb700, opacity: 0.2, transparent: true });
        scene.add(new THREE.Line(dropGeo, dropMat));
      });

      // ── UAV model (simple arrow/drone shape) ──
      const uavGroup = new THREE.Group();

      // Body
      const bodyGeo = new THREE.ConeGeometry(0.4, 1.5, 6);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x00d4ff, emissive: 0x003344 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      uavGroup.add(body);

      // Arms
      const armMat = new THREE.MeshBasicMaterial({ color: 0x3d6b7a });
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
        const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 2, 4);
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(sx * 0.9, 0, sz * 0.9);
        arm.rotation.z = Math.PI / 2;
        uavGroup.add(arm);

        // Rotor disc
        const rotorGeo = new THREE.CircleGeometry(0.3, 16);
        const rotorMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, opacity: 0.25, transparent: true, side: THREE.DoubleSide });
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.set(sx * 1.1, 0.15, sz * 1.1);
        rotor.rotation.x = -Math.PI / 2;
        uavGroup.add(rotor);
      }));

      scene.add(uavGroup);

      // ── State ──
      let t = 0;
      let paused = false;
      let speed = 1;
      let showTerrain = false;

      // Terrain (toggle-able height map)
      const terrainGeo = new THREE.PlaneGeometry(80, 80, 30, 30);
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 + Math.random() * 0.5);
      }
      terrainGeo.computeVertexNormals();
      const terrainMat = new THREE.MeshPhongMaterial({
        color: 0x0a2a1a,
        wireframe: true,
        opacity: 0.3,
        transparent: true,
      });
      const terrain = new THREE.Mesh(terrainGeo, terrainMat);
      terrain.rotation.x = -Math.PI / 2;
      terrain.visible = false;
      scene.add(terrain);

      // Orbit-like mouse drag
      let isDragging = false, prevMouse = { x: 0, y: 0 };
      let spherical = { theta: 0.6, phi: 0.5, r: 65 };

      renderer.domElement.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('mouseup', () => { isDragging = false; });
      window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const dx = (e.clientX - prevMouse.x) * 0.005;
        const dy = (e.clientY - prevMouse.y) * 0.005;
        spherical.theta -= dx;
        spherical.phi   = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi + dy));
        prevMouse = { x: e.clientX, y: e.clientY };
      });
      renderer.domElement.addEventListener('wheel', e => {
        spherical.r = Math.max(20, Math.min(150, spherical.r + e.deltaY * 0.05));
      });

      // ── Controls ──
      const controls = {
        togglePause() { paused = !paused; },
        setSpeed(s)   { speed = s; },
        toggleTerrain() { showTerrain = !showTerrain; terrain.visible = showTerrain; },
        reset()       { t = 0; },
      };

      // Wire controls to buttons
      const btnMap = {
        'fp-btn-pause':   () => controls.togglePause(),
        'fp-btn-slow':    () => controls.setSpeed(0.3),
        'fp-btn-normal':  () => controls.setSpeed(1),
        'fp-btn-fast':    () => controls.setSpeed(2.5),
        'fp-btn-terrain': () => controls.toggleTerrain(),
        'fp-btn-reset':   () => controls.reset(),
      };
      Object.entries(btnMap).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
      });

      // Telemetry update
      function updateTelemetry(pos, vel) {
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('fp-alt',  pos.y.toFixed(1) + ' m');
        setEl('fp-speed', (vel * 12).toFixed(1) + ' m/s');
        setEl('fp-dist',  (t * 100).toFixed(0) + ' m');
      }

      // Animation
      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();

        if (!paused) {
          t = (t + dt * speed * 0.04) % 1;
        }

        // Move UAV along path
        const uavPos = curve.getPoint(t);
        const uavTangent = curve.getTangent(t);
        uavGroup.position.copy(uavPos);

        // Orient along tangent
        const lookAt = uavPos.clone().add(uavTangent);
        uavGroup.lookAt(lookAt);
        uavGroup.rotateX(-Math.PI / 2);

        // Camera orbit
        const cx = spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        const cy = spherical.r * Math.cos(spherical.phi) + 5;
        const cz = spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        camera.position.set(cx, cy, cz);
        camera.lookAt(0, 5, 0);

        updateTelemetry(uavPos, speed);
        renderer.render(scene, camera);
      }

      animate();

      // Resize
      window.addEventListener('resize', () => {
        const w = container.clientWidth;
        camera.aspect = w / H;
        camera.updateProjectionMatrix();
        renderer.setSize(w, H);
      });
    }
  };
})();
