/* sensor-fusion.js — Three.js IMU + Camera + LiDAR sensor fusion visualization */

(function () {
  'use strict';

  window.SensorFusionViz = {
    init(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const W = container.clientWidth || 800;
      const H = 440;

      const scene    = new THREE.Scene();
      scene.background = new THREE.Color(0x010810);
      scene.fog        = new THREE.Fog(0x010810, 80, 160);

      const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 300);
      camera.position.set(0, 28, 45);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x0a2040, 3));
      const dLight = new THREE.DirectionalLight(0x00d4ff, 1.0);
      dLight.position.set(20, 30, 20);
      scene.add(dLight);

      // ── Ground plane ──
      const groundGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
      const groundMat = new THREE.MeshBasicMaterial({ color: 0x050f18, wireframe: true, opacity: 0.3, transparent: true });
      const ground    = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // ── UAV body ──
      const uavGroup = new THREE.Group();
      const uavBody  = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.4, 1.5),
        new THREE.MeshPhongMaterial({ color: 0x1a3a4a, emissive: 0x001a2a })
      );
      uavGroup.add(uavBody);

      // Four arms + rotors
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6),
          new THREE.MeshBasicMaterial({ color: 0x2a5a6a })
        );
        arm.rotation.z = Math.PI / 2;
        arm.position.set(sx * 1.1, 0, sz * 1.1);
        uavGroup.add(arm);

        const rotor = new THREE.Mesh(
          new THREE.CircleGeometry(0.45, 16),
          new THREE.MeshBasicMaterial({ color: 0x00d4ff, opacity: 0.2, transparent: true, side: THREE.DoubleSide })
        );
        rotor.position.set(sx * 1.3, 0.25, sz * 1.3);
        rotor.rotation.x = -Math.PI / 2;
        uavGroup.add(rotor);
      });

      uavGroup.position.set(0, 12, 0);
      scene.add(uavGroup);

      // ── IMU: acceleration vectors ──
      const imuGroup = new THREE.Group();

      function makeArrow(dir, color, len) {
        const arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, len, 6);
        const arrowMat = new THREE.MeshBasicMaterial({ color });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        const tipGeo = new THREE.ConeGeometry(0.12, 0.3, 6);
        const tip    = new THREE.Mesh(tipGeo, arrowMat);
        tip.position.y = len / 2 + 0.15;
        arrow.position.y = 0;
        const g = new THREE.Group();
        g.add(arrow); g.add(tip);
        g.lookAt(dir);
        return g;
      }

      const imuX = makeArrow(new THREE.Vector3(2,0,0), 0xff3a3a, 1.5);
      const imuY = makeArrow(new THREE.Vector3(0,2,0), 0x00ff9d, 1.5);
      const imuZ = makeArrow(new THREE.Vector3(0,0,2), 0x00d4ff, 1.5);
      imuGroup.add(imuX, imuY, imuZ);
      uavGroup.add(imuGroup);

      // ── Camera: frustum cone ──
      const camConeGeo = new THREE.ConeGeometry(4, 7, 4, 1, true);
      const camConeMat = new THREE.MeshBasicMaterial({ color: 0xffb700, wireframe: true, opacity: 0.15, transparent: true });
      const camCone    = new THREE.Mesh(camConeGeo, camConeMat);
      camCone.position.set(0, -3.5, 0);
      uavGroup.add(camCone);

      // Camera feature detection rays
      const cameraRays = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const pts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.sin(angle) * 3.5, -7, Math.cos(angle) * 3.5)
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0xffb700, opacity: 0.08, transparent: true });
        const ray = new THREE.Line(geo, mat);
        uavGroup.add(ray);
        cameraRays.push({ ray, mat });
      }

      // ── LiDAR: rotating scan plane ──
      const lidarGroup = new THREE.Group();
      uavGroup.add(lidarGroup);

      // Point cloud below
      const lidarPoints = [];
      const pcGeo = new THREE.BufferGeometry();
      const pcPositions = [];
      for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r     = Math.random() * 15;
        pcPositions.push(r * Math.cos(angle), -12 + Math.random() * 0.5, r * Math.sin(angle));
      }
      pcGeo.setAttribute('position', new THREE.Float32BufferAttribute(pcPositions, 3));
      const pcMat  = new THREE.PointsMaterial({ color: 0x00ff9d, size: 0.25, opacity: 0.7, transparent: true });
      const pointCloud = new THREE.Points(pcGeo, pcMat);
      uavGroup.add(pointCloud);

      // LiDAR scan ring
      const scanRingGeo = new THREE.RingGeometry(0.2, 12, 48);
      const scanRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff9d, opacity: 0.08, transparent: true, side: THREE.DoubleSide });
      const scanRing    = new THREE.Mesh(scanRingGeo, scanRingMat);
      scanRing.rotation.x = -Math.PI / 2;
      scanRing.position.y = -6;
      uavGroup.add(scanRing);

      // LiDAR beams (16 lines)
      const lidarBeams = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0,0,0),
          new THREE.Vector3(Math.cos(angle)*11, -11, Math.sin(angle)*11)
        ]);
        const mat = new THREE.LineBasicMaterial({ color: 0x00ff9d, opacity: 0.12, transparent: true });
        const beam = new THREE.Line(geo, mat);
        uavGroup.add(beam);
        lidarBeams.push({ beam, mat, angle });
      }

      // ── EKF Fusion Covariance ellipse ──
      const covGeo = new THREE.SphereGeometry(1.5, 16, 12);
      const covMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, opacity: 0.12, transparent: true });
      const covMesh = new THREE.Mesh(covGeo, covMat);
      covMesh.position.set(0, 12, 0);
      scene.add(covMesh);

      // ── State ──
      let paused = false;
      let showIMU = true, showCamera = true, showLidar = true, showPC = true;
      let lidarAngle = 0;

      [
        ['sf-btn-pause',  () => { paused = !paused; }],
        ['sf-btn-imu',    () => { showIMU = !showIMU;     imuGroup.visible = showIMU; }],
        ['sf-btn-camera', () => { showCamera = !showCamera; camCone.visible = showCamera; cameraRays.forEach(r => r.ray.visible = showCamera); }],
        ['sf-btn-lidar',  () => { showLidar = !showLidar; lidarBeams.forEach(b => b.beam.visible = showLidar); scanRing.visible = showLidar; }],
        ['sf-btn-cloud',  () => { showPC = !showPC; pointCloud.visible = showPC; }],
      ].forEach(([id, fn]) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); });

      // Orbit control
      let drag = false, pm = { x:0, y:0 };
      let sph = { theta: 0.2, phi: 0.55, r: 55 };
      renderer.domElement.addEventListener('mousedown', e => { drag=true; pm={x:e.clientX,y:e.clientY}; });
      window.addEventListener('mouseup', () => { drag=false; });
      window.addEventListener('mousemove', e => {
        if(!drag) return;
        sph.theta -= (e.clientX-pm.x)*0.005;
        sph.phi = Math.max(0.1, Math.min(1.4, sph.phi+(e.clientY-pm.y)*0.005));
        pm={x:e.clientX,y:e.clientY};
      });
      renderer.domElement.addEventListener('wheel', e => { sph.r=Math.max(25,Math.min(120,sph.r+e.deltaY*0.04)); });

      const clock = new THREE.Clock();
      let t = 0;

      function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        if (!paused) { t += dt; lidarAngle += dt * 3; }

        // UAV gentle bob + roll
        uavGroup.position.y = 12 + Math.sin(t * 0.8) * 0.6;
        uavGroup.rotation.z = Math.sin(t * 0.5) * 0.08;
        uavGroup.rotation.x = Math.sin(t * 0.4 + 1) * 0.05;

        // IMU arrows animate with acceleration
        imuGroup.rotation.y = t * 0.3;
        imuX.scale.y = 1 + Math.sin(t * 3) * 0.2;
        imuY.scale.y = 1 + Math.sin(t * 2 + 1) * 0.15;
        imuZ.scale.y = 1 + Math.cos(t * 2.5) * 0.18;

        // LiDAR spin
        lidarBeams.forEach((b, i) => {
          const angle = b.angle + lidarAngle;
          const pos = b.beam.geometry.attributes.position;
          pos.setXYZ(1, Math.cos(angle)*11, -11, Math.sin(angle)*11);
          pos.needsUpdate = true;
          b.mat.opacity = 0.05 + Math.abs(Math.sin(lidarAngle + i * 0.4)) * 0.2;
        });

        // Camera rays pulse
        cameraRays.forEach((r, i) => {
          r.mat.opacity = 0.04 + Math.abs(Math.sin(t * 1.5 + i * 0.5)) * 0.12;
        });

        // Covariance ellipsoid
        const cov = 0.8 + Math.sin(t * 0.6) * 0.3;
        covMesh.position.copy(uavGroup.position);
        covMesh.scale.set(cov * 2.5, cov, cov * 2.5);

        // Camera orbit
        const cx = sph.r * Math.sin(sph.phi) * Math.sin(sph.theta);
        const cy = sph.r * Math.cos(sph.phi) + 8;
        const cz = sph.r * Math.sin(sph.phi) * Math.cos(sph.theta);
        camera.position.set(cx, cy, cz);
        camera.lookAt(0, 5, 0);

        // Telemetry
        const setEl = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
        setEl('sf-imu-hz',  '1000 Hz');
        setEl('sf-cam-hz',  '30 Hz');
        setEl('sf-lidar-hz','10 Hz');
        setEl('sf-fused-hz','100 Hz');
        setEl('sf-pos-err', (0.05 + Math.abs(Math.sin(t*0.3))*0.03).toFixed(3) + ' m');

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
