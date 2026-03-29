/* gnss-denied.js — Three.js VIO + terrain-aided navigation visualization */

(function () {
  'use strict';

  window.GNSSViz = {
    init(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const W = container.clientWidth || 800;
      const H = 450;

      const scene    = new THREE.Scene();
      scene.background = new THREE.Color(0x010810);
      scene.fog        = new THREE.Fog(0x010810, 120, 250);

      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500);
      camera.position.set(0, 55, 70);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // ── Terrain ──
      const TERRAIN_SIZE = 100;
      const TERRAIN_SEGS = 50;
      const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
      const tPos = terrainGeo.attributes.position;
      const heightMap = [];

      for (let i = 0; i < tPos.count; i++) {
        const x = tPos.getX(i);
        const z = tPos.getY(i);
        const h = (
          Math.sin(x * 0.07) * Math.cos(z * 0.06) * 5 +
          Math.sin(x * 0.15 + 1) * Math.sin(z * 0.13 + 2) * 3 +
          Math.cos(x * 0.04 - 1) * 4 +
          Math.random() * 0.5
        );
        tPos.setZ(i, h);
        heightMap.push(h);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshPhongMaterial({
        color: 0x0d2a1a,
        wireframe: false,
        flatShading: true,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.rotation.x = -Math.PI / 2;
      scene.add(terrainMesh);

      // Wireframe overlay
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x0a3d1e, wireframe: true, opacity: 0.3, transparent: true });
      const wireOverlay = new THREE.Mesh(terrainGeo.clone(), wireMat);
      wireOverlay.rotation.x = -Math.PI / 2;
      wireOverlay.position.y = 0.05;
      scene.add(wireOverlay);

      // ── Lights ──
      scene.add(new THREE.AmbientLight(0x0a2040, 3));
      const sun = new THREE.DirectionalLight(0x00d4ff, 1.2);
      sun.position.set(30, 50, 20);
      scene.add(sun);

      // ── True trajectory (smooth path) ──
      const trueWaypoints = [
        new THREE.Vector3(-40, 18, -40),
        new THREE.Vector3(-20, 15,  -20),
        new THREE.Vector3(  0, 18,   0),
        new THREE.Vector3( 20, 14,  20),
        new THREE.Vector3( 40, 16,  40),
      ];
      const trueCurve = new THREE.CatmullRomCurve3(trueWaypoints);
      const truePts   = trueCurve.getPoints(300);
      const trueGeo   = new THREE.BufferGeometry().setFromPoints(truePts);
      const trueLine  = new THREE.Line(trueGeo, new THREE.LineBasicMaterial({ color: 0x00ff9d, opacity: 0.9, transparent: true }));
      scene.add(trueLine);

      // ── IMU dead-reckoning path (drifting) ──
      const imuPts = truePts.map((p, i) => {
        const drift = i * 0.018;
        return new THREE.Vector3(
          p.x + Math.sin(i * 0.08) * drift,
          p.y,
          p.z + Math.cos(i * 0.06) * drift * 0.7
        );
      });
      const imuGeo  = new THREE.BufferGeometry().setFromPoints(imuPts);
      const imuLine = new THREE.Line(imuGeo, new THREE.LineBasicMaterial({ color: 0xff3a3a, opacity: 0.7, transparent: true }));
      scene.add(imuLine);

      // ── VIO-corrected path ──
      const vioPts = truePts.map((p, i) => {
        const smallDrift = i * 0.003;
        return new THREE.Vector3(
          p.x + Math.sin(i * 0.12) * smallDrift,
          p.y,
          p.z + Math.cos(i * 0.09) * smallDrift
        );
      });
      const vioGeo  = new THREE.BufferGeometry().setFromPoints(vioPts);
      const vioLine = new THREE.Line(vioGeo, new THREE.LineBasicMaterial({ color: 0x00d4ff, opacity: 0.85, transparent: true }));
      scene.add(vioLine);

      // ── Camera frustums (VIO feature points) ──
      const frustumGroup = new THREE.Group();
      for (let i = 0; i < truePts.length; i += 20) {
        const p = truePts[i];
        const geo = new THREE.ConeGeometry(1.5, 3, 4, 1, true);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, opacity: 0.12, transparent: true });
        const frustum = new THREE.Mesh(geo, mat);
        frustum.position.copy(p);
        frustum.rotation.x = Math.PI;
        frustumGroup.add(frustum);
      }
      scene.add(frustumGroup);

      // ── Feature points (tracked landmarks) ──
      const featureGeo = new THREE.BufferGeometry();
      const fPositions = [];
      for (let i = 0; i < 120; i++) {
        fPositions.push(
          (Math.random() - 0.5) * 90,
          Math.random() * 2,
          (Math.random() - 0.5) * 90,
        );
      }
      featureGeo.setAttribute('position', new THREE.Float32BufferAttribute(fPositions, 3));
      const featureMat = new THREE.PointsMaterial({ color: 0xffb700, size: 0.4, opacity: 0.7, transparent: true });
      scene.add(new THREE.Points(featureGeo, featureMat));

      // ── UAV ──
      const uavGrp = new THREE.Group();
      const uavBody = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 2, 6),
        new THREE.MeshPhongMaterial({ color: 0x00d4ff, emissive: 0x003344 })
      );
      uavBody.rotation.x = Math.PI / 2;
      uavGrp.add(uavBody);
      scene.add(uavGrp);

      // ── EKF Uncertainty Ellipsoid ──
      const ellipsoidGeo = new THREE.SphereGeometry(1, 16, 12);
      const ellipsoidMat = new THREE.MeshBasicMaterial({ color: 0xff3a3a, wireframe: true, opacity: 0.2, transparent: true });
      const ellipsoid = new THREE.Mesh(ellipsoidGeo, ellipsoidMat);
      scene.add(ellipsoid);

      // ── State ──
      let t = 0;
      let paused = false;
      let showImu = true, showVio = true, showFeatures = true, showFrustums = true;
      let mode = 'ekf'; // ekf | pure-imu | vio

      // Controls wiring
      [
        ['gn-btn-pause',    () => { paused = !paused; }],
        ['gn-btn-imu',      () => { showImu = !showImu; imuLine.visible = showImu; }],
        ['gn-btn-vio',      () => { showVio = !showVio; vioLine.visible = showVio; }],
        ['gn-btn-features', () => { showFeatures = !showFeatures; featureGeo.visible = showFeatures; }],
        ['gn-btn-frustums', () => { showFrustums = !showFrustums; frustumGroup.visible = showFrustums; }],
        ['gn-btn-reset',    () => { t = 0; }],
      ].forEach(([id, fn]) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); });

      // Orbit control
      let drag = false, pm = { x: 0, y: 0 };
      let sph = { theta: 0.3, phi: 0.55, r: 90 };
      renderer.domElement.addEventListener('mousedown', e => { drag = true; pm = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('mouseup', () => { drag = false; });
      window.addEventListener('mousemove', e => {
        if (!drag) return;
        sph.theta -= (e.clientX - pm.x) * 0.005;
        sph.phi    = Math.max(0.1, Math.min(1.4, sph.phi + (e.clientY - pm.y) * 0.005));
        pm = { x: e.clientX, y: e.clientY };
      });
      renderer.domElement.addEventListener('wheel', e => {
        sph.r = Math.max(30, Math.min(180, sph.r + e.deltaY * 0.05));
      });

      const clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        if (!paused) t = (t + dt * 0.03) % 1;

        // UAV position
        const uavPos = trueCurve.getPoint(t);
        uavGrp.position.copy(uavPos);
        const tan = trueCurve.getTangent(t);
        uavGrp.lookAt(uavPos.clone().add(tan));
        uavGrp.rotateX(-Math.PI / 2);

        // Uncertainty ellipsoid grows with IMU-only, shrinks with VIO correction
        const phase = (t * Math.PI * 6) % (Math.PI * 2);
        const uncertainty = 1 + 3 * Math.abs(Math.sin(phase * 0.5));
        ellipsoid.position.copy(uavPos);
        ellipsoid.scale.set(uncertainty, uncertainty * 0.6, uncertainty);
        ellipsoid.material.opacity = 0.05 + uncertainty * 0.04;

        // Camera
        const cx = sph.r * Math.sin(sph.phi) * Math.sin(sph.theta);
        const cy = sph.r * Math.cos(sph.phi) + 10;
        const cz = sph.r * Math.sin(sph.phi) * Math.cos(sph.theta);
        camera.position.set(cx, cy, cz);
        camera.lookAt(0, 5, 0);

        // Telemetry
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        const imuErr = (t * 300 * 0.018 * 1.5).toFixed(1);
        const vioErr = (t * 300 * 0.003 * 1.5).toFixed(2);
        setEl('gn-imu-err', imuErr + ' m');
        setEl('gn-vio-err', vioErr + ' m');
        setEl('gn-pos-x', uavPos.x.toFixed(1));
        setEl('gn-pos-z', uavPos.z.toFixed(1));

        renderer.render(scene, camera);
      }

      animate();

      window.addEventListener('resize', () => {
        const w = container.clientWidth;
        camera.aspect = w / H;
        camera.updateProjectionMatrix();
        renderer.setSize(w, H);
      });
    }
  };
})();
