/* Pulse Mini · time-based scenes (no scroll scrubbing), reveals, live illustrations, film */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // run a callback when an element enters / leaves the screen
  const watch = (el, fn, threshold = 0.25) => {
    if (!el) return;
    new IntersectionObserver(([en]) => fn(en.isIntersecting), { threshold }).observe(el);
  };

  /* ---------- native scrolling, gentle anchor glide ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- looping background videos: play on screen, pause off screen ---------- */
  $$('video[data-loop]').forEach(v => {
    watch(v, on => {
      if (on) {
        if (v.preload === 'none') v.preload = 'auto';
        if (!reduce) v.play().catch(() => {});
      } else v.pause();
    }, 0.05);
  });

  /* ---------- HERO SOUND (concept): synced to power-on.mp4 ----------
     In the clip the thumb lands on the power button at ~1.45s and holds it;
     the status light comes on at 3.29s (measured frame by frame).
     We play a soft button click on the press and a power-on chime as the light
     comes on. Sounds are synthesised with Web Audio, so there are no files to load.
     Only plays while the hero is on screen and the visitor has turned sound on. */
  (() => {
    const video = $('.hero__video');
    const btn = $('[data-hero-sound]'), label = $('[data-hero-sound-label]');
    const hero = video.closest('.hero');
    const CUES = [
      { t: 1.45, play: () => click() },
      { t: 3.29, play: () => chime() },
    ];
    let ctx = null, out = null, on = false, heroVisible = false, last = 0;

    const audio = () => {
      if (ctx) return ctx;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // master bus with a short airy echo, so the chime feels like it sits in a room
      out = ctx.createGain(); out.gain.value = 0.9;
      const delay = ctx.createDelay(); delay.delayTime.value = 0.16;
      const fb = ctx.createGain(); fb.gain.value = 0.28;
      const wet = ctx.createGain(); wet.gain.value = 0.35;
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3800;
      out.connect(ctx.destination);
      out.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(wet); wet.connect(ctx.destination);
      return ctx;
    };

    // tactile button click: a tiny filtered noise tick plus a short low thump
    function click() {
      const c = audio(), t = c.currentTime;
      const len = Math.floor(c.sampleRate * 0.03);
      const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      const n = c.createBufferSource(); n.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.2;
      const g = c.createGain(); g.gain.value = 0.5;
      n.connect(bp).connect(g).connect(out); n.start(t);
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.06);
      og.gain.setValueAtTime(0.35, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(og).connect(out); o.start(t); o.stop(t + 0.1);
    }

    // power-on chime: three rising notes (E5, B5, E6), soft bell tone
    function chime() {
      const c = audio(), t0 = c.currentTime;
      [[659.25, 0], [987.77, 0.11], [1318.51, 0.22]].forEach(([f, dt], i) => {
        const t = t0 + dt;
        [[1, 'sine', 0.22], [2, 'sine', 0.05], [1.001, 'triangle', 0.06]].forEach(([mult, type, vol]) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = type; o.frequency.value = f * mult;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(vol * (i === 2 ? 1.1 : 1), t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 2 ? 1.4 : 0.6));
          o.connect(g).connect(out); o.start(t); o.stop(t + 1.5);
        });
      });
      btn.classList.remove('ping'); void btn.offsetWidth; btn.classList.add('ping');
    }

    // watch the video's own clock; fire each cue once per loop as playback crosses it
    const check = now => {
      if (now < last) last = 0; // the loop wrapped back to the start
      if (on && heroVisible && !video.paused && document.visibilityState === 'visible') {
        CUES.forEach(c => { if (last < c.t && now >= c.t && now - c.t < 0.35) c.play(); });
      }
      last = now;
    };
    // backup: the video's own time updates (~4/s) catch cues if frame callbacks stall
    video.addEventListener('timeupdate', () => check(video.currentTime));
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      const onFrame = (_, meta) => { check(meta.mediaTime); video.requestVideoFrameCallback(onFrame); };
      video.requestVideoFrameCallback(onFrame);
    } else {
      const loop = () => { check(video.currentTime); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    const set = v => {
      on = v;
      btn.setAttribute('aria-pressed', String(v));
      label.textContent = v ? 'Sound on' : 'Sound off';
      if (v) {
        audio().resume();
        // turning sound on mid-loop: restart the clip so the press and chime are heard in sync
        if (video.currentTime > 1.2) { video.currentTime = 0; last = 0; }
        video.play().catch(() => {});
      } else if (ctx) ctx.suspend();
    };
    btn.addEventListener('click', () => set(!on));

    // silent off screen: only the hero gets to make this sound
    watch(hero, v => {
      heroVisible = v;
      if (!ctx) return;
      if (v && on) ctx.resume(); else ctx.suspend();
    }, 0.5);
    document.addEventListener('visibilitychange', () => { if (ctx && document.visibilityState !== 'visible') ctx.suspend(); else if (ctx && on && heroVisible) ctx.resume(); });
  })();

  /* ---------- MANIFESTO: words light up once, on a timer ---------- */
  const words = $('[data-words]');
  words.innerHTML = words.textContent.trim().split(/\s+/)
    .map((w, i) => `<span class="w" style="transition-delay:${(i * 0.045).toFixed(3)}s">${w}</span> `).join('');
  watch(words, on => { if (on) words.classList.add('is-read'); }, 0.4);

  /* ---------- EVERY ANGLE: the six shots cycle like a film ---------- */
  (() => {
    const sec = $('[data-turn]');
    const angles = $$('[data-angle]', sec);
    const rail = $$('[data-view]', sec);
    const callout = $('.turn__callout', sec);
    const cTitle = $('[data-callout-title]', sec), cBody = $('[data-callout-body]', sec), cDeg = $('[data-deg]', sec);
    const views = [
      ['Woven fabric shell', 'A tight acoustic weave that lets sound out and keeps grit and sand off the driver.'],
      ['Carabiner, built in', 'A stainless steel clip on a soft rubber loop. Hang it from a strap, a belt or a branch.'],
      ['USB-C, sealed in', 'The charging port sits inside the rubber base, so the IP67 seal stays whole.'],
      ['Made to be handled', 'Model PLM-01. Designed in California, finished in the same sage as the trail.'],
      ['A base that grips', 'Ribbed rubber that holds on wet rock and takes the knocks of a day outside.'],
      ['Three buttons', 'Power, Bluetooth, volume. One status light. Nothing to learn.'],
    ];
    // time per view; a data-hold="ms" attribute on the section overrides it (the demo video uses a slower pace)
    const hold = () => +sec.dataset.hold || 1800;
    let idx = 0, timer = null, running = false;

    const show = i => {
      idx = (i + angles.length) % angles.length;
      angles.forEach((img, k) => img.classList.toggle('is-on', k === idx));
      rail.forEach((b, k) => {
        b.classList.remove('is-on');
        if (k === idx) { void b.offsetWidth; b.classList.add('is-on'); } // restart the progress bar
        b.setAttribute('aria-pressed', String(k === idx));
      });
      cTitle.textContent = views[idx][0];
      cBody.textContent = views[idx][1];
      cDeg.textContent = `View ${String(idx + 1).padStart(2, '0')} / 0${angles.length}`;
      callout.classList.remove('swap'); void callout.offsetWidth; callout.classList.add('swap');
    };
    const start = () => {
      stop(); running = true;
      sec.style.setProperty('--hold', `${hold()}ms`);
      sec.classList.add('is-playing');
      timer = setInterval(() => show(idx + 1), hold());
    };
    const stop = () => { clearInterval(timer); running = false; sec.classList.remove('is-playing'); };

    rail.forEach(b => b.addEventListener('click', () => { show(+b.dataset.view); if (!reduce) start(); }));
    watch(sec, on => { if (on && !reduce) { show(idx); start(); } else stop(); }, 0.35);
  })();

  /* ---------- INSIDE: scroll-driven. The finished speaker comes apart as you scroll ---------- */
  const ex = $('[data-explode]');
  const slices = $$('.explode__slice', ex);
  const whole = $('[data-whole]', ex);
  const SRC = { w: 1920, x0: 740, y0: 175, cw: 425 };
  function layoutSlices() {
    const W = ex.clientWidth, s = W / SRC.cw, H = ex.clientHeight;
    slices.forEach(el => {
      const y0 = +el.dataset.y0, y1 = +el.dataset.y1;
      const top = (y0 - SRC.y0) * s, h = (y1 - y0) * s;
      Object.assign(el.style, {
        top: `${top}px`, height: `${h}px`,
        backgroundSize: `${SRC.w * s}px auto`,
        backgroundPosition: `${-SRC.x0 * s}px ${-y0 * s}px`,
      });
      el._c = top + h / 2; // centre of this part, used to gather parts toward the middle
    });
    // the assembled speaker photo, sized so its body matches the exploded shell
    const sf = s * (402 / 616);
    Object.assign(whole.style, {
      width: `${1920 * sf}px`,
      left: `${(946 - SRC.x0) * s - 960 * sf}px`,
      top: `${H * 0.5 - 617 * sf}px`,
    });
  }
  layoutSlices();

  const inside = $('[data-inside]');
  const parts = $$('li', $('[data-parts]', inside));
  const ss = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  function insideScene() {
    const r = inside.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) return; // off screen: skip the work
    const run = r.height - innerHeight;
    const p = run > 0 ? clamp(-r.top / run) : 0;
    const swap = ss(0.07, 0.17, p);   // photo hands over to the parts
    const e = ss(0.1, 0.7, p);        // parts spread apart
    const C = ex.clientHeight * 0.5;
    whole.style.opacity = 1 - swap;
    whole.style.transform = `scale(${1 - swap * 0.04})`;
    slices.forEach(el => {
      el.style.opacity = swap;
      el.style.transform = `translate3d(0,${(C - el._c) * 0.2 * (1 - e)}px,0)`;
    });
    let cur = -1;
    parts.forEach((li, i) => { const on = p > 0.16 + i * 0.12; li.classList.toggle('is-on', on); if (on) cur = i; });
    parts.forEach((li, i) => li.classList.toggle('is-current', i === Math.max(cur, 0)));
  }

  /* ---------- NAV tone ---------- */
  const nav = $('[data-nav]');
  function navScene() {
    const y = 40;
    const dark = [...$$('.hero, .chapter, .outside, .film, .foot'), ...$$('.finishes[data-finish="midnight"]')]
      .some(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    nav.classList.toggle('is-dark', dark);
  }

  // one rAF-throttled pass per scroll frame, on native scrolling (no smoothing lag)
  let queued = false;
  const frame = () => { queued = false; insideScene(); navScene(); };
  const render = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', render, { passive: true });
  addEventListener('resize', () => { layoutSlices(); render(); });
  addEventListener('load', () => { layoutSlices(); frame(); });
  frame();

  /* ---------- reveals ---------- */
  const revIO = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); revIO.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach(el => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', `${Math.max(0, sibs.indexOf(el)) * 0.07}s`);
    revIO.observe(el);
  });

  /* ---------- live illustrations: only animate while visible ---------- */
  const live = new Map();
  const liveIO = new IntersectionObserver(es => es.forEach(en => {
    en.target.classList.toggle('is-live', en.isIntersecting);
    const fn = live.get(en.target);
    if (fn) fn(en.isIntersecting);
  }), { threshold: 0.25 });
  $$('[data-live]').forEach(el => liveIO.observe(el));
  const onLive = (el, fn) => { if (el) live.set(el, fn); };

  // count-up for the big "10"
  $$('[data-count]').forEach(el => {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const end = +el.dataset.count, t0 = performance.now(), dur = reduce ? 1 : 1600;
      const step = now => {
        const k = clamp((now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  // battery widget drains a little, gently
  (() => {
    const card = $('.batt'), pct = $('[data-batt-pct]'), fill = $('[data-batt-fill]'), left = $('[data-batt-left]');
    let timer = null, v = 100;
    const draw = () => {
      pct.textContent = `${v}%`;
      fill.style.transform = `scaleX(${v / 100})`;
      const mins = Math.round(600 * v / 100);
      left.textContent = `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m left`;
    };
    onLive(card, on => {
      clearInterval(timer);
      if (!on) return;
      timer = setInterval(() => { if (v > 82) { v--; draw(); } else clearInterval(timer); }, 160);
    });
    draw();
  })();

  // IP67 timer
  (() => {
    const card = $('.card--water'), out = $('[data-timer]'), ring = $('.timer__ring');
    let timer = null, s = 0;
    onLive(card, on => {
      clearInterval(timer);
      if (!on) return;
      timer = setInterval(() => {
        s = (s + 30) % 1830;
        out.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        ring.style.setProperty('--t', s / 1800);
      }, 90);
    });
  })();

  // Bluetooth pairing loop
  (() => {
    const pair = $('.pair'), state = $('[data-pair-state]'), devs = $$('.devices span');
    const card = pair.closest('.card');
    let timer = null, k = 0;
    const tick = () => {
      const phase = k % 3;
      if (phase === 0) { pair.classList.remove('ok'); state.textContent = 'Searching…'; }
      if (phase === 1) { pair.classList.add('ok'); state.textContent = `Connected · ${devs[(k / 3 | 0) % 3].textContent}`; devs.forEach((d, i) => d.classList.toggle('on', i === ((k / 3 | 0) % 3))); }
      k++;
    };
    onLive(card, on => { clearInterval(timer); if (on) { tick(); timer = setInterval(tick, 1500); } });
  })();

  // EQ bars
  (() => {
    const eq = $('[data-eq]');
    const n = innerWidth < 640 ? 32 : 44;
    eq.innerHTML = Array.from({ length: n }, (_, i) => {
      const env = Math.sin((i / n) * Math.PI) * 0.7 + 0.3;
      return `<i style="--h:${(env * (0.55 + Math.random() * 0.45)).toFixed(2)};--d:${(0.6 + Math.random() * 1.1).toFixed(2)}s;animation-delay:${(-Math.random() * 2).toFixed(2)}s"></i>`;
    }).join('');
  })();

  // USB-C charge
  (() => {
    const out = $('[data-charge]'), card = out.closest('.card');
    let timer = null, v = 64;
    onLive(card, on => {
      clearInterval(timer);
      if (!on) return;
      timer = setInterval(() => { v = v >= 100 ? 64 : v + 1; out.textContent = v >= 100 ? 'Fully charged' : `Charging · ${v}%`; }, 260);
    });
  })();

  // Interactive controls: the speaker's real buttons
  (() => {
    const box = $('[data-controls]');
    const ledEl = $('[data-hot-led]', box), toast = $('[data-toast]', box), toastText = $('[data-toast-text]', box);
    const vol = $('[data-vol]', box), bars = $$('span', vol);
    let power = true, level = 5, tTimer, vTimer, bTimer;
    const say = msg => {
      toastText.textContent = msg; toast.classList.add('show');
      clearTimeout(tTimer); tTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    };
    const drawVol = () => bars.forEach((b, i) => b.classList.toggle('on', i < level));
    drawVol();
    box.addEventListener('click', e => {
      const btn = e.target.closest('[data-btn]'); if (!btn) return;
      const k = btn.dataset.btn;
      if (k === 'power') {
        power = !power;
        ledEl.classList.remove('blink');
        ledEl.classList.toggle('off', !power);
        say(power ? 'Powered on' : 'Powered off');
        return;
      }
      if (!power) { say('Press power first'); return; }
      if (k === 'bt') {
        ledEl.classList.add('blink');
        say('Pairing…');
        clearTimeout(bTimer);
        bTimer = setTimeout(() => { ledEl.classList.remove('blink'); say('Connected · iPhone'); }, 1600);
      }
      if (k === 'vol') {
        level = level >= 8 ? 1 : level + 1;
        drawVol();
        vol.classList.add('show');
        clearTimeout(vTimer); vTimer = setTimeout(() => vol.classList.remove('show'), 1800);
        say(`Volume ${level} of 8`);
      }
    });
  })();

  /* ---------- finishes ---------- */
  (() => {
    const sec = $('[data-finish]'), line = $('[data-finish-line]');
    const copy = { sage: 'Sage, for the trail.', midnight: 'Midnight, for after dark.' };
    $$('[data-pick]', sec).forEach(b => b.addEventListener('click', () => {
      const f = b.dataset.pick;
      sec.dataset.finish = f;
      line.textContent = copy[f];
      $$('[data-pick]', sec).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
      render();
    }));
  })();

  /* ---------- film: the clips play in order as one film, inline.
     Two stacked <video> layers dissolve at each cut; the section backdrop
     is painted live from the playing clip into a tiny canvas that CSS
     blurs into liquid glass, so it always matches the frame. ---------- */
  (() => {
    const sec = $('[data-film]');
    const layers = $$('[data-film-layer]', sec);
    const clips = $$('[data-film-playlist] li', sec).map(li => ({ src: li.dataset.src, name: li.textContent.trim() }));
    const player = $('[data-player]', sec);
    const toggles = $$('[data-film-toggle]', sec), muteBtn = $('[data-film-mute]', sec);
    const bar = $('[data-film-progress]', sec), time = $('[data-film-time]', sec), seek = $('[data-film-seek]', sec);
    const chapter = $('[data-film-chapter]', sec);
    const canvas = $('[data-film-bg]', sec), ctx = canvas.getContext('2d');
    const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const FADE = 0.6; // seconds of dissolve at each cut

    // clip lengths, read once metadata arrives; total runtime drives the progress bar
    const durs = clips.map(() => 0);
    let cur = 0, active = 0, playing = false, wantPlay = !reduce, inView = false, muted = true, started = false, swapping = false;
    const live = () => layers[active];
    const idle = () => layers[1 - active];
    const offset = i => durs.slice(0, i).reduce((a, b) => a + b, 0);
    const total = () => durs.reduce((a, b) => a + b, 0);

    const loadInto = (v, i) => { v.src = clips[i].src; v.preload = 'auto'; v.muted = muted; v.load(); };
    layers.forEach(v => v.addEventListener('loadedmetadata', () => {
      const i = clips.findIndex(c => v.src.endsWith(c.src));
      if (i >= 0) durs[i] = v.duration;
    }));
    // learn every clip's length up front (metadata only, cheap)
    const probe = () => clips.forEach((c, i) => {
      const p = document.createElement('video');
      p.preload = 'metadata'; p.muted = true; p.src = c.src;
      p.onloadedmetadata = () => { durs[i] = p.duration; p.removeAttribute('src'); p.load(); };
    });

    const setChapter = i => {
      chapter.textContent = clips[i].name;
      chapter.classList.remove('show'); void chapter.offsetWidth; chapter.classList.add('show');
    };

    const begin = () => {
      if (started) return; started = true;
      probe();
      loadInto(live(), 0);
      loadInto(idle(), 1);
      live().classList.add('is-on');
      sec.classList.add('has-video');
      setChapter(0);
    };

    // cut to clip i with a dissolve; the next clip is always preloaded in the hidden layer
    const cutTo = i => {
      if (swapping) return;
      swapping = true;
      const target = (i + clips.length) % clips.length;
      const next = idle();
      if (!next.src.endsWith(clips[target].src)) loadInto(next, target);
      if (next.currentTime > 0) next.currentTime = 0;
      next.muted = muted;
      let done = false, wait = 0;
      const go = () => {
        if (done) return; done = true; clearTimeout(wait);
        if (playing) next.play().catch(() => {}); else next.pause();
        next.classList.add('is-on');
        const prev = live();
        active = 1 - active;
        cur = target;
        prev.classList.remove('is-on');
        setChapter(cur);
        setTimeout(() => {
          prev.pause();
          loadInto(prev, (cur + 1) % clips.length); // preload the one after
          swapping = false;
        }, FADE * 1000 + 50);
      };
      if (next.readyState >= 2) go();
      else {
        // nudge the browser to fetch frames now, then cut as soon as one is ready
        next.play().catch(() => {});
        next.addEventListener('loadeddata', go, { once: true });
        next.addEventListener('playing', go, { once: true });
        wait = setTimeout(go, 1500);
      }
    };

    // the cut is driven by the video's own clock, so it never waits on scrolling or painting
    layers.forEach(v => {
      v.addEventListener('timeupdate', () => {
        if (v === live() && v.duration) {
          const t = offset(cur) + v.currentTime, T = total();
          if (T) bar.style.transform = `scaleX(${clamp(t / T)})`;
          time.textContent = fmt(t);
        }
        if (v === live() && playing && !swapping && v.duration && v.currentTime >= v.duration - FADE) cutTo(cur + 1);
      });
      v.addEventListener('ended', () => { if (v === live() && playing) { swapping = false; cutTo(cur + 1); } });
    });

    // progress, time and the glass backdrop follow the live frame
    const tick = () => {
      const v = live();
      if (started && v.duration) {
        const t = offset(cur) + v.currentTime, T = total();
        if (T) bar.style.transform = `scaleX(${clamp(t / T)})`;
        time.textContent = fmt(t);
        // paint the backdrop from the live frame
        if (v.readyState >= 2) {
          try { ctx.drawImage(v, 0, 0, canvas.width, canvas.height); sec.classList.add('has-bg'); } catch (e) {}
        }
      }
      raf = (inView || playing) ? requestAnimationFrame(tick) : 0;
    };
    let raf = 0;
    const loop = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const play = () => {
      begin();
      playing = true;
      live().muted = muted;
      live().play().catch(() => {});
      player.classList.add('is-playing');
      toggles.forEach(b => b.setAttribute('aria-label', 'Pause film'));
      loop();
    };
    const pause = () => {
      playing = false;
      layers.forEach(v => v.pause());
      player.classList.remove('is-playing');
      toggles.forEach(b => b.setAttribute('aria-label', 'Play film'));
    };

    toggles.forEach(b => b.addEventListener('click', () => {
      if (playing) { wantPlay = false; pause(); } else { wantPlay = true; play(); }
    }));
    const setMuted = m => {
      muted = m;
      layers.forEach(v => { v.muted = m; });
      muteBtn.textContent = m ? 'Sound off' : 'Sound on';
      muteBtn.setAttribute('aria-pressed', String(!m));
    };
    muteBtn.addEventListener('click', () => setMuted(!muted));

    // click the bar to jump anywhere in the whole film
    seek.addEventListener('click', e => {
      const T = total(); if (!T) return;
      const r = seek.getBoundingClientRect();
      let t = clamp((e.clientX - r.left) / r.width) * T, i = 0;
      while (i < clips.length - 1 && t > durs[i]) { t -= durs[i]; i++; }
      const jump = () => { live().currentTime = Math.max(0, t); };
      if (i === cur) jump();
      else { swapping = false; cutTo(i); setTimeout(jump, 80); }
    });

    // autoplay muted on screen, pause when scrolled away
    watch(player, on => {
      inView = on;
      if (on) { begin(); if (wantPlay) play(); else loop(); } else pause();
    }, 0.3);

    // "Watch the film" in the hero: glide down, then play from the top with sound
    $$('[data-watch-film]').forEach(b => b.addEventListener('click', () => {
      wantPlay = true; setMuted(false);
      sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      begin();
      if (cur !== 0) { swapping = false; cutTo(0); }
      play();
    }));
  })();
})();
