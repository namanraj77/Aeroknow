/* nn-viz.js — Three.js Neural Network Architecture Visualizer */

(function () {
  'use strict';

  window.NNViz = {
    init(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const W = container.clientWidth || 800;
      const H = 440;

      const scene    = new THREE.Scene();
      scene.background = new THREE.Color(0x010810);

      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
      camera.position.set(0, 0, 38);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x102030, 4));
      const pLight = new THREE.PointLight(0x00d4ff, 2, 60);
      pLight.position.set(0, 10, 20);
      scene.add(pLight);

      // ── Network Architecture: [3, 6, 8, 8, 6, 3] ──
      const LAYERS = [
        { name: 'Input',    size: 4,  color: 0x00ff9d },
        { name: 'Hidden 1', size: 7,  color: 0x00d4ff },
        { name: 'Hidden 2', size: 9,  color: 0x00d4ff },
        { name: 'Hidden 3', size: 9,  color: 0x00d4ff },
        { name: 'Hidden 4', size: 7,  color: 0x00d4ff },
        { name: 'Output',   size: 3,  color: 0xff3a3a },
      ];

      const X_SPREAD  = 10;
      const Y_SPREAD  = 2.2;
      const NODE_R    = 0.35;
      const startX    = -(LAYERS.length - 1) * X_SPREAD / 2;

      const nodeMeshes = [];   // [layerIdx][nodeIdx]
      const nodePositions = []; // world positions

      // Create nodes
      LAYERS.forEach((layer, li) => {
        const x = startX + li * X_SPREAD;
        const nodes = [];
        const positions = [];
        const offsetY = -(layer.size - 1) * Y_SPREAD / 2;

        for (let ni = 0; ni < layer.size; ni++) {
          const y = offsetY + ni * Y_SPREAD;

          const geo = new THREE.SphereGeometry(NODE_R, 16, 12);
          const mat = new THREE.MeshPhongMaterial({
            color: layer.color,
            emissive: layer.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.85,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, y, 0);
          scene.add(mesh);
          nodes.push(mesh);
          positions.push(new THREE.Vector3(x, y, 0));
        }
        nodeMeshes.push(nodes);
        nodePositions.push(positions);
      });

      // Create edges (connections between consecutive layers)
      const edgeMeshes = [];
      for (let li = 0; li < LAYERS.length - 1; li++) {
        const srcPositions = nodePositions[li];
        const dstPositions = nodePositions[li + 1];
        const layerEdges = [];

        srcPositions.forEach((src, si) => {
          dstPositions.forEach((dst, di) => {
            // Draw only a subset for readability (every other)
            if (LAYERS[li].size * LAYERS[li + 1].size > 40 && (si + di) % 2 !== 0) return;

            const pts = [src.clone(), dst.clone()];
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = new THREE.LineBasicMaterial({
              color: 0x0a3d5a,
              opacity: 0.35,
              transparent: true,
            });
            const line = new THREE.Line(geo, mat);
            scene.add(line);
            layerEdges.push({ line, mat, src, dst, si, di });
          });
        });
        edgeMeshes.push(layerEdges);
      }

      // ── Signal propagation animation ──
      let activationT = 0;  // 0→1 per pass
      let activeLayer = 0;
      let paused = false;
      let showWeights = false;
      let archMode = 'fc'; // fc | conv | lstm

      // Pulse ring on a node
      const rings = [];
      function spawnRing(pos, color) {
        const geo = new THREE.RingGeometry(NODE_R, NODE_R + 0.1, 16);
        const mat = new THREE.MeshBasicMaterial({ color, opacity: 1, transparent: true, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(geo, mat);
        ring.position.copy(pos);
        ring.position.z = 0.1;
        scene.add(ring);
        rings.push({ ring, mat, born: Date.now() });
      }

      // Controls
      [
        ['nn-btn-pause',   () => { paused = !paused; }],
        ['nn-btn-reset',   () => { activationT = 0; activeLayer = 0; }],
        ['nn-btn-weights', () => {
          showWeights = !showWeights;
          edgeMeshes.forEach(layer => layer.forEach(e => {
            e.mat.color.setHex(showWeights ? 0x005580 : 0x0a3d5a);
            e.mat.opacity = showWeights ? 0.6 : 0.35;
          }));
        }],
      ].forEach(([id, fn]) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); });

      // Rotate control
      let drag = false, pm = { x: 0, y: 0 };
      let rotY = 0, rotX = 0;
      renderer.domElement.addEventListener('mousedown', e => { drag = true; pm = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('mouseup', () => { drag = false; });
      window.addEventListener('mousemove', e => {
        if (!drag) return;
        rotY += (e.clientX - pm.x) * 0.008;
        rotX += (e.clientY - pm.y) * 0.005;
        rotX  = Math.max(-0.6, Math.min(0.6, rotX));
        pm = { x: e.clientX, y: e.clientY };
      });

      const clock = new THREE.Clock();
      let ringTimer = 0;

      function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();

        // Gentle auto-rotate if not dragging
        if (!drag) rotY += dt * 0.15;

        // Apply rotation
        const pivotY = new THREE.Matrix4().makeRotationY(rotY);
        const pivotX = new THREE.Matrix4().makeRotationX(rotX);
        const combined = pivotX.multiply(pivotY);
        scene.children.forEach(c => {
          if (c.isLight || c === renderer) return;
          // We rotate camera instead
        });
        camera.position.set(
          38 * Math.sin(rotY) * Math.cos(rotX),
          38 * Math.sin(rotX),
          38 * Math.cos(rotY) * Math.cos(rotX)
        );
        camera.lookAt(0, 0, 0);

        // Activation wave
        if (!paused) {
          activationT += dt * 0.5;
          if (activationT > 1) {
            activationT = 0;
            activeLayer = (activeLayer + 1) % LAYERS.length;
          }

          // Light up active layer nodes
          nodeMeshes.forEach((layer, li) => {
            layer.forEach((mesh, ni) => {
              const isActive = li === activeLayer;
              const prevActive = li === activeLayer - 1;
              mesh.material.emissiveIntensity = isActive ? 0.8 + Math.sin(activationT * Math.PI * 4) * 0.3
                                              : prevActive ? 0.4
                                              : 0.15;
              mesh.material.opacity = isActive ? 1 : prevActive ? 0.9 : 0.6;
            });
          });

          // Light up edges from previous → active layer
          edgeMeshes.forEach((layerEdges, li) => {
            const active = li === activeLayer - 1;
            layerEdges.forEach(e => {
              e.mat.opacity = active ? 0.7 + activationT * 0.3 : (showWeights ? 0.4 : 0.18);
              if (active) e.mat.color.setHex(0x00d4ff);
              else        e.mat.color.setHex(showWeights ? 0x005580 : 0x0a3d5a);
            });
          });

          // Spawn rings occasionally
          ringTimer += dt;
          if (ringTimer > 0.3) {
            ringTimer = 0;
            const layer = nodeMeshes[activeLayer];
            if (layer) {
              const ni = Math.floor(Math.random() * layer.length);
              spawnRing(layer[ni].position, LAYERS[activeLayer].color);
            }
          }
        }

        // Age rings
        for (let i = rings.length - 1; i >= 0; i--) {
          const { ring, mat, born } = rings[i];
          const age = (Date.now() - born) / 600;
          if (age > 1) {
            scene.remove(ring);
            rings.splice(i, 1);
            continue;
          }
          ring.scale.setScalar(1 + age * 3);
          mat.opacity = (1 - age) * 0.5;
        }

        // Telemetry
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('nn-active-layer', LAYERS[activeLayer]?.name || '');
        setEl('nn-layer-size',   LAYERS[activeLayer]?.size + ' neurons' || '');
        setEl('nn-total-params', '2,847');

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
