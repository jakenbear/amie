// Secret Amie Stash: decrypts AES-256-GCM blobs in the browser with a PBKDF2-SHA256 key from the password.
(() => {
  const form = document.getElementById('stashForm'); if (!form) return;
  const pw = document.getElementById('stashPw'), btn = document.getElementById('stashBtn');
  const msg = document.getElementById('stashMsg'), vault = document.getElementById('vault'), gal = document.getElementById('stashGallery');
  const NOPE = [
    'Nope! Amie is guarding this one with her life.',
    'Wrong password. Somewhere, a chipmunk is laughing.',
    'Access denied. Try bribing her with a treat first.',
    'Incorrect. Amie gave you the side-eye.',
    'That’s not it. She’s pretending she didn’t hear you.'
  ];
  let tries = 0, busy = false;
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const dec = async (key, buf) => { const u = new Uint8Array(buf); return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12)); };
  const get = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error('fetch ' + r.status); return r.arrayBuffer(); };

  form.addEventListener('submit', async e => {
    e.preventDefault(); if (busy) return;
    if (!window.crypto || !crypto.subtle) { msg.textContent = 'This browser can’t open the stash (needs HTTPS and a modern browser).'; return; }
    busy = true; btn.disabled = true; btn.textContent = 'Sniffing…'; msg.textContent = ''; vault.classList.remove('shake');
    try {
      const meta = await (await fetch('stash/meta.json', { cache: 'no-cache' })).json();
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw.value), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(meta.salt), iterations: meta.iter }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      let manifest;
      try { manifest = JSON.parse(new TextDecoder().decode(await dec(key, await get('stash/manifest.bin')))); }
      catch (err) { throw Object.assign(new Error('bad'), { wrong: true }); }
      pw.value = '';
      vault.classList.add('open'); msg.textContent = 'Unlocked! 🎉';
      if (window.Amie && Amie.fire) Amie.fire();
      gal.innerHTML = `<h3 class="stash-title">${manifest.title}</h3><p class="stash-sub">${manifest.note}</p><div class="stash-grid"></div>`;
      const grid = gal.querySelector('.stash-grid'); const list = [];
      gal.hidden = false;
      setTimeout(() => vault.classList.add('gone'), 900);
      await Promise.all(manifest.items.map(async (it, i) => {
        const fig = document.createElement('figure'); fig.className = 'stash-tile'; fig.style.aspectRatio = `${it.w}/${it.h}`; fig.style.animationDelay = `${i * 50}ms`;
        grid.appendChild(fig);
        const blob = new Blob([await dec(key, await get('stash/' + it.f))], { type: 'image/webp' });
        const src = URL.createObjectURL(blob); list[i] = { src, cap: it.cap };
        const img = new Image(); img.alt = 'Amie and Lauren' + (it.cap ? ', ' + it.cap : ''); img.decoding = 'async'; img.src = src;
        fig.appendChild(img); fig.onclick = () => window.Amie && Amie.openLB(list.filter(Boolean), list.filter(Boolean).indexOf(list[i]));
        if (it.cap) { const c = document.createElement('figcaption'); c.textContent = it.cap; fig.appendChild(c); }
      }));
    } catch (err) {
      if (err.wrong) { msg.textContent = NOPE[tries++ % NOPE.length]; void vault.offsetWidth; vault.classList.add('shake'); pw.select(); }
      else msg.textContent = 'Couldn’t open the stash right now. Try again in a moment.';
    } finally { busy = false; btn.disabled = false; btn.textContent = 'Unlock 🔓'; }
  });
})();
