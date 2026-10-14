/* Thesis gate: overworld (maps, movement, NPCs, scripts, password keyboard). */
'use strict';
window.WORLD = (() => {
  const { g, draw, text, measure, say, close, choose, yesno, wait, fadeTo, held, pressed, dir, crand, box, C } = TG;
  const DX = { up: 0, down: 0, left: -1, right: 1 }, DY = { up: -1, down: 1, left: 0, right: 0 };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const DIRS = ['up', 'down', 'left', 'right'];

  // ---------------------------------------------------------------- maps
  const SCENES = {
    crossroads: {
      map: [
        'TTTTTCCCCCTTTTT',
        'TTTTTCCCCCTTTTT',
        'TT...CCDCC...TT',
        'T*........;FFFF',
        'T....s....;FhPP',
        '======.....OPPP',
        'T;;........FPyP',
        'T;;......*.FFFF',
        'T.*.........r.T',
        'TTTTTTTTTTTTTTT',
      ],
      warps: [
        { x: 7, y: 2, to: 'cage', tx: 7, ty: 8, dir: 'up', door: true },
        { x: 11, y: 5, to: 'pen', tx: 1, ty: 5, dir: 'right' },
      ],
      edges: [{ x: 0, y: 5, dir: 'left', to: 'forest', tx: 14, ty: 6 }],
      talk: {
        C: 'Thick iron bars. Something big is snoring inside.',
        s: '↑ THE CAGE\n→ RABBIT PEN     ← OLD FOREST',
        r: 'A big, smooth rock.',
        h: 'A wooden hutch. It smells of hay.',
        y: 'A pile of hay.',
        P: 'The RABBIT PEN. The way in is to the west.',
      },
    },
    cage: {
      dark: true,
      map: [
        '###############',
        '##t#########t##',
        '|____BBBBB____|',
        '|____BBBBB____|',
        '|_b__BBBBB___b|',
        '|____________b|',
        '|_b___________|',
        '|_____________|',
        '|_____________|',
        '|||||||X|||||||',
      ],
      warps: [{ x: 7, y: 9, to: 'crossroads', tx: 7, ty: 3, dir: 'down', fromDoor: true }],
      talk: {
        '#': 'Cold stone.',
        t: 'A torch. It crackles.',
        '|': 'The bars are cold.',
        b: 'Old bones. Best not to ask.',
      },
    },
    pen: {
      map: [
        'TTTTTTTTTTTTTTT',
        'FFFFFFFFFFFFFFF',
        'F......;;...h.F',
        'F.cc...;;.....F',
        'F.cc..........F',
        'O.............F',
        'F.....;;....o.F',
        'F.*...;;...y..F',
        'FFFFFFFFFFFFFFF',
        'TTTTTTTTTTTTTTT',
      ],
      warps: [{ x: 0, y: 5, to: 'crossroads', tx: 10, ty: 5, dir: 'left' }],
      talk: {
        h: 'A wooden hutch. It smells of hay.',
        c: 'A carrot patch. Several carrots have bite marks.',
        o: 'A bowl of fresh water.',
        y: 'A pile of hay.',
      },
    },
    forest: {
      forest: true,
      map: [
        'TTTTTAAAAATTTTT',
        'TTTT.AAAAA.TTTT',
        'TTT..AAAAA..TTT',
        'TT;..AAAAA...TT',
        'TT...AAAAA..mTT',
        'Tm...AAAAA....T',
        'T......========',
        'TT.;;.........T',
        'TTT;;...m..TTTT',
        'TTTTTTTTTTTTTTT',
      ],
      edges: [{ x: 14, y: 6, dir: 'right', to: 'crossroads', tx: 0, ty: 5 }],
      talk: { L: 'A mossy log.' },
    },
  };
  for (const k in SCENES) {
    const m = SCENES[k].map;
    if (m.length !== 10 || m.some(r => r.length !== 15)) throw new Error('bad map ' + k);
  }
  const SOLID = new Set(['T', 'F', 'C', 's', 'r', 'h', 'y', 'c', 'o', 'L', 'A', 'B', 'P', '#', 't', '|']);

  // ---------------------------------------------------------------- state
  const S = {
    scene: 'crossroads', busy: 0, doorOpen: 0,
    beast: { awake: false, chapter: 0, started: false, done: false, score: 0, asked: 0 },
    tree: { awake: false, met: false },
  };
  const P = { x: 7, y: 5, dir: 'up', moving: false, prog: 0, foot: 0, turn: 0, bump: 0, speed: 1, justMoved: false, hidden: false, sink: 0 };
  const RAB = { x: 8, y: 4, dir: 'down', moving: false, prog: 0, tx: 8, ty: 4, timer: 90, munch: 0, jump: 0, ox: 0, oy: 0 };
  let sc = null, bg = null;
  const FX = [];

  function tileAt(x, y) { return (x < 0 || y < 0 || x > 14 || y > 9) ? null : sc.map[y][x]; }
  function solid(x, y) { const t = tileAt(x, y); return t === null || SOLID.has(t); }
  function rabbitHere(x, y) {
    if (S.scene !== 'pen') return false;
    return (RAB.x === x && RAB.y === y) || (RAB.moving && RAB.tx === x && RAB.ty === y);
  }

  // ---------------------------------------------------------------- tiles
  function grassName(x, y, f) {
    const h = (x * 73 + y * 37) % 5;
    return f ? (h < 3 ? 'fgrass' : 'fgrass2') : (h < 2 ? 'grass' : h < 4 ? 'grass2' : 'grass3');
  }
  function pathMask(m, x, y) {
    const isP = (xx, yy) => (xx < 0 || yy < 0 || xx > 14 || yy > 9) ? true : m[yy][xx] === '=';
    return (isP(x, y - 1) ? 0 : 1) | (isP(x + 1, y) ? 0 : 2) | (isP(x, y + 1) ? 0 : 4) | (isP(x - 1, y) ? 0 : 8);
  }
  function fenceMask(m, x, y) {
    const isF = (xx, yy) => (xx >= 0 && yy >= 0 && xx <= 14 && yy <= 9) && m[yy][xx] === 'F';
    const oob = (xx, yy) => xx < 0 || yy < 0 || xx > 14 || yy > 9;
    let n = isF(x, y - 1), s = isF(x, y + 1), e = isF(x + 1, y), w = isF(x - 1, y);
    if (oob(x + 1, y) && w) e = true;
    if (oob(x - 1, y) && e) w = true;
    if (oob(x, y - 1) && s) n = true;
    if (oob(x, y + 1) && n) s = true;
    return (n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0);
  }
  function tileName(scn, x, y) {
    const m = scn.map, ch = m[y][x], f = !!scn.forest;
    switch (ch) {
      case 'T': return f ? ((x + y) % 2 ? 'ftree' : 'ftree2') : ((x + 2 * y) % 3 ? 'tree' : 'tree2');
      case ';': return f ? 'ftall' : 'tall';
      case '=': return (f ? 'fpath' : 'path') + pathMask(m, x, y);
      case 'F': return 'fence' + fenceMask(m, x, y);
      case 's': return 'sign';
      case 'r': return 'rock';
      case 'h': return 'hutch';
      case 'y': return 'hay';
      case 'c': return 'carrots';
      case 'o': return 'bowl';
      case 'm': return 'mush';
      case 'L': return 'log';
      case '#': return 'wall';
      case 't': return 'torch0';
      case '|': return 'bars';
      case 'b': return 'bones';
      case 'X': return 'exitmat';
      case '_': case 'B': return (x * 3 + y) % 4 ? 'floor' : 'floor2';
      case '*': return 'flower0';
      default: return grassName(x, y, f);
    }
  }
  function buildBG(scn) {
    const c = document.createElement('canvas');
    c.width = 240; c.height = 160;
    const x = c.getContext('2d');
    for (let ty = 0; ty < 10; ty++)
      for (let tx = 0; tx < 15; tx++) x.drawImage(TG.spr(tileName(scn, tx, ty)), tx * 16, ty * 16);
    return c;
  }
  function loadScene(name) {
    S.scene = name; sc = SCENES[name];
    if (!sc.bg) sc.bg = buildBG(sc);
    bg = sc.bg;
    FX.length = 0;
    if (name === 'pen') { RAB.x = 8; RAB.y = 4; RAB.moving = false; RAB.prog = 0; RAB.timer = 60; RAB.dir = 'down'; RAB.ox = RAB.oy = 0; }
    if (name === 'forest') initFireflies();
  }

  // ---------------------------------------------------------------- particles
  const flies = [];
  function initFireflies() {
    flies.length = 0;
    for (let i = 0; i < 12; i++) flies.push({ x: crand() * 240, y: 20 + crand() * 120, p: crand() * 6.28, s: 0.3 + crand() * 0.4 });
  }
  const zzz = [];
  function spawnZ(x, y) { zzz.push({ x, y, t: 0, big: crand() < 0.5 }); }

  // ---------------------------------------------------------------- update
  let wasMoving = false;
  function update() {
    if (S.busy === 0 || P.moving) updatePlayer();
    updateRabbit();
    // ambience
    const f = TG.frame;
    if (S.scene === 'cage' && !S.beast.awake && f % 48 === 0) spawnZ(122 + crand() * 8, 34);
    if (S.scene === 'crossroads' && f % 70 === 0) spawnZ(118, 8);
    for (let i = zzz.length - 1; i >= 0; i--) {
      const z = zzz[i]; z.t++; z.x += 0.25; z.y -= 0.35;
      if (z.t > 70) zzz.splice(i, 1);
    }
    for (const fl of flies) { fl.p += 0.03; fl.x += Math.cos(fl.p) * fl.s; fl.y += Math.sin(fl.p * 1.3) * fl.s * 0.6; if (fl.x < -4) fl.x = 244; if (fl.x > 244) fl.x = -4; }
    for (let i = FX.length - 1; i >= 0; i--) { const e = FX[i]; e.t++; if (e.life && e.t > e.life) FX.splice(i, 1); }
  }
  function updatePlayer() {
    if (P.moving) {
      P.prog += P.speed;
      if (P.prog >= 16) {
        P.x += DX[P.dir]; P.y += DY[P.dir]; P.moving = false; P.prog = 0; P.foot ^= 1; P.justMoved = true;
        onArrive();
      }
      return;
    }
    if (P.bump > 0) { P.bump--; if (!dir() || dir() !== P.dir) P.bump = 0; return; }
    if (S.busy) return;
    if (pressed.a) { P.justMoved = false; interact(); return; }
    const d = dir() || DIRS.find(k => pressed[k]);
    if (!d) { P.turn = 0; P.justMoved = false; return; }
    if (d !== P.dir) {
      P.dir = d;
      if (P.justMoved) { tryMove(d); }
      else P.turn = 7;
      return;
    }
    if (P.turn > 0) { P.turn--; return; }
    tryMove(d);
  }
  function tryMove(d) {
    P.justMoved = false;
    P.speed = held.b ? 2 : 1;
    const nx = P.x + DX[d], ny = P.y + DY[d];
    const edge = (sc.edges || []).find(e => e.x === P.x && e.y === P.y && e.dir === d);
    if (edge) { P.moving = true; P.prog = 0; return; }
    if (solid(nx, ny) || rabbitHere(nx, ny)) { P.bump = 16; return; }
    const w = (sc.warps || []).find(q => q.x === nx && q.y === ny);
    if (w && w.door) { run(() => enterDoor(w)); return; }
    P.moving = true; P.prog = 0;
  }
  function onArrive() {
    if (P.x < 0 || P.x > 14 || P.y < 0 || P.y > 9) {
      const e = (sc.edges || []).find(q => q.x === P.x - DX[P.dir] && q.y === P.y - DY[P.dir] && q.dir === P.dir);
      if (e) run(() => warp(e.to, e.tx, e.ty, P.dir));
      return;
    }
    const w = (sc.warps || []).find(q => q.x === P.x && q.y === P.y);
    if (w) run(() => warp(w.to, w.tx, w.ty, w.dir, w.fromDoor));
  }
  async function warp(to, tx, ty, d, fromDoor) {
    TG.releaseAll();
    await fadeTo(1, 12, '0,0,0');
    loadScene(to);
    P.x = tx; P.y = ty; P.dir = d; P.moving = false; P.prog = 0; P.bump = 0;
    if (fromDoor) S.doorOpen = 1;
    await wait(6);
    await fadeTo(0, 12);
    if (fromDoor) { await wait(12); S.doorOpen = 0; }
  }
  async function enterDoor(w) {
    S.doorOpen = 1;
    await wait(10);
    P.dir = 'up'; P.moving = true; P.prog = 0; P.speed = 1;
    await TG.until(() => !P.moving);
    P.hidden = true;
    await fadeTo(1, 12, '0,0,0');
    S.doorOpen = 0; P.hidden = false;
    loadScene(w.to);
    P.x = w.tx; P.y = w.ty; P.dir = w.dir; P.moving = false;
    await wait(6);
    await fadeTo(0, 12);
  }
  function updateRabbit() {
    if (S.scene !== 'pen') return;
    if (RAB.munch > 0) RAB.munch--;
    if (RAB.moving) {
      RAB.prog += 1;
      if (RAB.prog >= 16) { RAB.x = RAB.tx; RAB.y = RAB.ty; RAB.moving = false; RAB.prog = 0; }
      return;
    }
    if (S.busy) return;
    if (--RAB.timer > 0) return;
    RAB.timer = 50 + Math.floor(crand() * 110);
    const d = DIRS[Math.floor(crand() * 4)];
    RAB.dir = d;
    const nx = RAB.x + DX[d], ny = RAB.y + DY[d];
    const pnx = P.moving ? P.x + DX[P.dir] : P.x, pny = P.moving ? P.y + DY[P.dir] : P.y;
    if (solid(nx, ny) || tileAt(nx, ny) === 'O' || (nx === P.x && ny === P.y) || (nx === pnx && ny === pny) || nx < 1) return;
    RAB.tx = nx; RAB.ty = ny; RAB.moving = true; RAB.prog = 0;
  }

  // ---------------------------------------------------------------- render
  function playerFrame() {
    const step = (P.moving && P.prog < 8) || (P.bump > 0 && (P.bump & 8));
    const alt = P.foot === 1;
    switch (P.dir) {
      case 'down': return step ? ['p_down_step', alt] : ['p_down', false];
      case 'up': return step ? ['p_up_step', alt] : ['p_up', false];
      case 'left': return [step ? 'p_left_step' : 'p_left', false];
      default: return [step ? 'p_left_step' : 'p_left', true];
    }
  }
  function playerPos() {
    return [P.x * 16 + DX[P.dir] * (P.moving ? P.prog : 0), P.y * 16 + DY[P.dir] * (P.moving ? P.prog : 0)];
  }
  function render() {
    const f = TG.frame;
    g.drawImage(bg, 0, 0);
    // animated tiles
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 15; x++) {
        const ch = sc.map[y][x];
        if (ch === '*' && ((f >> 5) & 1)) draw('flower1', x * 16, y * 16);
        else if (ch === 't') draw(((f >> 3) + x) & 1 ? 'torch1' : 'torch0', x * 16, y * 16);
      }
    // objects
    if (S.scene === 'crossroads') draw(S.doorOpen ? 'cage_open' : 'cage', 80, 0);
    if (S.scene === 'cage') {
      const breathe = !S.beast.awake && ((f >> 5) & 1) ? 1 : 0;
      draw(S.beast.awake ? 'beast_awake' : 'beast_sleep', 80, 32 + breathe);
    }
    if (S.scene === 'forest') draw(S.tree.awake ? 'atree_awake' : 'atree', 80, 0);
    // characters, sorted by y
    const ents = [];
    if (!P.hidden) {
      const [px, py] = playerPos();
      ents.push({ y: py, fn: () => { const [n, fl] = playerFrame(); draw(n, px, py - 4 + P.sink, fl); } });
    }
    if (S.scene === 'pen') {
      const rx = RAB.x * 16 + (RAB.moving ? (RAB.tx - RAB.x) * RAB.prog : 0) + RAB.ox;
      const ry = RAB.y * 16 + (RAB.moving ? (RAB.ty - RAB.y) * RAB.prog : 0) + RAB.oy;
      const hop = RAB.moving ? -Math.round(Math.sin(RAB.prog / 16 * Math.PI) * 4) : 0;
      ents.push({ y: ry, fn: () => {
        let n = 'rab_front', fl = false;
        if (RAB.dir === 'left' || RAB.dir === 'right') { n = 'rab_side'; fl = RAB.dir === 'right'; }
        if (RAB.munch > 0 && ((RAB.munch >> 3) & 1)) n = 'rab_munch';
        draw(n, rx, ry - 2 + hop, fl);
      } });
    }
    ents.sort((a, b) => a.y - b.y).forEach(e => e.fn());
    // tall grass over feet
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 15; x++)
        if (sc.map[y][x] === ';') draw(sc.forest ? 'ftall_over' : 'tall_over', x * 16, y * 16);
    // particles
    for (const z of zzz) {
      if ((S.scene === 'cage' && z.y > 0) || S.scene === 'crossroads') {
        const a = z.t < 50 ? '#e8e8f8' : '#b0b0c8';
        text(z.big ? 'Z' : 'z', z.x, z.y, a, '#4c3c78');
      }
    }
    for (const e of FX) e.draw(e.t);
    if (sc.dark) {
      g.fillStyle = `rgba(16,8,32,${0.2 + 0.03 * Math.sin(f / 7)})`;
      g.fillRect(0, 0, 240, 160);
    }
    if (sc.forest) {
      const grd = g.createRadialGradient(120, 70, 30, 120, 80, 170);
      grd.addColorStop(0, 'rgba(0,10,20,0)'); grd.addColorStop(1, 'rgba(0,10,20,0.55)');
      g.fillStyle = grd; g.fillRect(0, 0, 240, 160);
      for (const fl of flies) {
        const on = Math.sin(fl.p * 3) > -0.2;
        if (!on) continue;
        g.fillStyle = 'rgba(248,232,120,0.35)'; g.fillRect(Math.round(fl.x) - 1, Math.round(fl.y), 3, 1); g.fillRect(Math.round(fl.x), Math.round(fl.y) - 1, 1, 3);
        g.fillStyle = '#f8f0a0'; g.fillRect(Math.round(fl.x), Math.round(fl.y), 1, 1);
      }
    }
    if (S.shake) { /* applied via CSS transform for simplicity */ }
  }

  // ---------------------------------------------------------------- scripting helpers
  async function run(fn) {
    S.busy++;
    try { await fn(); } catch (e) { console.error(e); } finally { close(); S.busy--; }
  }
  function emote(x, y, frames = 36) {
    const e = { t: 0, life: frames, draw: t => draw('emote', x, y - (t < 4 ? 4 - t : 0)) };
    FX.push(e);
    return wait(frames);
  }
  async function shake(frames = 16, amp = 2) {
    const el = TG.cv;
    for (let i = 0; i < frames; i++) {
      el.style.transform = `translate(${(i % 2 ? 1 : -1) * amp}px, ${((i >> 1) % 2 ? 1 : -1) * amp / 2}px)`;
      await wait(1);
    }
    el.style.transform = '';
  }
  async function flash(color = '248,248,248', frames = 6) {
    await fadeTo(0.8, frames >> 1, color);
    await fadeTo(0, frames >> 1, color);
  }
  function facing() { return [P.x + DX[P.dir], P.y + DY[P.dir]]; }

  function interact() {
    const [fx, fy] = facing();
    if (S.scene === 'pen' && rabbitHere(fx, fy) && !RAB.moving) { run(rabbitTalk); return; }
    const t = tileAt(fx, fy);
    if (S.scene === 'cage' && t === 'B') { run(beastTalk); return; }
    if (S.scene === 'forest' && t === 'A') { run(treeTalk); return; }
    if (t === 'D' && S.scene === 'crossroads') return;
    const msg = sc.talk && sc.talk[t];
    if (msg) run(() => say(msg));
  }

  // ---------------------------------------------------------------- beast
  async function beastTalk() {
    const L = window.LORE, B = S.beast;
    if (!B.awake) {
      await emote(114, 22);
      B.awake = true;
      await wait(10);
    }
    const sleep = async () => { await say(L.later); B.awake = false; };
    if (B.done) {
      await say(L.again, { wait: false });
      if (!(await yesno())) { await say(L.later); B.awake = false; return; }
      B.chapter = 0; B.done = false; B.score = 0; B.asked = 0;
    } else if (!B.started) {
      for (const l of L.wake) await say(l);
      B.started = true;
      await say(L.begin, { wait: false });
      if (!(await yesno())) { await sleep(); return; }
    } else {
      for (const l of L.resume) await say(l);
    }
    for (; B.chapter < L.chapters.length; B.chapter++) {
      const ch = L.chapters[B.chapter];
      for (const l of ch.lines) await say(l);
      for (const q of ch.quiz || []) {
        await say(q.q, { wait: false });
        const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
        const i = await choose(order.map(k => q.a[k]));
        const right = order[i] === 0;
        B.asked++;
        if (right) { B.score++; await say(q.yes); } else await say(q.no);
      }
      if (ch.ask && B.chapter < L.chapters.length - 1) {
        await say(L.goOn, { wait: false });
        if (!(await yesno())) { B.chapter++; await sleep(); return; }
      }
    }
    B.done = true;
    await say(L.score(B.score, B.asked));
    for (const l of L.end) await say(l);
    B.awake = false;
  }

  // ---------------------------------------------------------------- rabbit
  async function rabbitTalk() {
    RAB.dir = OPP[P.dir];
    RAB.timer = 120;
    const r = Math.random();
    const rx = RAB.x * 16, ry = RAB.y * 16;
    if (r < 0.5) {
      await say('The RABBIT looks up at you with big, innocent eyes...');
      close();
      await emote(rx, ry - 18, 24);
      // pounce
      const dx = (P.x - RAB.x) * 10, dy = (P.y - RAB.y) * 10;
      for (let i = 1; i <= 6; i++) { RAB.ox = dx * i / 6; RAB.oy = dy * i / 6 - Math.sin(i / 6 * Math.PI) * 8; await wait(1); }
      await Promise.all([shake(18, 3), flash('232,72,56', 10)]);
      for (let i = 5; i >= 0; i--) { RAB.ox = dx * i / 6; RAB.oy = dy * i / 6; await wait(1); }
      await say('The RABBIT attacked!');
      await say('You fainted...');
      await whiteout();
    } else if (r < 0.725) {
      close();
      await emote(rx, ry - 18, 30);
      await say('The RABBIT would like to battle!');
      close();
      await BATTLE.start();
    } else if (r < 0.8625) {
      RAB.munch = 90;
      await say('The RABBIT is munching on a carrot.\nIt ignores you.');
    } else {
      await say('The RABBIT dropped something!');
      const e = { t: 0, life: 0, draw: t => draw('candy', rx, ry - 16 - Math.round(Math.abs(Math.sin(t / 8)) * 4)) };
      FX.push(e);
      await say('You found a RARE CANDY!');
      FX.splice(FX.indexOf(e), 1);
      await say('You ate the RARE CANDY.');
      await BATTLE.rareCandy('world');
    }
  }
  async function whiteout() {
    close();
    TG.releaseAll();
    await fadeTo(1, 30, '248,248,248');
    loadScene('crossroads');
    P.x = 7; P.y = 5; P.dir = 'up'; P.moving = false; P.sink = 0;
    RAB.ox = RAB.oy = 0;
    BATTLE.heal();
    await wait(30);
    await fadeTo(0, 30, '248,248,248');
    await say('...You came to at the crossroads.');
  }

  // ---------------------------------------------------------------- tree
  async function treeTalk() {
    const T = S.tree;
    if (!T.awake) {
      await say('An ancient tree. Something stirs deep in its bark...');
      close();
      await wait(20);
      T.awake = true;
      await wait(16);
    }
    if (!T.met) {
      await say('ANCIENT TREE: Hmmm... A visitor. It has been a long time.');
      await say('ANCIENT TREE: I keep the unwritten pages. They open only to their word.');
      T.met = true;
    } else {
      await say('ANCIENT TREE: Hmmm... You again.');
    }
    await say('ANCIENT TREE: Password?');
    close();
    const pw = await NAMING.open();
    if (!pw) { await say('ANCIENT TREE: ...Come back when you remember.'); return; }
    await say('ANCIENT TREE: ...', { wait: false, speed: 1 });
    const res = await VAULT.tryPassword(pw);
    if (!res.ok) {
      await say(res.error === 'net'
        ? 'ANCIENT TREE: ...The pages cannot be reached just now. Try again later.'
        : 'ANCIENT TREE: ...No. That is not the word.');
      return;
    }
    await say('ANCIENT TREE: ...Yes. That is the word.');
    await say('ANCIENT TREE: Shall I remember you?\nKeep logged in?', { wait: false });
    const keep = await yesno();
    const ok = await VAULT.remember(res.key, keep);
    if (keep) await say(ok ? 'ANCIENT TREE: Then I will remember you, until you log out.' : 'ANCIENT TREE: This browser will not let me remember. I will forget you when you leave.');
    else await say('ANCIENT TREE: Then I will forget you when you close this tab.');
    await say('ANCIENT TREE: Go on. The pages are waiting.');
    close();
    await fadeTo(1, 40, '248,248,248');
    TG.stop();
    VAULT.show(res.data);
  }

  // ---------------------------------------------------------------- password keyboard
  const NAMING = (() => {
    const PAGES = [
      ['abcdefgh', 'ijklmnop', 'qrstuvwx', "yz.,'-!?"],
      ['ABCDEFGH', 'IJKLMNOP', 'QRSTUVWX', "YZ.,'-!?"],
      ['01234567', '89()/&+=', '#@*%~_:;', '"$<>[]^|'],
    ];
    const PAGE_NAMES = ['abc', 'ABC', '123'];
    const BTN = ['PAGE', 'BACK', 'OK'];
    const MAXLEN = 40;
    let st = null, saved = null;
    const input = document.getElementById('pw');

    function sync() { if (input.value !== st.value) input.value = st.value; }
    function typeChar(ch) { if (st.value.length < MAXLEN) { st.value += ch; sync(); } }
    function back() { st.value = st.value.slice(0, -1); sync(); }
    function done(v) {
      const res = st.res;
      st = null;
      input.value = ''; input.blur(); input.hidden = true;
      TG.state.textInput = false; TG.releaseAll();
      TG.hooks.update = saved.u; TG.hooks.render = saved.r;
      res(v);
    }
    function activate() {
      if (st.cx < 8) typeChar(PAGES[st.page][st.cy][st.cx]);
      else if (st.cy === 0) st.page = (st.page + 1) % PAGES.length;
      else if (st.cy === 1) back();
      else done(st.value);
    }
    function update() {
      if (!st) return;
      st.t++;
      if (pressed.left) { if (st.cx === 8) { st.cx = 7; } else if (st.cx > 0) st.cx--; }
      if (pressed.right) { if (st.cx < 7) st.cx++; else if (st.cx === 7) { st.cx = 8; st.cy = Math.min(st.cy, 2); } }
      if (pressed.up) st.cy = Math.max(0, st.cy - 1);
      if (pressed.down) st.cy = Math.min(st.cx === 8 ? 2 : 3, st.cy + 1);
      if (pressed.a) activate();
      else if (pressed.b) back();
    }
    function render() {
      if (!st) return;
      g.fillStyle = '#b8d0f0'; g.fillRect(0, 0, 240, 160);
      g.fillStyle = '#a8c4ec';
      for (let k = -160; k < 240; k += 12) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 6, 0); g.lineTo(k + 166, 160); g.lineTo(k + 160, 160); g.fill(); }
      box(6, 3, 228, 56, 'plain');
      text('PASSWORD?', 14, 9);
      text('case sensitive', 226 - measure('case sensitive'), 9, '#8890a0', '#e0e0e8');
      const n = 16, x0 = 22, sp = 12;
      const shown = st.value.length > n ? st.value.slice(-n) : st.value;
      for (let i = 0; i < n; i++) {
        const cx = x0 + i * sp;
        if (i < shown.length) text('*', cx, 24);
        const cur = i === Math.min(shown.length, n - 1) && ((st.t >> 4) & 1);
        g.fillStyle = cur ? '#e04838' : '#686878';
        g.fillRect(cx - 1, 35, 7, 1);
      }
      text('Type on your keyboard, or pick letters.', 14, 43, '#8890a0', null);
      // keyboard
      box(6, 62, 180, 94, 'plain');
      const page = PAGES[st.page];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 8; c++) {
          const ch = page[r][c], cx = 16 + c * 21, cy = 70 + r * 21;
          if (st.cx === c && st.cy === r) {
            g.fillStyle = '#f8c870'; g.fillRect(cx - 4, cy - 4, 16, 17);
            g.fillStyle = '#e09030'; g.fillRect(cx - 4, cy + 12, 16, 1);
          }
          text(ch, cx + Math.floor((6 - measure(ch)) / 2), cy);
          TG.region(cx - 5, cy - 5, 21, 22, () => { st.cx = c; st.cy = r; activate(); });
        }
      // buttons
      BTN.forEach((b, i) => {
        const bx = 190, by = 62 + i * 32, label = i === 0 ? PAGE_NAMES[(st.page + 1) % 3] : b;
        box(bx, by, 44, 30, st.cx === 8 && st.cy === i ? 'menu' : 'plain');
        if (st.cx === 8 && st.cy === i) { g.fillStyle = '#f8c870'; g.fillRect(bx + 4, by + 4, 36, 22); }
        text(i === 0 ? 'PAGE' : b, bx + 22 - measure(i === 0 ? 'PAGE' : b) / 2, by + 6);
        if (i === 0) text(label, bx + 22 - measure(label) / 2, by + 17, '#8890a0', null);
        TG.region(bx, by, 44, 30, () => { st.cx = 8; st.cy = i; activate(); });
      });
    }
    input.addEventListener('input', () => {
      if (!st) return;
      st.value = input.value.slice(0, MAXLEN);
      if (input.value !== st.value) input.value = st.value;
    });
    input.addEventListener('keydown', e => {
      if (!st) return;
      const mv = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
      if (mv) { e.preventDefault(); TG.keyDown(mv); TG.keyUp(mv); return; }
      if (e.key === 'Enter') { e.preventDefault(); done(st.value); return; }
      if (e.key === 'Escape') { e.preventDefault(); done(null); return; }
      if (e.key === 'Tab') e.preventDefault();
    });
    function open() {
      return new Promise(res => {
        st = { page: 0, cx: 0, cy: 0, value: '', res, t: 0 };
        saved = { u: TG.hooks.update, r: TG.hooks.render };
        TG.hooks.update = update; TG.hooks.render = render;
        TG.releaseAll();
        TG.state.textInput = true;
        input.value = ''; input.hidden = false;
        try { input.focus({ preventScroll: true }); } catch (_) {}
      });
    }
    return { open, get active() { return !!st; } };
  })();

  // ---------------------------------------------------------------- entry
  function enter() {
    TG.hooks.update = update;
    TG.hooks.render = render;
  }
  function start() {
    loadScene('crossroads');
    enter();
    TG.start();
  }
  return { start, enter, S, P, RAB, SCENES, loadScene, run, say, whiteout, NAMING, shake, flash, get scene() { return S.scene; } };
})();
