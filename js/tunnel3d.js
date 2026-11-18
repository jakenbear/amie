// "Memory Lane": scroll-driven flight through floating photo planes (three.js).
// Without WebGL, or with reduced motion, the section stays a flat swipeable strip (built in main.js).
import * as T from '../vendor/three.min.js';

const sec = document.getElementById('tunnel');
const A = window.Amie;
const ids = window.AMIE_TUNNEL || [];
const byId = Object.fromEntries((window.AMIE_PHOTOS || []).map(p => [p.id, p]));
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

if (sec && ids.length && hasGL && !(A && A.reduce)) {
  try { init(); } catch (e) { console.warn('3D tunnel unavailable, using flat strip', e); sec.classList.add('flat'); }
}

function init() {
  const canvas = document.getElementById('tunnelCanvas');
  const sticky = sec.querySelector('.tunnel-sticky');
  const copy = document.getElementById('tunnelCopy');
  const yearEl = document.getElementById('tunnelYear');
  const mobile = matchMedia('(max-width: 700px)').matches;
  const renderer = new T.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = T.SRGBColorSpace;
  sec.classList.remove('flat');

  const BG = 0xf7f1e6;
  const scene = new T.Scene(); scene.background = new T.Color(BG); scene.fog = new T.Fog(BG, 3, 19);
  const camera = new T.PerspectiveCamera(60, 1, 0.1, 60);
  const SP = 2.3, R = mobile ? 1.15 : 2.0;
  const NEAR0 = mobile ? 0.9 : 0.3, NEARW = mobile ? 2.2 : 1.3;
  const START = 3, END = -(ids.length * SP) - 1;

  const items = ids.map((id, i) => {
    const p = byId[id] || { w: 4, h: 5 };
    const hgt = mobile ? 1.05 : 1.45, w = hgt * (p.w / p.h);
    const g = new T.Group();
    const a = i * 2.39996; // golden angle spiral
    g.position.set(Math.cos(a) * (mobile ? 1.55 : R * 1.25), Math.sin(a) * (mobile ? 1.25 : R * 0.75), -i * SP);
    g.rotation.set((Math.random() - 0.5) * 0.12, -g.position.x * 0.12, (Math.random() - 0.5) * 0.16);
    const frameMat = new T.MeshBasicMaterial({ color: 0xfffcf6, transparent: true }); const frame = new T.Mesh(new T.PlaneGeometry(w + 0.1, hgt + 0.22), frameMat); frame.position.set(0, -0.05, -0.005); g.add(frame);
    const mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const photo = new T.Mesh(new T.PlaneGeometry(w, hgt), mat); g.add(photo);
    scene.add(g);
    return { id, g, mat, frameMat, fade: 0, year: p.y, base: g.position.y, phase: Math.random() * 6, loaded: false, loading: false };
  });

  // lazy textures, nearest-first, limited concurrency
  const loader = new T.TextureLoader();
  let inflight = 0, wantLoad = false;
  const pump = () => {
    if (!wantLoad) return;
    const camZ = camera.position.z;
    const queue = items.filter(it => !it.loaded && !it.loading).sort((a, b) => Math.abs(a.g.position.z - camZ) - Math.abs(b.g.position.z - camZ));
    while (inflight < 4 && queue.length) {
      const it = queue.shift(); it.loading = true; inflight++;
      loader.load(`img/thumb/${it.id}.webp`, tex => {
        tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
        it.mat.map = tex; it.mat.needsUpdate = true; it.loaded = true; inflight--; pump();
      }, undefined, () => { inflight--; it.loading = false; it.loaded = true; pump(); });
    }
  };

  const resize = () => {
    const w = sticky.clientWidth, hgt = sticky.clientHeight;
    renderer.setSize(w, hgt, false); camera.aspect = w / hgt; camera.fov = w / hgt < 0.8 ? 72 : 60; camera.updateProjectionMatrix();
  };
  resize(); addEventListener('resize', resize);

  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  const progress = () => {
    const r = sec.getBoundingClientRect(); const total = sec.offsetHeight - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  };

  let visible = false, raf = 0, camZ = START, lastYear = '';
  const tick = now => {
    if (!visible) { raf = 0; return; }
    const p = progress();
    const target = START + (END - START) * p;
    camZ += (target - camZ) * 0.12;
    camera.position.set(Math.sin(p * 9) * 0.25 + mx * 0.6, Math.cos(p * 7) * 0.15 - my * 0.4, camZ);
    camera.rotation.set(-my * 0.06, -mx * 0.08, Math.sin(p * 6) * 0.06);
    items.forEach(it => {
      it.g.position.y = it.base + Math.sin(now / 1400 + it.phase) * 0.06;
      if (it.loaded && it.fade < 1) it.fade = Math.min(1, it.fade + 0.06);
      const dz = camZ - it.g.position.z, near = Math.min(1, Math.max(0, (dz - NEAR0) / NEARW));
      it.frameMat.opacity = near; it.mat.opacity = near * it.fade;
      it.g.visible = near > 0.01;
    });
    // nearest photo ahead -> year label
    const ahead = items.find(it => it.g.position.z < camZ - 1.5);
    const yr = ahead ? (ahead.year === 'bonus' ? '★' : ahead.year) : '';
    if (yr !== lastYear) { yearEl.textContent = yr; lastYear = yr; }
    copy.style.opacity = String(Math.max(0, 1 - p * 14));
    yearEl.style.opacity = p > 0.03 && p < 0.98 ? '.8' : '0';
    if ((now | 0) % 20 === 0) pump();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }), { rootMargin: '100px' }).observe(sec);
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { wantLoad = true; pump(); o.disconnect(); } }), { rootMargin: '1500px 0px' }).observe(sec);
  addEventListener('scroll', () => { if (visible) pump(); }, { passive: true });

  // click a photo -> lightbox (simple screen-space pick)
  const v = new T.Vector3();
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 2 - 1, y = -((e.clientY - r.top) / r.height * 2 - 1);
    let best = null, bd = 0.2;
    items.forEach(it => { const dz = camera.position.z - it.g.position.z; if (dz < 0.5 || dz > 14) return; v.copy(it.g.position).project(camera); const d = Math.hypot(v.x - x, v.y - y); if (d < bd + 0.15 / dz * 4 && (!best || dz < camera.position.z - best.g.position.z)) { best = it; } });
    if (best && A) A.openLB(ids, best.id);
  });
}
