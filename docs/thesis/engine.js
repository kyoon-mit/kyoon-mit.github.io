/* Thesis gate: engine (canvas, sprites, pixel font, input, text box, menus, fades). */
'use strict';
window.TG = (() => {
  const W = 240, H = 160;
  const cv = document.getElementById('screen');
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---------------------------------------------------------------- sprites
  const RGB = {};
  for (const k in PAL) {
    const h = PAL[k];
    RGB[k] = [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  function build(rows, flipX, solid) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const im = x.createImageData(w, h), d = im.data;
    for (let j = 0; j < h; j++) {
      const r = rows[j];
      for (let i = 0; i < w; i++) {
        const ch = r[flipX ? w - 1 - i : i];
        if (ch === '.') continue;
        const col = solid || RGB[ch], o = (j * w + i) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    x.putImageData(im, 0, 0);
    return c;
  }
  const cache = new Map();
  function spr(name, flipX = false, solid = null) {
    const key = name + (flipX ? '|f' : '') + (solid ? '|' + solid.join(',') : '');
    let c = cache.get(key);
    if (!c) {
      const rows = SPRITES[name];
      if (!rows) throw new Error('missing sprite ' + name);
      c = build(rows, flipX, solid);
      cache.set(key, c);
    }
    return c;
  }
  function draw(name, x, y, flipX = false) { g.drawImage(spr(name, flipX), Math.round(x), Math.round(y)); }
  function drawSolid(name, x, y, rgb, flipX = false) { g.drawImage(spr(name, flipX, rgb), Math.round(x), Math.round(y)); }
  function size(name) { const r = SPRITES[name]; return [r[0].length, r.length]; }

  // ---------------------------------------------------------------- font
  const gcache = new Map();
  function glyph(ch, color) {
    const key = ch + '|' + color;
    let c = gcache.get(key);
    if (c) return c;
    const rows = FONT[ch] || FONT['?'];
    c = document.createElement('canvas');
    c.width = rows[0].length; c.height = rows.length;
    const x = c.getContext('2d');
    x.fillStyle = color;
    for (let j = 0; j < rows.length; j++)
      for (let i = 0; i < rows[j].length; i++)
        if (rows[j][i] === '1') x.fillRect(i, j, 1, 1);
    gcache.set(key, c);
    return c;
  }
  function gw(ch) { return (FONT[ch] || FONT['?'])[0].length; }
  function measure(s) { let w = 0; for (const ch of s) w += gw(ch) + 1; return Math.max(0, w - 1); }
  const C = {
    text: '#404048', shadow: '#d0d0d8', white: '#f8f8f8', wshadow: '#58586c',
    red: '#e04838', blue: '#3870d0', gray: '#909098',
  };
  function text(s, x, y, color = C.text, shadow = C.shadow) {
    x = Math.round(x); y = Math.round(y);
    if (shadow) {
      let cx = x;
      for (const ch of s) {
        const c = glyph(ch, shadow);
        g.drawImage(c, cx + 1, y); g.drawImage(c, cx, y + 1); g.drawImage(c, cx + 1, y + 1);
        cx += gw(ch) + 1;
      }
    }
    let cx = x;
    for (const ch of s) { g.drawImage(glyph(ch, color), cx, y); cx += gw(ch) + 1; }
    return cx;
  }
  function wrap(str, maxW) {
    const out = [];
    for (const para of str.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (measure(t) <= maxW || !line) line = t;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  }

  // ---------------------------------------------------------------- boxes
  const BOX = {
    world: { outer: '#283038', frame: '#78a8e8', inner: '#c8dcf8', fill: '#f8f8f8' },
    battle: { outer: '#283038', frame: '#d8c890', inner: '#a08c58', fill: '#2c4c70' },
    menu: { outer: '#283038', frame: '#78a8e8', inner: '#c8dcf8', fill: '#f8f8f8' },
    plain: { outer: '#283038', frame: '#f8f8f8', inner: '#d8d8e0', fill: '#f8f8f8' },
    hp: { outer: '#283038', frame: '#f8f8e0', inner: '#c8c8a0', fill: '#f8f8e0' },
  };
  function box(x, y, w, h, style = 'world') {
    const s = BOX[style] || BOX.world;
    g.fillStyle = s.outer; g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4); g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillStyle = s.frame; g.fillRect(x + 2, y + 1, w - 4, h - 2); g.fillRect(x + 1, y + 2, w - 2, h - 4);
    g.fillStyle = s.inner; g.fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle = s.fill; g.fillRect(x + 4, y + 4, w - 8, h - 8);
  }

  // ---------------------------------------------------------------- input
  const DIRS = ['up', 'down', 'left', 'right'];
  const KEYS = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right', Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyB: 'b', Escape: 'b',
  };
  const held = {}, pressed = {};
  let dirStack = [];
  const state = { keysOn: true, textInput: false };
  function keyDown(k) {
    if (!held[k]) {
      pressed[k] = true;
      if (DIRS.includes(k)) { dirStack = dirStack.filter(d => d !== k); dirStack.push(k); }
    }
    held[k] = true;
  }
  function keyUp(k) { held[k] = false; dirStack = dirStack.filter(d => d !== k); }
  function releaseAll() { for (const k in held) held[k] = false; dirStack = []; }
  function dir() { return dirStack.length ? dirStack[dirStack.length - 1] : null; }
  // fallbacks for layouts and input methods that leave e.code empty (Korean 2-set: W A S D B = \u3148 \u3141 \u3134 \u3147 \u3160)
  const NAMES = {
    w: 'up', a: 'left', s: 'down', d: 'right', b: 'b', ' ': 'a', spacebar: 'a', enter: 'a', escape: 'b',
    arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
    '\u3148': 'up', '\u3141': 'left', '\u3134': 'down', '\u3147': 'right', '\u3160': 'b',
  };
  const CODES = { 87: 'up', 65: 'left', 83: 'down', 68: 'right', 66: 'b', 32: 'a', 13: 'a', 27: 'b', 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
  const keyOf = e => KEYS[e.code] || NAMES[String(e.key || '').toLowerCase()] || CODES[e.keyCode] || null;
  window.addEventListener('keydown', e => {
    if (!state.keysOn || state.textInput || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = keyOf(e);
    if (!k) return;
    e.preventDefault();
    if (!e.repeat) keyDown(k);
  });
  window.addEventListener('keyup', e => {
    const k = keyOf(e);
    if (k) keyUp(k);
    else if (e.keyCode === 229 || e.key === 'Process') releaseAll();
  });
  window.addEventListener('blur', releaseAll);
  document.querySelectorAll('[data-key]').forEach(el => {
    const k = el.dataset.key;
    const on = e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) {} el.classList.add('is-down'); keyDown(k); };
    const off = e => { e.preventDefault(); el.classList.remove('is-down'); keyUp(k); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  // click regions on the canvas (menus, naming keyboard, ...)
  let regions = [];
  function region(x, y, w, h, fn) { regions.push({ x, y, w, h, fn }); }
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    for (let i = regions.length - 1; i >= 0; i--) {
      const q = regions[i];
      if (x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) { e.preventDefault(); q.fn(x, y); return; }
    }
    if (TB.open && TB.state !== 'idle') pressed.a = true;
  });

  // ---------------------------------------------------------------- timing
  let waiters = [];
  function wait(n = 1) { return new Promise(r => waiters.push([n, r])); }
  function tickWaiters() {
    if (!waiters.length) return;
    const keep = [];
    for (const w of waiters) { if (--w[0] <= 0) w[1](); else keep.push(w); }
    waiters = keep;
  }
  function until(fn) { return new Promise(r => waiters.push([Infinity, r, fn])); }
  function tickUntil() {
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      if (w[2] && w[2]()) { waiters.splice(i, 1); w[1](); }
    }
  }

  // ---------------------------------------------------------------- fade
  const FADE = { a: 0, color: '0,0,0' };
  async function fadeTo(target, frames = 16, color) {
    if (color) FADE.color = color;
    const a0 = FADE.a;
    for (let i = 1; i <= frames; i++) { FADE.a = a0 + (target - a0) * i / frames; await wait(1); }
    FADE.a = target;
  }

  // ---------------------------------------------------------------- text box
  const TB = { open: false, style: 'world', chunks: [], ci: 0, lines: [], li: 0, rows: ['', ''], row: 0, pos: 0,
    state: 'idle', scroll: 0, wait: true, done: null, frame: 0, narrow: 0 };
  function layoutTB() {
    if (TB.style === 'battle') return { x: 0, y: 112, w: 240, h: 48, tx: 10, ty: 120, maxW: TB.narrow || 218 };
    return { x: 2, y: 113, w: 236, h: 46, tx: 12, ty: 121, maxW: 210 };
  }
  function say(str, opts = {}) {
    return new Promise(res => {
      TB.style = opts.style || TB.defaultStyle || 'world';
      TB.narrow = opts.narrow || 0;
      const L = layoutTB();
      TB.chunks = String(str).split('\f').map(c => wrap(c, L.maxW));
      TB.ci = 0; TB.open = true; TB.wait = opts.wait !== false; TB.done = res;
      TB.speed = opts.speed || 1;
      startChunk();
    });
  }
  function startChunk() {
    TB.lines = TB.chunks[TB.ci]; TB.li = 0; TB.rows = ['', '']; TB.row = 0; TB.pos = 0; TB.scroll = 0; TB.state = 'type';
  }
  function finishTB() { const r = TB.done; TB.done = null; if (r) r(); }
  function close() { TB.open = false; TB.state = 'idle'; }
  function tbUpdate() {
    if (!TB.open) return;
    TB.frame++;
    const adv = pressed.a || pressed.b;
    if (TB.state === 'type') {
      const line = TB.lines[TB.li] || '';
      let n = (held.a || held.b) ? 4 : TB.speed;
      if (adv) n = 999;
      TB.pos = Math.min(line.length, TB.pos + n);
      TB.rows[TB.row] = line.slice(0, TB.pos);
      if (TB.pos >= line.length) {
        if (TB.li + 1 < TB.lines.length) {
          if (TB.row === 0) { TB.row = 1; TB.li++; TB.pos = 0; }
          else TB.state = 'waitScroll';
        } else if (TB.ci + 1 < TB.chunks.length) TB.state = 'waitPage';
        else if (TB.wait) TB.state = 'waitEnd';
        else { TB.state = 'idle'; finishTB(); }
      }
    } else if (TB.state === 'waitScroll') {
      if (adv) { TB.state = 'scroll'; TB.scroll = 0; }
    } else if (TB.state === 'scroll') {
      TB.scroll += 4;
      if (TB.scroll >= 16) { TB.rows = [TB.rows[1], '']; TB.row = 1; TB.li++; TB.pos = 0; TB.scroll = 0; TB.state = 'type'; }
    } else if (TB.state === 'waitPage') {
      if (adv) { TB.ci++; startChunk(); }
    } else if (TB.state === 'waitEnd') {
      if (adv) { TB.state = 'idle'; finishTB(); }
    }
  }
  function tbRender() {
    if (!TB.open) return;
    const L = layoutTB();
    box(L.x, L.y, L.w, L.h, TB.style === 'battle' ? 'battle' : 'world');
    const col = TB.style === 'battle' ? C.white : C.text, sh = TB.style === 'battle' ? C.wshadow : C.shadow;
    g.save();
    g.beginPath(); g.rect(L.x + 4, L.y + 4, L.w - 8, L.h - 8); g.clip();
    text(TB.rows[0], L.tx, L.ty - TB.scroll, col, sh);
    text(TB.rows[1], L.tx, L.ty + 16 - TB.scroll, col, sh);
    g.restore();
    if (TB.state === 'waitScroll' || TB.state === 'waitPage' || TB.state === 'waitEnd') {
      const bob = (TB.frame >> 3) & 1;
      draw('arrow_dn', L.x + L.w - 16, L.y + L.h - 12 + bob);
    }
  }

  // ---------------------------------------------------------------- menus
  const MENU = { open: false };
  function choose(items, opts = {}) {
    return new Promise(res => {
      const cols = opts.cols || 1, lineH = opts.lineH || 16;
      const iw = opts.iw || Math.max(...items.map(measure)) + 14;
      const rows = Math.ceil(items.length / cols);
      const w = opts.w || iw * cols + 16, h = opts.h || rows * lineH + 12;
      Object.assign(MENU, {
        open: true, items, idx: opts.start || 0, cancel: opts.cancel === undefined ? null : opts.cancel, res,
        cols, iw, lineH, w, h, x: opts.x === undefined ? W - 2 - w : opts.x, y: opts.y === undefined ? 113 - h : opts.y,
        style: opts.style || 'menu', info: opts.info || null, onMove: opts.onMove || null,
      });
      if (MENU.onMove) MENU.onMove(MENU.idx);
    });
  }
  function yesno(opts = {}) { return choose(['YES', 'NO'], Object.assign({ cancel: 1 }, opts)).then(i => i === 0); }
  function pick(i) { MENU.open = false; const r = MENU.res; MENU.res = null; r(i); }
  function menuUpdate() {
    if (!MENU.open) return;
    const n = MENU.items.length, c = MENU.cols;
    let i = MENU.idx;
    if (pressed.up) i = i - c >= 0 ? i - c : i;
    if (pressed.down) i = i + c < n ? i + c : i;
    if (c > 1 && pressed.left && i % c > 0) i -= 1;
    if (c > 1 && pressed.right && i % c < c - 1 && i + 1 < n) i += 1;
    if (c === 1 && pressed.up && MENU.idx === 0 && !MENU.noWrap) i = n - 1;
    if (c === 1 && pressed.down && MENU.idx === n - 1 && !MENU.noWrap) i = 0;
    if (i !== MENU.idx) { MENU.idx = i; if (MENU.onMove) MENU.onMove(i); }
    if (pressed.a) pick(MENU.idx);
    else if (pressed.b && MENU.cancel !== null) pick(MENU.cancel);
  }
  function menuRender() {
    if (!MENU.open) return;
    const m = MENU;
    box(m.x, m.y, m.w, m.h, m.style);
    m.items.forEach((it, k) => {
      const cx = m.x + 8 + (k % m.cols) * m.iw, cy = m.y + 7 + Math.floor(k / m.cols) * m.lineH;
      if (k === m.idx) text('▶', cx, cy);
      text(it, cx + 9, cy);
      region(cx - 2, cy - 3, m.iw, m.lineH, () => { if (m.open) { m.idx = k; pick(k); } });
    });
  }

  // ---------------------------------------------------------------- loop
  const hooks = { update: null, render: null };
  const layers = new Set();   // extra render callbacks drawn above menus (stat boxes, naming screen)
  let frame = 0;
  const STEP = 1000 / 60;
  let acc = 0, last = performance.now(), running = false;
  function tick() {
    frame++;
    tickWaiters(); tickUntil();
    if (hooks.update) hooks.update();
    tbUpdate();
    menuUpdate();
    for (const k in pressed) pressed[k] = false;
  }
  function render() {
    regions = [];
    if (hooks.render) hooks.render();
    tbRender();
    menuRender();
    for (const f of layers) f();
    if (FADE.a > 0) { g.fillStyle = `rgba(${FADE.color},${FADE.a})`; g.fillRect(0, 0, W, H); }
  }
  function loop(now) {
    if (!running) return;
    acc += Math.min(250, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 4) { tick(); acc -= STEP; n++; }
    if (n === 4) acc = 0;
    render();
    requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); }
  function stop() { running = false; state.keysOn = false; releaseAll(); }

  // cosmetic randomness (wandering, particles), separate from game-logic Math.random
  let seed = 12345;
  function crand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; }

  return {
    W, H, g, cv, spr, draw, drawSolid, size, text, measure, wrap, box, C,
    held, pressed, dir, keyDown, keyUp, releaseAll, state, region,
    wait, until, fadeTo, FADE, TB, say, close, choose, yesno, MENU, pick,
    hooks, layers, start, stop, crand, get frame() { return frame; },
  };
})();
