(() => {
  const P = window.AMIE_PHOTOS || [];
  const A = window.AMIE_ADMIRERS || [];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  const full = id => `img/full/${id}.webp`;
  const thumb = id => `img/thumb/${id}.webp`;
  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', year: 'numeric' }) : '';

  /* ---------- reveal observer ---------- */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  const watch = (el, delay = 0) => { el.style.transitionDelay = delay + 'ms'; io.observe(el); return el; };

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('.lb-cap', lb);
  let lbList = [], lbIdx = 0;
  const lbShow = () => { const it = lbList[lbIdx]; if (typeof it === 'object') { lbImg.src = it.src; lbCap.textContent = `${it.cap || ''} · ${lbIdx + 1} / ${lbList.length}`; } else { const p = byId[it]; lbImg.src = full(p.id); lbCap.textContent = `${fmt(p.d) || 'Date unknown'} · ${lbIdx + 1} / ${lbList.length}`; } lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = ''; };
  const openLB = (list, id) => { lbList = list; lbIdx = typeof id === 'number' ? id : Math.max(0, list.indexOf(id)); lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(); };
  const closeLB = () => { lb.hidden = true; document.body.style.overflow = ''; };
  const step = d => { lbIdx = (lbIdx + d + lbList.length) % lbList.length; lbShow(); };
  $('.lb-close', lb).onclick = closeLB; $('.lb-prev', lb).onclick = () => step(-1); $('.lb-next', lb).onclick = () => step(1);
  lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  let tx = 0; lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });

  const tile = (p, list, tag) => {
    const el = h(`<figure class="tile pop"><img src="${thumb(p.id)}" srcset="${thumb(p.id)} 420w, ${full(p.id)} 1200w" sizes="(min-width:1100px) 280px, (min-width:640px) 33vw, 50vw" width="${p.w}" height="${p.h}" alt="Amie${p.d ? ', ' + fmt(p.d) : ''}" loading="lazy" decoding="async">${tag ? `<span class="tag">${tag}</span>` : ''}</figure>`);
    el.onclick = () => openLB(list, p.id);
    return el;
  };
  const themeTag = { park: 'Park', hunt: 'On patrol', naps: 'Nap', dogs: 'With a suitor' };

  /* ---------- timeline ---------- */
  const CH = [
    { y: '2022', title: 'Gotcha Day', blurb: 'She arrived about ten years into a life we can only guess at, and moved in like she had always lived here. New home, new park, new everything. She sniffed all of it. Twice. The neighbourhood chipmunks did not yet know what was coming.', cover: 'a0082' },
    { y: '2023', title: 'First Winter With Us', blurb: 'A Jindo in her element: knee-deep in snow, nose-deep in leaves, and fully committed to every single stick in the ravine.', cover: 'a0541' },
    { y: '2024', title: 'Queen of the Park', blurb: 'Fan club growing. Patience for said fan club: shrinking. Naps: world class.', cover: 'a1123' },
    { y: '2025', title: 'Silver-Muzzle Princess Era', blurb: 'Dandelions, sunshine, the good harness, and a reputation that now arrives at the park before she does.', cover: 'a1494' },
    { y: '2026', title: 'Right Now', blurb: 'Almost fourteen, and still the whitest dog in any room. Still the fastest nose at the park. Still convinced the couch is hers. (It is.)', cover: 'a1687' },
    { y: 'bonus', title: 'Greatest Hits', blurb: 'Undated, unforgettable. The camera roll classics.', cover: 'a1769', label: '★' }
  ];
  const tl = $('#timeline');
  const INITIAL = innerWidth < 640 ? 10 : 16;
  CH.forEach((c, ci) => {
    const photos = P.filter(p => p.y === c.y);
    if (!photos.length) return;
    const ids = photos.map(p => p.id);
    const coverId = ids.includes(c.cover) ? c.cover : ids[0];
    const burstIds = ids.filter(i => i !== coverId).filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 14)) === 0).slice(0, 14).concat(coverId);
    const ch = h(`<article class="chapter">
      <div class="ch-top">
        <div class="ch-head reveal"><div class="ch-year">${c.label || c.y}</div><h3 class="ch-title">${c.title}</h3><p class="ch-blurb">${c.blurb}</p></div>
        <div class="burst reveal" role="button" tabindex="0" aria-label="Flip through ${c.title}">
          <img src="${full(coverId)}" alt="Amie, ${c.title}" loading="lazy" decoding="async">
          <span class="flip-hint">▶ Flip-book</span><span class="frame-count">${photos.length} photos</span>
        </div>
      </div>
      <div class="ch-body"><div class="grid"></div></div>
    </article>`);
    tl.appendChild(ch);
    ch.querySelectorAll('.reveal').forEach((el, i) => watch(el, i * 80));
    const grid = $('.grid', ch);
    const add = (from, to) => photos.slice(from, to).forEach((p, i) => grid.appendChild(watch(tile(p, ids, themeTag[p.t]), (i % 4) * 45)));
    add(0, INITIAL);
    if (photos.length > INITIAL) {
      const btn = h(`<button class="more-btn" type="button">Show all ${photos.length} from ${c.label ? 'the vault' : c.y} ↓</button>`);
      btn.onclick = () => { add(INITIAL, photos.length); btn.remove(); };
      $('.ch-body', ch).appendChild(btn);
    }
    // flip-book burst
    const burst = $('.burst', ch), bImg = $('img', burst), counter = $('.frame-count', burst);
    let running = false, preloaded = false;
    const preload = () => { if (preloaded) return; preloaded = true; burstIds.forEach(i => { const im = new Image(); im.src = thumb(i); }); const im = new Image(); im.src = full(coverId); };
    const play = () => {
      if (running || reduce) return; running = true; preload();
      let k = 0;
      const tick = () => {
        const id = burstIds[k];
        bImg.src = k === burstIds.length - 1 ? full(id) : thumb(id);
        counter.textContent = `${String(k + 1).padStart(2, '0')} / ${burstIds.length}`;
        k++;
        if (k < burstIds.length) setTimeout(tick, 85 + k * 4);
        else { burst.classList.remove('flash'); void burst.offsetWidth; burst.classList.add('flash'); counter.textContent = `${photos.length} photos`; running = false; }
      };
      tick();
    };
    burst.addEventListener('click', play);
    burst.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
    new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { preload(); } }), { rootMargin: '600px' }).observe(burst);
    new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { setTimeout(play, 250); o.disconnect(); } }), { threshold: 0.55 }).observe(burst);
  });

  /* ---------- naps ---------- */
  const napPicks = ['a0132', 'a0096', 'a0671', 'a0889', 'a1572', 'a0950', 'a1267', 'a0181', 'a1515', 'a0746', 'a1691', 'a1285', 'a0894', 'a1727'].filter(i => byId[i]);
  const medals = ['🥇 Curling', '🥇 Sprawl', '🥈 Croissant', '🏆 Big Yawn', '🥇 Donut', '🥉 Melt', '🥇 Belly Up', '🥈 Floor Rug', '🥇 Side-eye', '🥈 Loaf', '🥇 Dog Bed Gold', '🥈 Chin Rest', '🥇 Toy Pillow', '🥉 Faceplant'];
  const ns = $('#napStrip');
  napPicks.forEach((id, i) => { const el = h(`<figure class="nap pop"><img src="${full(id)}" alt="Amie napping" loading="lazy" decoding="async"><span class="medal">${medals[i] || '🥇 Napping'}</span></figure>`); el.onclick = () => openLB(napPicks, id); ns.appendChild(watch(el, i * 50)); });

  /* ---------- jindo facts ---------- */
  const FACTS = [
    { ico: '🇰🇷', t: 'A national treasure. Literally.', p: 'In 1962 South Korea designated the Jindo dog as Natural Monument No. 53, a protected national heritage breed.', cls: 'feature' },
    { ico: '🏝️', t: 'Island girl', p: 'The breed comes from Jindo Island, off the southwestern tip of the Korean Peninsula, where it lived and hunted for centuries.' },
    { photo: 'a0213' },
    { ico: '🧭', t: 'Loyal to a legendary degree', p: 'In 1993 a white Jindo named Baekgu was sold to a family about 300 km away. Seven months later she turned up back on Jindo Island at her original owner’s home, exhausted, having found her own way back.' },
    { ico: '🐗', t: 'Born hunter', p: 'Jindos were bred to hunt everything from rabbits to deer and wild boar, often in small packs. That prey drive is not a bug. It is a feature (sorry, chipmunks).' },
    { ico: '🧥', t: 'Double coat, double fluff', p: 'A soft, dense undercoat under a stiffer outer coat keeps them warm in winter. They “blow” the undercoat seasonally, which explains the fur tumbleweeds.' },
    { ico: '🐈', t: 'Basically a cat', p: 'Jindos are famously clean: they groom themselves, are known for being easy to house-train, and many will go to great lengths to avoid puddles and mud.' },
    { photo: 'a1124' },
    { ico: '💛', t: 'One-person (or two-person) dogs', p: 'Jindos tend to bond deeply with their own family and can be reserved, even aloof, with strangers. Earning a Jindo’s trust is a big deal.' },
    { ico: '🦘', t: 'Escape artists', p: 'Agile, athletic and very curious, Jindos are known for clearing surprising heights. Good fences make good Jindos.' },
    { ico: '⏳', t: 'Built to last', p: 'Jindos are a hardy, medium-sized breed and commonly live around 12 to 15 years. Amie is busy proving the upper end of that range.' },
    { ico: '🎨', t: 'Not always white', p: 'Jindos come in white, fawn, grey, black, black-and-tan and brindle. White and fawn are the most common. Amie, obviously, chose white.' }
  ];
  const fx = $('#facts'); let n = 0;
  FACTS.forEach((f, i) => {
    const el = f.photo
      ? h(`<div class="fact photo pop"><img src="${full(f.photo)}" alt="Amie, a Jindo" loading="lazy" decoding="async"></div>`)
      : h(`<div class="fact pop ${f.cls || ''}"><span class="n">${String(++n).padStart(2, '0')}</span><div class="ico">${f.ico}</div><h3>${f.t}</h3><p>${f.p}</p></div>`);
    if (f.photo) { el.style.cursor = 'zoom-in'; el.onclick = () => openLB([f.photo], f.photo); }
    fx.appendChild(watch(el, (i % 3) * 70));
  });

  /* ---------- white devil ---------- */
  const WANTED = [
    { id: 'a0215', alias: 'THE WHITE DEVIL', crime: 'Staring at the base of a tree for 45 minutes with intent.', reward: '1,000 ACORNS' },
    { id: 'a1123', alias: 'THE GHOST OF THE RAVINE', crime: 'Appearing silently. Disappearing silently. Leaving only fluff. Active for over a decade.', reward: '750 ACORNS' },
    { id: 'a0517', alias: 'THE SUNSET STALKER', crime: 'Patrolling at golden hour, when visibility is lowest and fluff is highest.', reward: '500 SUNFLOWER SEEDS' },
    { id: 'a1284', alias: 'THE NOSE', crime: 'Sniffing with malice aforethought. Burrow trespassing (nose only).', reward: '2 PEANUTS (FINAL OFFER)' },
    { id: 'a0786', alias: 'THE INNOCENT FACE', crime: 'Lulling victims into a false sense of security with those eyes.', reward: '1 PINECONE (LARGE)' },
    { id: 'a1769', alias: 'THE PALE MENACE', crime: 'Pretending to be a good girl to the humans. We know the truth.', reward: 'ETERNAL GLORY' }
  ].filter(w => byId[w.id]);
  const ww = $('#wanted');
  WANTED.forEach((w, i) => {
    const el = h(`<div class="wanted pop"><span class="pin"></span><h4>WANTED</h4><div class="dor">DEAD OR ASLEEP</div><div class="mug"><img src="${full(w.id)}" alt="Wanted poster of Amie" loading="lazy" decoding="async"></div><div class="alias">“${w.alias}”</div><p class="crime">${w.crime}</p><div class="reward">REWARD: ${w.reward}</div></div>`);
    ww.appendChild(watch(el, (i % 3) * 90));
  });
  const hunt = P.filter(p => p.t === 'hunt').map(p => p.id);
  const ev = $('#evidence');
  hunt.forEach((id, i) => { const p = byId[id]; const el = h(`<figure class="ev pop"><img src="${thumb(id)}" srcset="${thumb(id)} 420w, ${full(id)} 1200w" sizes="(min-width:800px) 25vw, 50vw" alt="Amie on chipmunk patrol" loading="lazy" decoding="async"><span class="stamp">CAM ${String(i + 1).padStart(2, '0')} · ${p.d ? p.d.slice(2) : '??'}</span><span class="rec"></span></figure>`); el.onclick = () => openLB(hunt, id); ev.appendChild(watch(el, (i % 4) * 50)); });
  const CHIP = [
    { ico: '🥜', t: 'Cheek pouches', p: 'Chipmunks stuff food into stretchy cheek pouches that can expand to about three times the size of their head. Very useful when fleeing a white devil.' },
    { ico: '🕳️', t: 'Underground mansions', p: 'Eastern chipmunk burrows can run for more than 3 metres, with separate chambers for sleeping and food storage, and hidden entrances.' },
    { ico: '📢', t: 'The alarm system', p: 'When a predator shows up, chipmunks sound off with rapid “chip” and lower “chuck” alarm calls to warn everyone nearby. Amie has heard them all.' },
    { ico: '❄️', t: 'Winter snack breaks', p: 'Chipmunks spend winter in a deep, torpid sleep in their burrows, waking every so often to snack from their stored cache.' },
    { ico: '🦓', t: 'Five stripes', p: 'The Eastern chipmunk has five dark stripes running down its back, which helps it blend into forest floors. It does not help against Jindos.' }
  ];
  const cf = $('#chipFacts');
  CHIP.forEach((c, i) => cf.appendChild(watch(h(`<div class="chip pop"><div class="ico">${c.ico}</div><h4>${c.t}</h4><p>${c.p}</p></div>`), i * 60)));

  /* ---------- admirers ---------- */
  const cards = $('#cards');
  A.forEach((a, i) => {
    if (!byId[a.photo]) return;
    const stats = Object.entries(a.stats || {}).map(([k, v]) => `<div class="stat"><span>${k}</span><span class="bar"><i style="--v:${Math.max(0, Math.min(100, v))}%"></i></span></div>`).join('');
    const el = h(`<div class="card pop ${(a.rarity || 'common').toLowerCase().replace(/\s+/g, '-').replace('holo-rare', '')}"><div class="card-in"><div class="card-face">
      <div class="card-top"><span class="card-name">${a.name}</span><span class="card-hp">♥ ${10 + ((i * 37) % 80)} HP</span></div>
      <div class="card-img"><img src="${full(a.photo)}" alt="${a.name} with Amie" loading="lazy" decoding="async"></div>
      <div class="card-type">${a.type || ''}</div><div class="card-title">${a.title || ''}</div>
      <div class="stats">${stats}</div><p class="card-bio">${a.bio || ''}</p>
      <div class="card-foot"><span>${a.rarity || 'Common'}</span><span>No. ${String(i + 1).padStart(3, '0')} / ${String(A.length).padStart(3, '0')}</span></div>
    </div><span class="holo"></span></div></div>`);
    $('.card-img', el).onclick = () => openLB(A.map(x => x.photo).filter(x => byId[x]), a.photo);
    const inner = $('.card-in', el);
    if (!reduce && matchMedia('(hover: hover)').matches) {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; inner.style.transform = `rotateY(${(x - .5) * 16}deg) rotateX(${(.5 - y) * 16}deg) scale(1.03)`; inner.style.setProperty('--hx', x * 100 + '%'); inner.style.setProperty('--hy', y * 100 + '%'); el.classList.add('tilting'); });
      el.addEventListener('pointerleave', () => { inner.style.transform = ''; el.classList.remove('tilting'); });
    }
    cards.appendChild(watch(el, (i % 4) * 70));
  });
  $('#admirers').appendChild(h(`<p class="footnote">* Amie has not returned any of their calls.</p>`));

  /* ---------- reveal static ---------- */
  document.querySelectorAll('.reveal').forEach(el => { if (!el.classList.contains('in')) io.observe(el); });

  /* ---------- nav dots ---------- */
  const dots = [...document.querySelectorAll('.dots a')], nav = $('.dots');
  const secs = dots.map(d => $(d.getAttribute('href')));
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = secs.indexOf(e.target); dots.forEach((d, j) => d.classList.toggle('on', i === j));
    nav.classList.toggle('dark', e.target.id === 'devil');
  }), { rootMargin: '-45% 0px -45% 0px' });
  secs.forEach(s => s && navIO.observe(s));

  /* ---------- confetti ---------- */
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], raf = 0;
  const colors = ['#c9a77c', '#e9b8a4', '#c8332b', '#f6d36b', '#fffcf6', '#55664a', '#9fd8ff'];
  const fire = () => {
    if (reduce) return;
    const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
    for (let i = 0; i < 180; i++) parts.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .75, vx: (Math.random() - .5) * 26 * devicePixelRatio, vy: -(12 + Math.random() * 20) * devicePixelRatio, s: (5 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length], paw: i % 9 === 0 });
    if (!raf) loop();
  };
  const loop = () => {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.y < cv.height + 40);
    parts.forEach(p => { p.vy += .55 * devicePixelRatio; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
      if (p.paw) { cx.font = `${p.s * 2.4}px serif`; cx.fillText('🐾', 0, 0); } else { cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
      cx.restore(); });
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
  };
  $('#confettiBtn').onclick = fire;
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { setTimeout(fire, 400); o.disconnect(); } }), { threshold: 0.6 }).observe($('.bday'));

  /* ======================= v2 additions ======================= */
  const body = document.body;

  /* ---------- music ---------- */
  const audioEl = $('#bgm'), muteBtn = $('#muteBtn');
  let actx = null, gain = null, muted = false, musicStarted = false, usingEl = false, bufP = null;
  const VOL = 0.5;
  const prefetch = () => bufP || (bufP = fetch(audioEl.getAttribute('src')).then(r => { if (!r.ok) throw new Error('audio ' + r.status); return r.arrayBuffer(); }));
  const playEl = () => { usingEl = true; audioEl.loop = true; audioEl.volume = VOL; audioEl.muted = muted; const p = audioEl.play(); if (p) p.catch(() => {}); };
  const trimLoop = b => { // find first/last audible sample so the loop is seamless
    const d = b.getChannelData(0), th = 0.003; let s = 0, e = d.length - 1;
    while (s < d.length && Math.abs(d[s]) < th) s++;
    while (e > s && Math.abs(d[e]) < th) e--;
    return [s / b.sampleRate, (e + 1) / b.sampleRate];
  };
  const startMusic = () => {
    if (musicStarted) return; musicStarted = true; muteBtn.hidden = false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return playEl();
    try {
      actx = new AC(); gain = actx.createGain(); gain.gain.value = 0; gain.connect(actx.destination);
      if (actx.state === 'suspended') actx.resume();
      prefetch().then(ab => new Promise((res, rej) => actx.decodeAudioData(ab, res, rej))).then(b => {
        const [ls, le] = trimLoop(b);
        const src = actx.createBufferSource(); src.buffer = b; src.loop = true; src.loopStart = ls; src.loopEnd = le;
        src.connect(gain); src.start(0, ls);
        gain.gain.setValueAtTime(0, actx.currentTime); gain.gain.linearRampToValueAtTime(muted ? 0 : VOL, actx.currentTime + 1.2);
      }).catch(() => { try { actx.close(); } catch (e) {} actx = null; playEl(); });
    } catch (e) { actx = null; playEl(); }
  };
  const setMuted = m => {
    muted = m; muteBtn.classList.toggle('muted', m);
    $('.mute-ico', muteBtn).textContent = m ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', m ? 'Unmute music' : 'Mute music');
    if (actx && gain) gain.gain.setTargetAtTime(m ? 0 : VOL, actx.currentTime, 0.08);
    if (usingEl) audioEl.muted = m;
  };
  muteBtn.onclick = () => setMuted(!muted);
  document.addEventListener('visibilitychange', () => {
    if (actx) document.hidden ? actx.suspend() : actx.resume();
    else if (usingEl) document.hidden ? audioEl.pause() : (!audioEl.ended && audioEl.play().catch(() => {}));
  });
  const idle = window.requestIdleCallback || (f => setTimeout(f, 1500));
  if (!(navigator.connection && navigator.connection.saveData)) idle(() => prefetch().catch(() => {}));

  /* ---------- gift / unwrap ---------- */
  const gift = $('#gift');
  let revealed = false;
  const reveal = ({ confetti = true } = {}) => {
    if (revealed) return; revealed = true;
    if (confetti) fire();
    gift.classList.add('opening');
    setTimeout(() => { gift.classList.add('gone'); body.classList.remove('locked'); }, confetti ? 650 : 50);
    setTimeout(() => { gift.remove(); document.dispatchEvent(new CustomEvent('amie:revealed')); }, 1600);
  };
  $('#giftFallback').onclick = () => { startMusic(); reveal(); };
  $('#giftSkip').onclick = () => { startMusic(); reveal({ confetti: false }); };
  addEventListener('keydown', e => { if (!revealed && (e.key === 'Enter' || e.key === ' ') && document.activeElement === body) { e.preventDefault(); startMusic(); reveal(); } });
  if (location.hash && location.hash !== '#top') { reveal({ confetti: false }); }

  window.Amie = { startMusic, reveal, fire, openLB, photos: P, reduce, isRevealed: () => revealed };

  /* ---------- memory tunnel picks + flat fallback ---------- */
  const tunnelPool = P.filter(p => p.t !== 'dogs');
  const TN = 36, stepT = tunnelPool.length / TN;
  const tunnelIds = Array.from({ length: TN }, (_, i) => tunnelPool[Math.floor(i * stepT)].id);
  window.AMIE_TUNNEL = tunnelIds;
  const tf = $('#tunnelFallback');
  tunnelIds.forEach(id => { const el = h(`<figure><img src="${thumb(id)}" alt="Amie" loading="lazy" decoding="async"></figure>`); el.onclick = () => openLB(tunnelIds, id); tf.appendChild(el); });

  /* ---------- parallax + progress ---------- */
  const prog = $('#progress');
  const heroPic = $('.hero picture'), heroText = $('.hero-text');
  const para = [...document.querySelectorAll('.ch-year, .devil-title, .section-head h2, .fact.photo img')];
  const speeds = new Map(para.map(el => [el, el.classList.contains('ch-year') ? 0.18 : el.classList.contains('wanted-wall') ? -0.05 : el.matches('.fact.photo img') ? 0.08 : 0.06]));
  document.querySelectorAll('.fact.photo img').forEach(i => { i.style.height = '116%'; i.style.top = '-8%'; });
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${H > 0 ? Math.min(1, y / H) : 0})`;
    if (reduce) return;
    if (y < innerHeight * 1.2) {
      heroPic.style.transform = `translate3d(0,${y * 0.35}px,0)`;
      heroText.style.transform = `translate3d(0,${y * -0.12}px,0)`;
      heroText.style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.7)));
    }
    const vh = innerHeight;
    para.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2) * speeds.get(el);
      el.style.translate = `0 ${off.toFixed(1)}px`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();
})();
