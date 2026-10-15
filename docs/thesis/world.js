/* Thesis gate: overworld (maps, walking, NPCs, encounters, scripts, password keyboard). */
'use strict';
window.WORLD = (() => {
  const { g, draw, text, measure, say, close, choose, yesno, wait, fadeTo, held, pressed, dir, crand, box } = TG;
  const DX = { up: 0, down: 0, left: -1, right: 1 }, DY = { up: -1, down: 1, left: 0, right: 0 };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const DIRS = ['up', 'down', 'left', 'right'];
  const WALK = 14, RUN = 8, TURN = 4;
  const WHITE = '248,248,248';
  const st = () => window.STORY;

  // ---------------------------------------------------------------- maps
  const SCENES = {
    crossroads: {
      map: [
        'TTTTTCCCCCTTTTT',
        'TTTTTCCCCCTTTTT',
        'T;;..CCDCC.;;TT',
        'T;;;......;FFFF',
        'T;;..s....;FhPP',
        '======.....OPPP',
        'T;;;;......FPyP',
        'T;;;;;...;;FFFF',
        'T;;;*....;;;r.T',
        'TTTTTTTTTTTTTTT',
      ],
      warps: [
        { x: 7, y: 2, to: 'cave', tx: 7, ty: 8, dir: 'up' },
        { x: 11, y: 5, to: 'pen', tx: 1, ty: 5, dir: 'right' },
      ],
      edges: [{ x: 0, y: 5, dir: 'left', to: 'forest', tx: 14, ty: 6 }],
      talk: {
        C: () => st().caveRock,
        s: () => st().sign,
        r: 'A big, smooth rock.',
        h: 'A wooden hutch. It smells of hay.',
        y: 'A pile of hay.',
        P: 'The RABBIT PEN. The way in is to the west.',
      },
    },
    cave: {
      dark: true,
      map: [
        '###############',
        '##t#########t##',
        '#____BBBBB____#',
        '#____BBBBB____#',
        '#_b__BBBBB___b#',
        '#____________b#',
        '#_b___________#',
        '#_____________#',
        '#_____________#',
        '#######X#######',
      ],
      warps: [{ x: 7, y: 9, to: 'crossroads', tx: 7, ty: 3, dir: 'down' }],
      talk: {
        '#': () => st().cave.wall,
        t: () => st().cave.torch,
        b: () => st().cave.bones,
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
    ward: {
      asylum: true,
      map: [
        'WWWWWWWWWWWWWWW',
        'W,,,,,,,,W,,,^W',
        'W,WWW,WW,W,WWWW',
        'W,W,,,,W,W,,,,W',
        'W,W,WW,W,WWW,WW',
        'W,,,W,,W,,,,,,W',
        'WWW,W,WWWWW,WWW',
        'WZ,,W,,,,,,,,,W',
        'WZ,,W,WWWWWW,YW',
        'WWWWWWWWWWWWWWW',
      ],
      warps: [{ x: 13, y: 1, to: 'cells', tx: 7, ty: 8, dir: 'up' }],
      talk: { W: () => st().asylum.wall, Z: () => st().asylum.bed, Y: () => st().asylum.desk },
    },
    cells: {
      asylum: true,
      map: [
        'WWWWWWWWWWWWWWW',
        'WZ,W%,,,,,%W,ZW',
        'W,,W%,,,,,%W,,W',
        'W%%W%%%+%%%W%%W',
        'W,,,,,,,,,,,,,W',
        'W,,,,,,,,,,,,,W',
        'WWWWWWWWWWW,WWW',
        'W,,,,,,,,,,,,,W',
        'WY,,,W,,,,,,,YW',
        'WWWWWWW^WWWWWWW',
      ],
      warps: [{ x: 7, y: 9, to: 'ward', tx: 12, ty: 1, dir: 'left' }],
      talk: { W: () => st().asylum.wall, Z: () => st().asylum.bed, Y: () => st().asylum.desk },
    },
  };
  for (const k in SCENES) {
    const m = SCENES[k].map;
    if (m.length !== 10 || m.some(r => r.length !== 15)) throw new Error('bad map ' + k);
  }
  const SOLID = new Set(['T', 'F', 'C', 's', 'r', 'h', 'y', 'c', 'o', 'L', 'A', 'B', 'P', '#', 't', 'W', 'Z', 'Y', '%', '+']);

  // buried rare candies, one per spot per page session
  const DIG = [
    ['crossroads', 3, 4], ['crossroads', 10, 2], ['crossroads', 8, 8], ['pen', 2, 2], ['pen', 13, 7],
    ['forest', 3, 5], ['forest', 12, 7], ['cave', 12, 7],
  ];
  const PLACE = { crossroads: 'CROSSROADS', pen: 'RABBIT PEN', forest: 'OLD FOREST', cave: 'CAVE' };
  const digKey = (s, x, y) => `${s}:${x},${y}`;
  function digAt(x, y) { return DIG.some(([s, dx, dy]) => s === S.scene && dx === x && dy === y); }

  // ---------------------------------------------------------------- state
  const S = {
    scene: 'crossroads', busy: 0,
    beast: { awake: false, chapter: 0, started: false, done: false, score: 0, asked: 0 },
    tree: { awake: false, met: false, wrong: 0, fire: false },
    dug: {},
    asylum: null,
  };
  const P = { x: 7, y: 5, dir: 'up', moving: false, t: 0, dur: WALK, foot: 0, turn: 0, bump: 0, sink: 0 };
  const RAB = { x: 8, y: 4, dir: 'down', moving: false, prog: 0, tx: 8, ty: 4, timer: 90, munch: 0, dig: 0, jump: 0, ox: 0, oy: 0 };
  let sc = null, bg = null;
  const FX = [];

  // asylum workers and sisters (fresh on every arrest)
  function freshAsylum() {
    const trainers = {};
    const T = (window.DEX && DEX.trainers) || {};
    for (const id in T) {
      const t = T[id];
      if (t.double) continue;
      trainers[id] = { id, name: t.name, scene: t.scene, hx: t.x, hy: t.y, hdir: t.dir, x: t.x, y: t.y, dir: t.dir,
        sight: t.sight, over: t.over, defeated: false, moving: false, t: 0, foot: 0 };
    }
    return { trainers, sistersBeaten: false };
  }
  function trainersHere() {
    if (!S.asylum) return [];
    return Object.values(S.asylum.trainers).filter(t => t.scene === S.scene);
  }
  function homeTrainers() {
    if (!S.asylum) return;
    for (const t of Object.values(S.asylum.trainers)) {
      t.x = t.hx; t.y = t.hy; t.dir = t.hdir; t.moving = false; t.t = 0;
    }
  }
  const SISTERS = [{ x: 6, y: 4, over: 'sisp' }, { x: 8, y: 4, over: 'sisd' }];
  const CIN = { x: 7, y: 2 };

  function tileAt(x, y) { return (x < 0 || y < 0 || x > 14 || y > 9) ? null : sc.map[y][x]; }
  function solid(x, y) { const t = tileAt(x, y); return t === null || SOLID.has(t); }
  function rabbitHere(x, y) {
    if (S.scene !== 'pen') return false;
    return (RAB.x === x && RAB.y === y) || (RAB.moving && RAB.tx === x && RAB.ty === y);
  }
  function trainerAt(x, y) {
    return trainersHere().find(t => (t.x === x && t.y === y) || (t.moving && t.x + DX[t.dir] === x && t.y + DY[t.dir] === y)) || null;
  }
  function sisterAt(x, y) { return S.scene === 'cells' && SISTERS.some(s => s.x === x && s.y === y); }
  function npcAt(x, y) { return !!trainerAt(x, y) || sisterAt(x, y) || (S.scene === 'cells' && x === CIN.x && y === CIN.y); }
  function blocked(x, y) { return solid(x, y) || rabbitHere(x, y) || npcAt(x, y); }

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
      case '#': return (x * 7 + y * 3) % 3 ? 'cwall' : 'cwall2';
      case 't': return 'ctorch0';
      case 'b': return 'cbones';
      case 'X': return 'cexit';
      case '_': case 'B': return (x * 3 + y) % 4 ? 'cfloor' : 'cfloor2';
      case 'W': return 'awall';
      case ',': return (x * 3 + y) % 4 ? 'afloor' : 'afloor2';
      case 'Z': return 'abed';
      case 'Y': return 'adesk';
      case '%': return 'acell';
      case '+': return 'acelldoor';
      case '^': return 'adoorway';
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
    if (name === 'pen') { RAB.x = 8; RAB.y = 4; RAB.moving = false; RAB.prog = 0; RAB.timer = 60; RAB.dir = 'down'; RAB.ox = RAB.oy = 0; RAB.dig = 0; }
    if (name === 'forest') initFireflies();
  }
  function resetP() { P.moving = false; P.t = 0; P.bump = 0; P.turn = 0; P.sink = 0; }
  function place(name, x, y, d) { loadScene(name); P.x = x; P.y = y; P.dir = d; resetP(); }
  function teleport(name, x, y, d = 'up') { place(name, x, y, d); }

  // ---------------------------------------------------------------- particles
  const flies = [];
  function initFireflies() {
    flies.length = 0;
    for (let i = 0; i < 12; i++) flies.push({ x: crand() * 240, y: 20 + crand() * 120, p: crand() * 6.28, s: 0.3 + crand() * 0.4 });
  }
  const zzz = [];
  function spawnZ(x, y) { zzz.push({ x, y, t: 0, big: crand() < 0.5 }); }

  // ---------------------------------------------------------------- update
  function update() {
    if (S.busy === 0 || P.moving) updatePlayer();
    updateRabbit();
    const f = TG.frame;
    if (S.scene === 'cave' && !S.beast.awake && f % 48 === 0) spawnZ(122 + crand() * 8, 34);
    if (S.scene === 'crossroads' && f % 70 === 0) spawnZ(118, 8);
    for (let i = zzz.length - 1; i >= 0; i--) {
      const z = zzz[i]; z.t++; z.x += 0.25; z.y -= 0.35;
      if (z.t > 70) zzz.splice(i, 1);
    }
    for (const fl of flies) { fl.p += 0.03; fl.x += Math.cos(fl.p) * fl.s; fl.y += Math.sin(fl.p * 1.3) * fl.s * 0.6; if (fl.x < -4) fl.x = 244; if (fl.x > 244) fl.x = -4; }
    for (let i = FX.length - 1; i >= 0; i--) { const e = FX[i]; e.t++; if (e.life && e.t > e.life) FX.splice(i, 1); }
  }
  const heldDir = () => dir() || DIRS.find(k => pressed[k]);
  function updatePlayer() {
    if (P.moving) {
      P.t += held[P.dir] ? 1 : 2;
      if (P.t >= P.dur) arrive();
      return;
    }
    if (P.bump > 0) {
      P.bump--;
      if (!dir() || dir() !== P.dir) P.bump = 0;
      else if (P.bump === 0 && !S.busy) tryMove(P.dir);
      return;
    }
    if (S.busy) return;
    if (pressed.a) { interact(); return; }
    const d = heldDir();
    if (!d) { P.turn = 0; return; }
    if (d !== P.dir) { P.dir = d; P.turn = TURN; return; }
    if (P.turn > 0 && --P.turn > 0) return;
    tryMove(d);
  }
  function tryMove(d) {
    P.dir = d; P.turn = 0;
    const edge = (sc.edges || []).find(e => e.x === P.x && e.y === P.y && e.dir === d);
    if (!edge && blocked(P.x + DX[d], P.y + DY[d])) { P.bump = 16; return; }
    P.moving = true; P.t = 0; P.dur = held.b ? RUN : WALK;
  }
  function arrive() {
    P.x += DX[P.dir]; P.y += DY[P.dir]; P.foot ^= 1; P.t = 0; P.moving = false;
    if (P.x < 0 || P.x > 14 || P.y < 0 || P.y > 9) {
      const e = (sc.edges || []).find(q => q.x === P.x - DX[P.dir] && q.y === P.y - DY[P.dir] && q.dir === P.dir);
      if (e) run(() => warp(e.to, e.tx, e.ty, P.dir));
      return;
    }
    const w = (sc.warps || []).find(q => q.x === P.x && q.y === P.y);
    if (w) { run(() => warp(w.to, w.tx, w.ty, w.dir)); return; }
    spotCheck();
    if (!S.busy) grassCheck();
    if (S.busy) return;
    const d = heldDir();
    if (d) tryMove(d);
  }
  async function warp(to, tx, ty, d) {
    await fadeTo(1, 12, '0,0,0');
    place(to, tx, ty, d);
    await wait(6);
    await fadeTo(0, 12);
  }
  function updateRabbit() {
    if (S.scene !== 'pen') return;
    if (RAB.munch > 0) RAB.munch--;
    if (RAB.dig > 0) { RAB.dig--; RAB.ox = RAB.dig > 0 ? (((RAB.dig >> 1) & 1) ? 1 : -1) : 0; }
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

  // ---------------------------------------------------------------- wild grass
  function grassCheck() {
    const E = window.DEX && DEX.encounters && DEX.encounters.grass;
    if (!E || !E.scenes.includes(S.scene) || tileAt(P.x, P.y) !== ';') return;
    if (Math.random() >= E.rate) return;
    const r = Math.random() * 100;
    let acc = 0, row = E.table[E.table.length - 1];
    for (const e of E.table) { acc += e.weight; if (r < acc) { row = e; break; } }
    const level = row.min + Math.floor(Math.random() * (row.max - row.min + 1));
    let sp = row.species;
    const ev = DEX.species[sp] && DEX.species[sp].evolves;
    if (ev && ev.level <= level) sp = ev.into;
    run(() => wildBattle(sp, level));
  }
  async function wildBattle(species, level) {
    TG.releaseAll();
    const r = await BATTLE.start({ kind: 'wild', foes: [{ species, level }], canRun: true, bg: S.scene === 'forest' ? 'forest' : 'grass' });
    await afterBattle(r, 'crossroads');
    return r;
  }
  async function afterBattle(r, dest) {
    if (r === 'lose') await whiteout(dest);
    else if (r === 'arrested') await arrest();
  }

  // ---------------------------------------------------------------- render
  function prefix() { return window.BATTLE && BATTLE.ME && BATTLE.ME.species === 'phd' ? 'd' : 'p'; }
  function personFrame(pre, d, f) { return [`${pre}_${d === 'right' ? 'left' : d}_${f}`, d === 'right']; }
  function playerFrame() {
    let f = 0;
    if (P.moving) { if (P.t < P.dur / 2) f = P.foot === 0 ? 1 : 2; }
    else if (P.bump > 0) f = ((P.bump >> 3) & 1) ? 1 : 2;
    return personFrame(prefix(), P.dir, f);
  }
  function playerPos() {
    const o = P.moving ? Math.round(16 * Math.min(P.t, P.dur) / P.dur) : 0;
    return [P.x * 16 + DX[P.dir] * o, P.y * 16 + DY[P.dir] * o];
  }
  function npcFrame(n) {
    const f = n.moving && n.t < WALK / 2 ? (n.foot === 0 ? 1 : 2) : 0;
    return personFrame(n.over, n.dir, f);
  }
  function render() {
    const f = TG.frame;
    g.drawImage(bg, 0, 0);
    // animated tiles
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 15; x++) {
        const ch = sc.map[y][x];
        if (ch === '*' && ((f >> 5) & 1)) draw('flower1', x * 16, y * 16);
        else if (ch === 't') draw(((f >> 3) + x) & 1 ? 'ctorch1' : 'ctorch0', x * 16, y * 16);
      }
    // dig spots
    for (const [s, x, y] of DIG) {
      if (s !== S.scene) continue;
      const n = S.dug[digKey(s, x, y)] ? 'dug' : (f + x * 13) % 96 < 8 ? 'dig1' : 'dig0';
      draw(n, x * 16, y * 16);
    }
    // big objects
    if (S.scene === 'crossroads') draw('cave', 80, 0);
    if (S.scene === 'cave') {
      const breathe = !S.beast.awake && ((f >> 5) & 1) ? 1 : 0;
      draw(S.beast.awake ? 'beast_awake' : 'beast_sleep', 80, 32 + breathe);
    }
    if (S.scene === 'forest') {
      const T = S.tree;
      draw(T.fire ? (((f >> 3) & 1) ? 'atree_fire1' : 'atree_fire0') : T.awake ? 'atree_awake' : 'atree', 80, 0);
    }
    // characters, sorted by y
    const ents = [];
    const [px, py] = playerPos();
    ents.push({ y: py, fn: () => { const [n, fl] = playerFrame(); draw(n, px, py - 4 + P.sink, fl); } });
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
    for (const t of trainersHere()) {
      const o = t.moving ? Math.round(16 * t.t / WALK) : 0;
      const tx = t.x * 16 + DX[t.dir] * o, ty = t.y * 16 + DY[t.dir] * o;
      ents.push({ y: ty, fn: () => { const [n, fl] = npcFrame(t); draw(n, tx, ty - 4, fl); } });
    }
    if (S.scene === 'cells') {
      for (const s of SISTERS) ents.push({ y: s.y * 16, fn: () => draw(`${s.over}_down_0`, s.x * 16, s.y * 16 - 4) });
      ents.push({ y: CIN.y * 16, fn: () => draw('cin_down_0', CIN.x * 16, CIN.y * 16 - 4) });
    }
    ents.sort((a, b) => a.y - b.y).forEach(e => e.fn());
    // particles
    for (const z of zzz) {
      if ((S.scene === 'cave' && z.y > 0) || S.scene === 'crossroads') {
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
      if (S.tree.fire) {
        g.fillStyle = `rgba(232,88,32,${0.2 + 0.05 * Math.sin(f / 4)})`;
        g.fillRect(0, 0, 240, 160);
      }
    }
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
  async function flash(color = WHITE, frames = 6) {
    await fadeTo(0.8, frames >> 1, color);
    await fadeTo(0, frames >> 1, color);
  }
  function facing() { return [P.x + DX[P.dir], P.y + DY[P.dir]]; }
  async function sayAll(lines) { for (const l of lines) await say(l); }
  const isWhite = () => TG.FADE.a >= 1 && TG.FADE.color === WHITE;

  function interact() {
    const [fx, fy] = facing();
    if (S.scene === 'pen' && rabbitHere(fx, fy) && !RAB.moving) { run(rabbitTalk); return; }
    const tr = trainerAt(fx, fy);
    if (tr && !tr.moving) { run(() => trainerTalk(tr)); return; }
    const t = tileAt(fx, fy);
    if (S.scene === 'cells' && (sisterAt(fx, fy) || t === '+')) {
      if (!S.asylum.sistersBeaten) run(sistersBattle);
      else if (t === '+') run(rescue);
      else run(() => sayAll(st().sisters.after));
      return;
    }
    if (S.scene === 'cells' && t === '%') {
      run(() => say(fy === 3 && fx >= 4 && fx <= 10 ? st().cinderella.psst : st().asylum.cell));
      return;
    }
    if (digAt(fx, fy)) { run(() => dig(fx, fy)); return; }
    if (S.scene === 'cave' && t === 'B') { run(beastTalk); return; }
    if (S.scene === 'forest' && t === 'A') { run(treeTalk); return; }
    if (t === 'D' && S.scene === 'crossroads') return;
    const m = sc.talk && sc.talk[t];
    const msg = typeof m === 'function' ? m() : m;
    if (msg) run(() => say(msg));
  }

  // ---------------------------------------------------------------- digging
  async function dig(x, y) {
    const key = digKey(S.scene, x, y);
    if (S.dug[key]) { await say(st().dig.empty); return; }
    await say(st().dig.soft, { wait: false });
    if (!(await yesno())) return;
    close();
    await shake(6, 1);
    S.dug[key] = true;
    const e = { t: 0, life: 0, draw: t => draw('candy', x * 16, y * 16 - 2 - Math.min(t, 12) - (t > 12 ? Math.round(Math.abs(Math.sin(t / 8)) * 2) : 0)) };
    FX.push(e);
    await wait(14);
    await say(st().dig.found);
    const i = FX.indexOf(e); if (i >= 0) FX.splice(i, 1);
    await say(st().dig.ate);
    close();
    await BATTLE.rareCandy('world');
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
      TG.releaseAll();
      const res = await BATTLE.start({ kind: 'wild', foes: [{ species: 'rabbit', level: 30 }], canRun: true, intro: 'The RABBIT challenges you!', bg: 'grass' });
      await afterBattle(res, 'crossroads');
    } else if (r < 0.8625) {
      RAB.munch = 90;
      await say('The RABBIT is munching on a carrot.\nIt ignores you.');
    } else {
      RAB.dir = 'down';
      RAB.dig = 60;
      await say(st().rabbit.dig);
      const spot = DIG.find(([s, x, y]) => !S.dug[digKey(s, x, y)]);
      await say(spot ? st().rabbit.sniff(PLACE[spot[0]]) : st().rabbit.bored);
    }
  }

  // ---------------------------------------------------------------- faint, arrest
  async function whiteout(dest = 'crossroads') {
    close();
    TG.releaseAll();
    resetP();
    RAB.ox = RAB.oy = 0;
    if (!isWhite()) await fadeTo(1, 30, WHITE);
    if (dest === 'ward') { place('ward', 2, 8, 'up'); homeTrainers(); }
    else place('crossroads', 7, 5, 'up');
    BATTLE.heal();
    await wait(30);
    await fadeTo(0, 30, WHITE);
    await say(st().whiteout[dest]);
  }
  async function arrest() {
    close();
    TG.releaseAll();
    resetP();
    RAB.ox = RAB.oy = 0;
    if (!isWhite()) await fadeTo(1, 30, WHITE);
    S.asylum = freshAsylum();
    place('ward', 2, 8, 'up');
    BATTLE.heal();
    await wait(30);
    await fadeTo(0, 30, WHITE);
    await sayAll(st().asylum.wake);
  }

  // ---------------------------------------------------------------- asylum
  function sees(t) {
    for (let k = 1; k <= t.sight; k++) {
      const x = t.x + DX[t.dir] * k, y = t.y + DY[t.dir] * k;
      if (solid(x, y)) return 0;
      if (x === P.x && y === P.y) return k;
    }
    return 0;
  }
  function spotCheck() {
    if (!S.asylum) return;
    if (S.scene === 'cells' && !S.asylum.sistersBeaten && P.x >= 5 && P.x <= 9 && P.y >= 4 && P.y <= 5) { run(sistersBattle); return; }
    for (const t of trainersHere()) {
      if (t.defeated) continue;
      const k = sees(t);
      if (k) { run(() => trainerSpots(t, k)); return; }
    }
  }
  async function npcStep(n, d) {
    n.dir = d; n.moving = true;
    for (let i = 0; i < WALK; i++) { n.t = i; await wait(1); }
    n.x += DX[d]; n.y += DY[d]; n.t = 0; n.moving = false; n.foot ^= 1;
  }
  function trainerFoes(T) {
    return T.foes.map(f => {
      const o = { species: f.species, level: Math.max(f.min, BATTLE.ME.level + f.offset) };
      if (f.moves) o.moves = f.moves.slice();
      return o;
    });
  }
  async function trainerSpots(t, k) {
    TG.releaseAll();
    await emote(t.x * 16, t.y * 16 - 14, 30);
    for (let i = 1; i < k; i++) await npcStep(t, t.dir);
    P.dir = OPP[t.dir];
    await trainerFight(t);
  }
  async function trainerTalk(t) {
    if (t.defeated) { t.dir = OPP[P.dir]; await say(st().trainers[t.id].after); t.dir = t.hdir; return; }
    TG.releaseAll();
    t.dir = OPP[P.dir];
    await emote(t.x * 16, t.y * 16 - 14, 30);
    await trainerFight(t);
  }
  async function trainerFight(t) {
    const L = st().trainers[t.id], T = DEX.trainers[t.id];
    await say(L.intro);
    close();
    const r = await BATTLE.start({ kind: 'trainer', foes: trainerFoes(T), canRun: false, bg: 'asylum', intro: `${T.name} wants to battle!` });
    if (r === 'win' || r === 'police') {
      t.defeated = true;
      await say(L.defeat);
      close();
      const back = Math.abs(t.x - t.hx) + Math.abs(t.y - t.hy);
      if (back) { const d = OPP[t.hdir]; for (let i = 0; i < back; i++) await npcStep(t, d); }
      t.dir = t.hdir;
    } else await afterBattle(r, 'ward');
  }
  async function sistersBattle() {
    TG.releaseAll();
    P.dir = P.y === 4 && P.x === 5 ? 'right' : P.y === 4 && P.x === 9 ? 'left' : 'up';
    await Promise.all(SISTERS.map(s => emote(s.x * 16, s.y * 16 - 14, 30)));
    await sayAll(st().sisters.intro);
    close();
    const T = DEX.trainers.sisters;
    const r = await BATTLE.start({ kind: 'trainer', foes: trainerFoes(T), canRun: false, bg: 'asylum', intro: 'PRUDENCE and GRISELDA want to battle!' });
    if (r === 'win' || r === 'police') {
      S.asylum.sistersBeaten = true;
      await sayAll(st().sisters.defeat);
    } else await afterBattle(r, 'ward');
  }
  async function rescue() {
    await sayAll(st().cinderella.rescue);
    close();
    const cx = P.x * 16 + 4, cy = P.y * 16 + 2;
    FX.push({ t: 0, life: 40, draw: t => {
      for (let i = 0; i < 6; i++) {
        const a = t / 6 + i * Math.PI / 3, rr = 16 - t / 4;
        if ((t + i) % 4 < 3) draw('spark', cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8);
      }
    } });
    await wait(40);
    await fadeTo(1, 40, WHITE);
    place('crossroads', 7, 5, 'up');
    BATTLE.heal();
    S.asylum = freshAsylum();
    await wait(20);
    await fadeTo(0, 30, WHITE);
    await sayAll(st().cinderella.home);
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
      if (res.error === 'net') { await say('ANCIENT TREE: ...The pages cannot be reached just now. Try again later.'); return; }
      T.wrong++;
      if (T.wrong >= 3) { await fireTree(); return; }
      await say('ANCIENT TREE: ...No. That is not the word.');
      if (T.wrong === 2) await say(st().tree.warn);
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
    await fadeTo(1, 40, WHITE);
    TG.stop();
    VAULT.show(res.data);
  }
  async function fireTree() {
    const T = S.tree, ST = st().tree;
    await say(ST.third);
    close();
    T.fire = true;
    await Promise.all([shake(30, 3), flash('232,72,56', 12)]);
    await sayAll(ST.burst);
    close();
    TG.releaseAll();
    const r = await BATTLE.start({ kind: 'wild', foes: [{ species: 'firetree', level: 70 }], canRun: true, bg: 'forest', intro: 'The FIRE TREE wants to battle!' });
    T.wrong = 0; T.fire = false; T.awake = false;
    if (r === 'win') await sayAll(ST.win);
    else if (r === 'run') await sayAll(ST.ran);
    else if (r === 'police') await sayAll(ST.police);
    else if (r === 'lose') { await whiteout('crossroads'); await sayAll(ST.lost); }
    else if (r === 'arrested') await arrest();
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
    input.addEventListener('blur', () => {
      if (st) setTimeout(() => { if (st) try { input.focus({ preventScroll: true }); } catch (_) {} }, 0);
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
    S.asylum = freshAsylum();
    loadScene('crossroads');
    enter();
    TG.start();
  }
  return {
    start, enter, S, P, RAB, SCENES, loadScene, run, say, whiteout, arrest, teleport, playerFrame, NAMING, shake, flash,
    get scene() { return S.scene; },
  };
})();
