// 3D gift box intro (three.js). Falls back to the 2D CSS box if WebGL is missing or motion is reduced.
import * as T from '../vendor/three.min.js';

const gift = document.getElementById('gift');
const A = window.Amie;
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

if (gift && A && !A.isRevealed() && hasGL && !A.reduce) {
  try { init(); } catch (e) { console.warn('3D gift unavailable, using 2D box', e); gift.classList.remove('three'); }
}

function init() {
  const stage = document.getElementById('giftStage');
  const hint = document.getElementById('giftHint');
  const mobile = matchMedia('(max-width: 700px)').matches;
  const renderer = new T.WebGLRenderer({ antialias: !mobile || devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.75 : 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  gift.classList.add('three');
  hint.textContent = 'Drag to spin it · tap to open';

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 2.2, 8.2); camera.lookAt(0, 0.35, 0);
  scene.add(new T.HemisphereLight(0xfff8ee, 0xcbb69a, 1.6));
  const sun = new T.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 6, 5); scene.add(sun);
  const rim = new T.DirectionalLight(0xffd9c2, 0.9); rim.position.set(-4, 2, -3); scene.add(rim);

  const cream = new T.MeshStandardMaterial({ color: 0xfbf6ec, roughness: 0.55 });
  const lidMat = new T.MeshStandardMaterial({ color: 0xfffdf8, roughness: 0.5 });
  const red = new T.MeshStandardMaterial({ color: 0xc8332b, roughness: 0.35, metalness: 0.05 });

  const root = new T.Group(); root.position.y = -0.55; scene.add(root);
  const bodyG = new T.Group(); root.add(bodyG);
  bodyG.add(new T.Mesh(new T.BoxGeometry(2, 1.6, 2), cream));
  const rb1 = new T.Mesh(new T.BoxGeometry(0.34, 1.62, 2.02), red); bodyG.add(rb1);
  const rb2 = new T.Mesh(new T.BoxGeometry(2.02, 1.62, 0.34), red); bodyG.add(rb2);
  bodyG.position.y = 0.8;

  const lid = new T.Group();
  lid.add(new T.Mesh(new T.BoxGeometry(2.18, 0.42, 2.18), lidMat));
  lid.add(new T.Mesh(new T.BoxGeometry(0.36, 0.44, 2.2), red));
  lid.add(new T.Mesh(new T.BoxGeometry(2.2, 0.44, 0.36), red));
  const loopGeo = new T.TorusGeometry(0.34, 0.11, 12, 32);
  const l1 = new T.Mesh(loopGeo, red); l1.position.set(-0.32, 0.42, 0); l1.rotation.set(0, 0, 0.5); l1.scale.set(1, 1, 0.55); lid.add(l1);
  const l2 = new T.Mesh(loopGeo, red); l2.position.set(0.32, 0.42, 0); l2.rotation.set(0, 0, -0.5); l2.scale.set(1, 1, 0.55); lid.add(l2);
  const knot = new T.Mesh(new T.BoxGeometry(0.26, 0.24, 0.26), red); knot.position.y = 0.3; lid.add(knot);
  lid.position.y = 1.78; root.add(lid);

  // soft contact shadow
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g = sc.getContext('2d'); const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(90,60,30,.45)'); grd.addColorStop(1, 'rgba(90,60,30,0)'); g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const shTex = new T.TextureLoader().load(sc.toDataURL());
  const shadow = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.54; scene.add(shadow);

  // confetti (instanced)
  const N = mobile ? 160 : 260;
  const conf = new T.InstancedMesh(new T.PlaneGeometry(0.09, 0.15), new T.MeshBasicMaterial({ side: T.DoubleSide }), N);
  conf.visible = false; scene.add(conf);
  const palette = [0xc8332b, 0xf6d36b, 0xe9b8a4, 0xc9a77c, 0x9fd8ff, 0x55664a, 0xffffff, 0xffa8d9].map(c => new T.Color(c));
  const parts = Array.from({ length: N }, (_, i) => ({ p: new T.Vector3(), v: new T.Vector3(), r: new T.Vector3(), w: new T.Vector3() }));
  parts.forEach((_, i) => conf.setColorAt(i, palette[i % palette.length]));
  const dummy = new T.Object3D();

  // size
  const resize = () => { const w = stage.clientWidth, hgt = stage.clientHeight; renderer.setSize(w, hgt, false); camera.aspect = w / hgt; camera.fov = w / hgt < 0.8 ? 44 : 34; camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);

  // drag to spin with inertia
  let dragging = false, lx = 0, ly = 0, vx = 0.004, vy = 0, downX = 0, downY = 0, downT = 0, opened = false;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { dragging = true; lx = downX = e.clientX; ly = downY = e.clientY; downT = performance.now(); el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; vx = dx * 0.006; vy = dy * 0.004; root.rotation.y += vx; root.rotation.x = T.MathUtils.clamp(root.rotation.x + vy, -0.5, 0.5); });
  const up = e => {
    if (!dragging) return; dragging = false;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY), dt = performance.now() - downT;
    if (moved < 8 && dt < 600) open();
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', () => dragging = false);
  el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', 'Open your present');
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  document.getElementById('giftSkip').addEventListener('click', () => { opened = true; setTimeout(dispose, 1700); });

  // open: lid physics + confetti burst
  let lidV = new T.Vector3(), lidW = new T.Vector3(), openT = 0, squash = 0;
  function open() {
    if (opened) return; opened = true; openT = performance.now();
    A.startMusic();
    hint.textContent = '🎉';
    scene.attach(lid);
    lidV.set((Math.random() - 0.5) * 2.5, 7.5, 1.5 + Math.random()); lidW.set(-2 - Math.random() * 2, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3);
    squash = 1;
    const origin = new T.Vector3(0, 1.65, 0); root.localToWorld(origin);
    parts.forEach(q => {
      q.p.copy(origin).add(new T.Vector3((Math.random() - 0.5) * 1.4, Math.random() * 0.2, (Math.random() - 0.5) * 1.4));
      const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 6.5, up = 6 + Math.random() * 6;
      q.v.set(Math.cos(a) * s * 0.55, up, Math.sin(a) * s * 0.55 + 1.2);
      q.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      q.w.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
    });
    conf.visible = true;
    setTimeout(() => A.reveal({ confetti: false }), 1500);
    setTimeout(dispose, 3400);
  }

  let last = performance.now(), alive = true, raf = 0;
  function tick(now) {
    if (!alive) return;
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (!opened) {
      if (!dragging) { vx += (0.004 - vx) * 0.02; vy *= 0.92; root.rotation.y += vx; root.rotation.x *= 0.96; }
      root.position.y = -0.55 + Math.sin(now / 600) * 0.06;
      lid.position.y = 1.78 + Math.max(0, Math.sin(now / 260)) * (Math.sin(now / 1900) > 0.75 ? 0.08 : 0); // little "something inside" hop
    } else {
      // lid flight
      lidV.y -= 14 * dt; lid.position.addScaledVector(lidV, dt);
      lid.rotation.x += lidW.x * dt; lid.rotation.y += lidW.y * dt; lid.rotation.z += lidW.z * dt;
      // body squash & stretch spring
      squash *= Math.pow(0.02, dt);
      const s = Math.sin((now - openT) / 55) * squash * 0.18;
      bodyG.scale.set(1 + s * 0.5, 1 - s, 1 + s * 0.5);
      // confetti physics: gravity, air drag, flutter
      parts.forEach((q, i) => {
        q.v.y -= 9.8 * dt; q.v.multiplyScalar(Math.pow(0.18, dt));
        q.v.x += Math.sin(now / 200 + i) * 0.6 * dt;
        q.p.addScaledVector(q.v, dt); q.r.addScaledVector(q.w, dt);
        dummy.position.copy(q.p); dummy.rotation.set(q.r.x, q.r.y, q.r.z); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
      });
      conf.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function dispose() {
    if (!alive) return; alive = false; cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    [cream, lidMat, red, shadow.material, conf.material].forEach(m => m.dispose()); shTex.dispose();
    renderer.dispose();
  }
}
