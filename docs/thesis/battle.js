/* Thesis gate: battle system (Gen 3 rules with Sp. Atk/Sp. Def, types, doubles, AI ally, evolution). */
'use strict';
window.BATTLE = (() => {
  const { g, draw, drawSolid, text, measure, say, close, choose, yesno, wait, until, fadeTo, pressed, box, C } = TG;
  const DEX = window.DEX, MV = DEX.moves, SP = DEX.species, CHART = DEX.chart;
  const API = {};

  // ---------------------------------------------------------------- test overrides and randomness
  API.T = { foeMoves: [], hits: [], foeHits: [], runs: [], durations: [], noCrit: false, roll: null };
  const Tq = () => API.T || {};
  function take(q) { const a = Tq()[q]; return Array.isArray(a) && a.length ? { v: a.shift() } : null; }
  const rnd = n => Math.floor(Math.random() * n);
  const pickRand = arr => arr.length <= 1 ? arr[0] : arr[rnd(arr.length)];
  const chance = p => p >= 1 || Math.random() < p;
  function rollTurns(min, max) { const q = take('durations'); return q ? q.v : min + rnd(max - min + 1); }
  function critRoll(mv) { return !Tq().noCrit && Math.random() < (mv.crit ? 1 / 8 : 1 / 16); }
  function dmgRoll() { const r = Tq().roll; return r !== null && r !== undefined ? r : 85 + rnd(16); }

  // ---------------------------------------------------------------- formulas
  const KEYS6 = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  function stats(id, L) {
    const b = SP[id].base, o = {};
    for (const k of KEYS6) { const v = Math.floor((2 * b[k] + 15) * L / 100); o[k] = k === 'hp' ? v + L + 10 : v + 5; }
    return o;
  }
  function expFor(growth, L) { if (L <= 1) return 0; const c = L * L * L; return growth === 'agent' ? Math.floor(c / 8) : c; }
  function defaultMoves(id, L) {
    const out = [];
    for (const [lv, m] of SP[id].learnset) { if (lv > L) continue; const i = out.indexOf(m); if (i >= 0) out.splice(i, 1); out.push(m); }
    return out.slice(-4);
  }
  const stageMult = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
  const clamp6 = n => Math.max(-6, Math.min(6, n));
  const accMult = s => { s = clamp6(s); return s >= 0 ? (3 + s) / 3 : 3 / (3 - s); };
  function effOf(type, types) { const row = CHART[type] || {}; let e = 1; for (const t of types) e *= row[t] === undefined ? 1 : row[t]; return e; }
  const levelFactor = (Lu, Lt) => Math.min(1, (Lu / Lt) ** 2);
  const fraction = (Lu, Lt, maxHp, frac) => Math.max(1, Math.floor(maxHp * frac * levelFactor(Lu, Lt) + 1e-9));
  const ohkoAllowed = (Lu, Lt) => Lu >= Lt;
  function escapeNum(S, F, att, ds) {
    if (S >= F && !ds) return 256;
    let o = Math.min(256, Math.floor(S * 128 / F) + 30 * att);
    if (ds) o = Math.floor(o / 8);
    return o;
  }
  const escapeOdds = (S, F, att, ds) => escapeNum(S, F, att, ds) / 256;
  const expGain = (y, L, trainer) => Math.floor((trainer ? 1.5 : 1) * y * L / 7);
  // a, d: {level, st, types, stages?, status?}; o: {crit, roll, spread}
  function dmgCore(a, d, mv, o) {
    const phys = mv.cat === 'physical', ak = phys ? 'atk' : 'spa', dk = phys ? 'def' : 'spd';
    let as = a.stages ? a.stages[ak] : 0, ds = d.stages ? d.stages[dk] : 0;
    if (o.crit) { if (as < 0) as = 0; if (ds > 0) ds = 0; }
    const A = Math.max(1, Math.floor(a.st[ak] * stageMult(as))), D = Math.max(1, Math.floor(d.st[dk] * stageMult(ds)));
    let base = Math.floor(Math.floor(Math.floor(2 * a.level / 5 + 2) * mv.power * A / D) / 50);
    if (a.status === 'brn' && phys) base = Math.floor(base / 2);
    if (o.spread) base = Math.floor(base / 2);
    base += 2;
    if (o.crit) base *= 2;
    if (a.types.includes(mv.type)) base = Math.floor(base * 1.5);
    const row = CHART[mv.type] || {};
    let eff = 1;
    for (const t of d.types) { const f = row[t] === undefined ? 1 : row[t]; eff *= f; base = Math.floor(base * f); }
    if (eff === 0) return { dmg: 0, eff };
    return { dmg: Math.max(1, Math.floor(base * o.roll / 100)), eff };
  }
  const calcFighter = s => ({ level: s.level, st: stats(s.species, s.level), types: SP[s.species].types, stages: null, status: null });
  const calc = {
    stats, levelFactor, fraction, ohkoAllowed, escapeOdds, expGain, expFor,
    damage(att, def, id, o = {}) {
      return dmgCore(calcFighter(att), calcFighter(def), MV[id], { crit: !!o.crit, roll: o.roll === undefined ? 100 : o.roll }).dmg;
    },
    hitCheck(id, accStage = 0, evaStage = 0) {
      const mv = MV[id];
      if (mv.acc === null || mv.target === 'self') return true;
      return Math.random() * 100 < mv.acc * accMult(accStage - evaStage);
    },
  };

  // ---------------------------------------------------------------- player state (reset on reload)
  const GROW = SP[DEX.player.start_species].growth;
  const EVO_LV = SP.student.evolves.level;
  const ME = {
    species: DEX.player.start_species, level: DEX.player.start_level, exp: expFor(GROW, DEX.player.start_level), hp: 0,
    moves: DEX.player.start_moves.map(id => ({ id, pp: MV[id].pp })),
    ai: { unlocked: false, species: DEX.ai.start_species, level: DEX.ai.start_level, exp: expFor('agent', DEX.ai.start_level),
      moves: defaultMoves(DEX.ai.start_species, DEX.ai.start_level).map(id => ({ id })) },
  };
  ME.hp = stats(ME.species, ME.level).hp;
  function heal() { ME.hp = stats(ME.species, ME.level).hp; ME.moves.forEach(m => { m.pp = MV[m.id].pp; }); }
  const knows = id => ME.moves.some(m => m.id === id);
  function setLevel(n) {
    ME.level = n; ME.exp = expFor(GROW, n);
    ME.species = n >= EVO_LV ? SP.student.evolves.into : 'student';
    ME.moves = defaultMoves(ME.species, n).map(id => ({ id, pp: MV[id].pp }));
    ME.ai.unlocked = knows('ai');
    heal();
  }
  function setAiLevel(n) {
    const A = ME.ai;
    A.level = n; A.exp = expFor('agent', n);
    A.species = n >= SP.ai.evolves.level ? SP.ai.evolves.into : 'ai';
    A.moves = defaultMoves(A.species, n).map(id => ({ id }));
  }

  // ---------------------------------------------------------------- combatants
  const B = { active: false, fx: [], foes: [], me: null, ally: null };
  const newStages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 });
  function fighter(side, species, level, ids, extra) {
    const st = stats(species, level);
    return Object.assign({
      side, species, level, st, maxhp: st.hp, hp: st.hp, shown: st.hp, types: SP[species].types.slice(),
      moves: ids.map(id => ({ id, pp: MV[id].pp })), stages: newStages(),
      status: null, sleep: 0, sleepHeal: 0, confuse: 0, love: 0, loveBy: null, flinch: false, bleed: 0, bleedAmt: 0,
      trappedBy: null, protest: 0, rampage: 0, rampMove: null, policeFor: null, policePending: false,
      gone: false, fainted: false, removed: false, fled: false, clone: false, endured: false, acted: false, ready: true,
      x: 0, y: 0, dx: 0, dy: 0, drop: 0, shake: 0, vis: true, white: false, face: null, alpha: 1, slot: 0,
    }, extra || {});
  }
  function mkMe() {
    const c = fighter('me', ME.species, ME.level, []);
    delete c.hp;
    Object.defineProperty(c, 'hp', { get: () => ME.hp, set: v => { ME.hp = v; }, enumerable: true });
    c.moves = ME.moves; c.shown = ME.hp;
    return c;
  }
  function refreshMe() {
    const c = B.me; if (!c) return;
    c.species = ME.species; c.level = ME.level; c.st = stats(ME.species, ME.level); c.maxhp = c.st.hp;
    c.types = SP[ME.species].types.slice(); c.moves = ME.moves;
  }
  const passive = c => SP[c.species].passive;
  const live = c => !!c && !c.gone && c.hp > 0;
  const everyone = () => [B.me, B.ally, ...B.foes].filter(Boolean);
  const liveFoes = () => B.foes.filter(live);
  const opp = c => c.side === 'foe' ? [B.me, B.ally].filter(live) : liveFoes();
  const effSpe = c => Math.floor(c.st.spe * stageMult(c.stages.spe));
  const NAME = c => SP[c.species].name;
  const nm = c => c.side === 'me' ? 'You' : c.side === 'ally' ? NAME(c) : 'Foe ' + NAME(c);
  const poss = c => c.side === 'me' ? 'Your' : nm(c) + "'s";
  const isAre = c => c.side === 'me' ? 'You are' : nm(c) + ' is';
  const trapped = c => !!c.trappedBy && !c.trappedBy.gone;

  // ---------------------------------------------------------------- layout
  const POS = { single: [144, 3], dbl: [[104, 0], [164, 6]], me: [36, 48], meAlly: [4, 48], ally: [62, 52] };
  function home(c) {
    if (c.side === 'foe') return B.double ? POS.dbl[c.slot] : POS.single;
    if (c.side === 'ally') return POS.ally;
    return B.ally ? POS.meAlly : POS.me;
  }
  function placeHome(c) { const [x, y] = home(c); c.x = x; c.y = y; c.clipY = y + 66; }
  const ctr = c => c.side === 'foe' ? { x: c.x + 28, y: c.y + 29 } : { x: c.x + 34, y: c.y + 28 };
  const hand = c => c.side === 'foe' ? { x: c.x + 18, y: c.y + 40 } : { x: c.x + 56, y: c.y + 24 };

  // ---------------------------------------------------------------- drawing
  const TYPE_COL = {
    NORMAL: '#a8a878', FIRE: '#f08030', WATER: '#6890f0', ELECTRIC: '#f8d030', GRASS: '#78c850', ICE: '#98d8d8',
    FIGHTING: '#c03028', POISON: '#a040a0', GROUND: '#e0c068', FLYING: '#a890f0', PSYCHIC: '#f85888', BUG: '#a8b820',
    ROCK: '#b8a038', GHOST: '#705898', DRAGON: '#7038f8', DARK: '#705848', STEEL: '#b8b8d0', TYPELESS: '#68a090',
  };
  const BGS = {
    grass: { sky: ['#d0ecf8', '#c0e4f4'], ground: ['#a8d880', '#9ccf74'], band: ['#4c9a48', '#3c7c3c'], fleck: '#66b058',
      pad: ['#d4eeb0', '#b8e090', '#78b058'], pad2: '#c8e8a4', dot: '#80c060' },
    forest: { sky: ['#1c4c24', '#1c4c24'], ground: ['#6c9c58', '#64925a'], band: ['#4c8848', '#30603a'], fleck: '#5a9a50',
      pad: ['#90bc78', '#7cac68', '#4c7c40'], pad2: '#88b470', dot: '#5c8c4c' },
  };
  const bgCache = {};
  function buildBG(kind) {
    const c = document.createElement('canvas');
    c.width = 240; c.height = 112;
    const x = c.getContext('2d'), im = x.createImageData(240, 112), d = im.data;
    const put = (i, j, hex) => { const o = (j * 240 + i) * 4; d[o] = parseInt(hex.substr(1, 2), 16); d[o + 1] = parseInt(hex.substr(3, 2), 16); d[o + 2] = parseInt(hex.substr(5, 2), 16); d[o + 3] = 255; };
    const inE = (i, j, cx, cy, rx, ry) => ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1;
    for (let j = 0; j < 112; j++)
      for (let i = 0; i < 240; i++) {
        let col;
        if (kind === 'asylum') {
          if (j < 20) col = j === 19 ? '#c8c8d4' : j === 18 ? '#d4d4e0' : (j < 4 ? '#e4e4ec' : '#ececf2');
          else col = (i % 16 === 0 || (j - 20) % 16 === 0) ? '#d4d4e0' : '#f8f8f8';
          if (inE(i, j, 176, 66, 52, 11)) col = inE(i, j, 176, 65, 48, 9) ? (j < 65 ? '#e8e8f0' : '#dcdce6') : '#c0c0cc';
          if (inE(i, j, 70, 112, 70, 15)) col = inE(i, j, 70, 113, 66, 13) ? '#e4e4ec' : '#c0c0cc';
        } else {
          const P = BGS[kind] || BGS.grass;
          if (j < 12) col = j < 6 ? P.sky[0] : P.sky[1];
          else col = (Math.floor(j / 3) % 2) ? P.ground[0] : P.ground[1];
          const bump = 18 + Math.round(3 * Math.sin(i / 7) + 2 * Math.sin(i / 3.1));
          if (j >= 8 && j < bump) col = (j < bump - 2) ? P.band[0] : P.band[1];
          if (j >= 8 && j < bump && (i * 7 + j * 3) % 13 === 0) col = P.fleck;
          if (inE(i, j, 176, 66, 52, 11)) col = inE(i, j, 176, 65, 48, 9) ? (j < 65 ? P.pad[0] : P.pad[1]) : P.pad[2];
          if (inE(i, j, 70, 112, 70, 15)) col = inE(i, j, 70, 113, 66, 13) ? P.pad2 : P.pad[2];
          if (j > 30 && (i * 13 + j * 7) % 97 === 0 && !inE(i, j, 176, 66, 52, 11) && !inE(i, j, 70, 112, 70, 15)) col = P.dot;
        }
        put(i, j, col);
      }
    x.putImageData(im, 0, 0);
    return c;
  }
  function hpColor(f) { return f > 0.5 ? '#58d878' : f > 0.2 ? '#f8c838' : '#f05838'; }
  function hpBar(x, y, w, f) {
    g.fillStyle = '#283038'; g.fillRect(x - 1, y - 1, w + 2, 5);
    g.fillStyle = '#506058'; g.fillRect(x, y, w, 3);
    const fw = Math.max(0, Math.min(w, Math.ceil(w * f)));
    g.fillStyle = hpColor(f); g.fillRect(x, y, fw, 3);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, fw, 1);
  }
  function badge(s, x, y) {
    g.fillStyle = s === 'BRN' ? '#e08830' : '#9068b0'; g.fillRect(x, y, measure(s) + 4, 9);
    text(s, x + 2, y + 1, '#f8f8f8', null);
  }
  const badgeOf = c => c.status === 'slp' ? 'SLP' : c.status === 'brn' ? 'BRN' : null;
  function foeSprite(c) {
    const s = SP[c.species].sprites;
    if (s.faces) { if (c.face === 'aegyo') return s.faces.aegyo; if (c.status === 'slp') return s.faces.sleep; }
    return s.front;
  }
  function drawFighter(c, name, clipY) {
    if (!c.vis) return;
    g.save(); g.beginPath(); g.rect(0, 0, 240, clipY); g.clip();
    if (c.alpha < 1) g.globalAlpha = Math.max(0, c.alpha);
    const x = Math.round(c.x + c.dx + c.shake), y = Math.round(c.y + c.dy + c.drop);
    if (c.white) drawSolid(name, x, y, [248, 248, 248]); else draw(name, x, y);
    g.restore();
  }
  function foeBoxW(c) {
    const nameW = measure(NAME(c)) + (c.species === 'rabbit' ? measure('♀') + 2 : 0);
    return Math.max(106, nameW + measure('Lv' + c.level) + 22);
  }
  function compactBox(c, x, y) {
    box(x, y, 104, 22, 'hp');
    const cx = text(NAME(c), x + 6, y + 3);
    if (c.species === 'rabbit') text('♀', cx + 2, y + 3, '#e05878', '#f0c8d0');
    const lv = 'Lv' + c.level;
    text(lv, x + 98 - measure(lv), y + 3);
    const bd = badgeOf(c);
    if (bd) badge(bd, x + 96 - measure(lv) - measure(bd) - 6, y + 2);
    hpBar(x + 7, y + 14, 90, c.shown / c.maxhp);
  }
  function render() {
    const bg = B.bg in bgCache ? bgCache[B.bg] : (bgCache[B.bg] = buildBG(B.bg));
    g.drawImage(bg, 0, 0);
    g.fillStyle = '#283038'; g.fillRect(0, 112, 240, 48);
    for (let i = B.foes.length - 1; i >= 0; i--) { const f = B.foes[i]; drawFighter(f, foeSprite(f), f.clipY); }
    if (B.hole > 0 && B.holeC) {
      const k = Math.min(1, B.hole), hx = B.holeC.x + 34;
      g.fillStyle = `rgba(16,12,8,${k})`;
      g.beginPath(); g.ellipse(hx, 104, 30 * k, 6 * k, 0, 0, Math.PI * 2); g.fill();
    }
    for (const c of [B.me, B.ally]) if (c) drawFighter(c, SP[c.species].sprites.back, B.hole > 0 && B.holeC === c ? 104 : 112);
    for (const e of B.fx) e.draw(e.t);
    // foe boxes
    if (B.foeBox > -200) {
      if (!B.double) {
        const f = B.foes[0], w = foeBoxW(f), x = 6 + B.foeBox, y = 12;
        box(x, y, w, 32, 'hp');
        const cx = text(NAME(f), x + 8, y + 6);
        if (f.species === 'rabbit') text('♀', cx + 2, y + 6, '#e05878', '#f0c8d0');
        const lv = 'Lv' + f.level;
        text(lv, x + w - 8 - measure(lv), y + 6);
        g.fillStyle = '#f0a020'; g.fillRect(x + w - 92, y + 18, 13, 7);
        text('HP', x + w - 91, y + 17, '#f8f8f8', null);
        hpBar(x + w - 76, y + 20, 64, f.shown / f.maxhp);
        const b = badgeOf(f);
        if (b) badge(b, x + 8, y + 25 - 1);
      } else {
        B.foes.forEach(f => { if (!f.gone || f.vis) compactBox(f, 2 + B.foeBox, 2 + 24 * f.slot); });
      }
    }
    if (B.ally && B.allyBox > -200) compactBox(B.ally, 132 - B.allyBox, 67);
    // player box (small while the AI is out)
    if (B.meBox < 200 && B.me && B.meSmall) {
      const m = B.me, x = 126 + B.meBox, y = 89;
      box(x, y, 110, 23, 'hp');
      const nx = text('YOU', x + 6, y + 3);
      const bd = badgeOf(m);
      if (bd) badge(bd, nx + 4, y + 2);
      const lv = 'Lv' + ME.level;
      text(lv, x + 104 - measure(lv), y + 3);
      if (m.love > 0) text('♥', x + 94 - measure(lv), y + 3, '#e05878', '#f0c8d0');
      hpBar(x + 7, y + 14, 50, m.shown / m.maxhp);
      const nums = Math.max(0, Math.round(m.shown)) + '/ ' + m.maxhp;
      text(nums, x + 104 - measure(nums), y + 11);
    } else if (B.meBox < 200 && B.me) {
      const m = B.me, x = 126 + B.meBox, y = 68;
      box(x, y, 110, 42, 'hp');
      const nx = text('YOU', x + 10, y + 6);
      const bd = badgeOf(m);
      if (bd) badge(bd, nx + 4, y + 5);
      const lv = 'Lv' + ME.level;
      text(lv, x + 102 - measure(lv), y + 6);
      g.fillStyle = '#f0a020'; g.fillRect(x + 20, y + 17, 13, 7);
      text('HP', x + 21, y + 16, '#f8f8f8', null);
      hpBar(x + 36, y + 19, 64, m.shown / m.maxhp);
      const nums = Math.max(0, Math.round(m.shown)) + '/ ' + m.maxhp;
      text(nums, x + 100 - measure(nums), y + 25);
      if (m.love > 0) text('♥', x + 10, y + 25, '#e05878', '#f0c8d0');
      const lo = expFor(GROW, ME.level), hi = expFor(GROW, ME.level + 1);
      const ef = ME.level >= 100 ? 0 : Math.max(0, Math.min(1, (B.expShown - lo) / (hi - lo)));
      g.fillStyle = '#283038'; g.fillRect(x + 31, y + 35, 72, 4);
      g.fillStyle = '#506058'; g.fillRect(x + 32, y + 36, 70, 2);
      g.fillStyle = '#40a8f8'; g.fillRect(x + 32, y + 36, Math.floor(70 * ef), 2);
      text('EXP', x + 12, y + 32, '#909098', null);
    }
    // move info panel
    if (B.moveInfo !== null && B.moveInfo !== undefined && TG.MENU.open) {
      box(160, 112, 80, 48, 'menu');
      const m = ME.moves[B.moveInfo];
      if (m) {
        const mv = MV[m.id], f = m.pp / mv.pp;
        const col = m.pp === 0 ? '#e04838' : f <= 0.25 ? '#e08830' : f <= 0.5 ? '#c8a020' : C.text;
        text('PP', 168, 118);
        const s = m.pp + '/' + mv.pp;
        text(s, 230 - measure(s), 118, col);
        text('TYPE/', 168, 130);
        text(mv.type, 168, 142);
      }
    }
    if (B.bars > 0) drawBars(B.bars);
    if (B.tint) { g.fillStyle = B.tint; g.fillRect(0, 0, 240, 112); }
  }
  function drawBars(f) {
    g.fillStyle = '#101018';
    for (let k = 0; k < 20; k++) {
      const w = Math.round(240 * f);
      if (k % 2) g.fillRect(240 - w, k * 8, w, 8); else g.fillRect(0, k * 8, w, 8);
    }
  }
  function update() {
    for (let i = B.fx.length - 1; i >= 0; i--) { const e = B.fx[i]; e.t++; if (e.life && e.t >= e.life) B.fx.splice(i, 1); }
    if (B.expTarget !== undefined && B.expShown < B.expTarget)
      B.expShown = Math.min(B.expTarget, B.expShown + Math.max(1, (expFor(GROW, ME.level + 1) - expFor(GROW, ME.level)) / 60));
  }

  // ---------------------------------------------------------------- animation helpers
  const fx = (life, drawFn) => { const e = { t: 0, life, draw: drawFn }; B.fx.push(e); return e; };
  const unfx = e => { const i = B.fx.indexOf(e); if (i >= 0) B.fx.splice(i, 1); };
  async function blink(c) {
    for (let i = 0; i < 4; i++) { c.vis = false; await wait(3); c.vis = true; await wait(3); }
  }
  async function drainBar(c) {
    const step = Math.max(1, c.maxhp / 48);
    for (;;) {
      const target = Math.max(0, c.hp);
      if (Math.abs(c.shown - target) < 0.01) break;
      c.shown = c.shown > target ? Math.max(target, c.shown - step) : Math.min(target, c.shown + step);
      await wait(1);
    }
    c.shown = Math.max(0, c.hp);
  }
  async function projectile(name, x0, y0, x1, y1, frames, arc = 0, miss = false) {
    if (miss) { x1 += 30; y1 -= 26; }
    fx(frames + 1, t => {
      const k = Math.min(1, t / frames);
      draw(name, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * arc);
    });
    await wait(frames);
  }
  async function stoneAnim(u, t, big, miss) {
    const h = hand(u), c = ctr(t);
    await projectile('stone', h.x, h.y, c.x, c.y, big ? 10 : 16, big ? 10 : 24, miss);
    if (big && !miss) await projectile('stone', h.x + 4, h.y - 4, c.x + 8, c.y + 6, 8, 8);
  }
  async function boltAnim(u, t, miss) { const h = hand(u), c = ctr(t); await projectile('bolt', h.x, h.y - 10, c.x - 12, c.y, 10, 0, miss); }
  async function muzzle(u, t, n = 1, spread = 0) {
    const c = ctr(t);
    for (let k = 0; k < n; k++) {
      const dy = spread ? Math.round((TG.crand() - 0.5) * spread) : 0;
      fx(3, () => {
        g.fillStyle = '#f8e070'; g.fillRect(u.x + 62, u.y + 16, 5, 3); g.fillRect(u.x + 64, u.y + 14, 1, 7);
        g.strokeStyle = 'rgba(248,240,160,0.9)'; g.beginPath(); g.moveTo(u.x + 66, u.y + 17.5); g.lineTo(c.x + 2, c.y + 0.5 + dy); g.stroke();
      });
      await wait(3);
    }
  }
  async function crosshair(t) {
    const cx = t.x + 32, cy = t.y + 29;
    for (let i = 0; i <= 20; i++) {
      const s = 2 - i / 20;
      fx(1, () => { const w = 17 * s; g.drawImage(TG.spr('cross'), Math.round(cx - w / 2), Math.round(cy - w / 2), Math.round(w), Math.round(w)); });
      await wait(1);
    }
    fx(12, () => draw('cross', cx - 8, cy - 8));
    await wait(12);
    await fadeTo(0.9, 2, '248,248,248'); await fadeTo(0, 6);
  }
  async function mathAnim(u, t) {
    const sym = ['π', 'Σ', '∫', '√', '=', '+', '×', 'ρ'];
    const a = { x: u.x + 54, y: u.y + 22 }, b = { x: t.x + 28, y: t.y + 27 };
    sym.forEach((s, k) => {
      const t0 = k * 4;
      fx(40 + t0, tt => {
        const v = (tt - t0) / 30;
        if (v < 0 || v > 1) return;
        text(s, a.x + (b.x - a.x) * v, a.y + (b.y - a.y) * v - Math.sin(v * Math.PI) * 10, '#3870d0', '#c8dcf8');
      });
    });
    await wait(64);
  }
  async function phoneAnim(u) {
    const x = u.x + 64, y = u.y + 10;
    fx(40, t => { draw('phone', x, y + ((t >> 2) & 1)); if ((t >> 3) & 1) { text('(', x - 8, y + 2, C.text, null); text(')', x + 9, y + 2, C.text, null); } });
    await wait(40);
  }
  function setTintFlash() {
    let on = true;
    (async () => { let k = 0; while (on) { B.tint = k % 2 ? 'rgba(56,112,208,0.18)' : 'rgba(232,72,56,0.18)'; k++; await wait(6); } B.tint = null; })();
    return { stop() { on = false; } };
  }
  async function policeAnim(t) {
    const stop = t.x - 11, y = t.y + 41;
    let x = 250;
    const e = fx(0, tt => { draw((tt >> 3) & 1 ? 'police0' : 'police1', Math.round(x), y); });
    const tint = setTintFlash();
    const n = Math.max(1, Math.round((250 - stop) / 3));
    for (let i = 0; i <= n; i++) { x = 250 - (250 - stop) * i / n; await wait(1); }
    await wait(16);
    for (let i = 0; i < 40; i++) { x += 4; t.dx += 4; await wait(1); }
    t.vis = false;
    unfx(e);
    tint.stop();
  }
  async function arrestAnim(c) {
    const stop = c.x + 50, y = c.y + 40;
    let x = 250;
    const e = fx(0, tt => { draw((tt >> 3) & 1 ? 'police0' : 'police1', Math.round(x), y); });
    const tint = setTintFlash();
    const n = Math.max(1, Math.round((250 - stop) / 3));
    for (let i = 0; i <= n; i++) { x = 250 - (250 - stop) * i / n; await wait(1); }
    await wait(16);
    return { e, tint, drive: async () => {
      for (let i = 0; i < 50; i++) { x -= 4; c.dx -= 4; await wait(1); }
      c.vis = false; unfx(e); tint.stop();
    } };
  }
  async function holeAnim(t) {
    B.holeC = t;
    for (let i = 0; i <= 10; i++) { B.hole = i / 10; await wait(1); }
    for (let i = 0; i < 18; i++) { t.drop = i * 3; await wait(1); }
    await wait(14);
    for (let i = 18; i >= 0; i--) { t.drop = i * 3; await wait(1); }
    for (let i = 10; i >= 0; i--) { B.hole = i / 10; await wait(1); }
    B.hole = 0; B.holeC = null;
  }
  async function shake(c) { for (let i = 0; i < 8; i++) { c.shake = i % 2 ? 3 : -3; await wait(1); } c.shake = 0; }
  async function hopAnim(u, t) {
    for (let r = 0; r < 2; r++) for (let i = 0; i <= 6; i++) { u.dy = -Math.sin(i / 6 * Math.PI) * 12; await wait(1); }
    u.dy = 0;
    await shake(t);
  }
  async function hearts(from, to, n = 3) {
    for (let k = 0; k < n; k++) {
      const t0 = k * 6;
      fx(36 + t0, t => { const v = (t - t0) / 30; if (v < 0 || v > 1) return; draw('heart', from.x + (to.x - from.x) * v, from.y + (to.y - from.y) * v - Math.sin(v * Math.PI) * 10); });
    }
    await wait(36 + n * 6);
  }
  async function aegyoAnim(u, t) {
    u.face = 'aegyo';
    for (let i = 0; i < 3; i++) { u.dx = 2; await wait(4); u.dx = -2; await wait(4); }
    u.dx = 0;
    await hearts({ x: u.x + 26, y: u.y + 19 }, { x: t.x + 44, y: t.y + 22 }, 3);
    u.face = null;
  }
  function zzz(c) {
    const x = c.side === 'foe' ? c.x + 54 : c.x + 50, y = c.side === 'foe' ? c.y + 9 : c.y + 4;
    fx(40, t => { text(t < 20 ? 'z' : 'Z', x + t * 0.3, y - t * 0.3, '#e8e8f8', '#4c3c78'); });
    return wait(30);
  }
  async function lunge(u, t) {
    const a = ctr(u), b = ctr(t), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L * 6, uy = dy / L * 6;
    for (let i = 1; i <= 4; i++) { u.dx = ux * i / 4; u.dy = uy * i / 4; await wait(1); }
    await wait(2);
    for (let i = 3; i >= 0; i--) { u.dx = ux * i / 4; u.dy = uy * i / 4; await wait(1); }
  }
  async function squares(u, t, col) {
    const a = hand(u), b = ctr(t);
    for (let k = 0; k < 6; k++) {
      const t0 = k * 3, j = (k % 3 - 1) * 3;
      fx(20 + t0, tt => { const v = (tt - t0) / 16; if (v < 0 || v > 1) return; g.fillStyle = col; g.fillRect(Math.round(a.x + (b.x - a.x) * v), Math.round(a.y + (b.y - a.y) * v + j), 3, 3); });
    }
    await wait(34);
  }
  async function wiggle(u) { for (let i = 0; i < 3; i++) { u.dx = 2; await wait(3); u.dx = -2; await wait(3); } u.dx = 0; }
  async function sparks(t) {
    const c = ctr(t), off = [[-14, -12], [10, -6], [-4, 10]];
    off.forEach(([ox, oy], k) => fx(30, tt => { if (tt >= k * 5 && ((tt >> 2) & 1)) draw('spark', c.x + ox - 3, c.y + oy - 3); }));
    await wait(30);
  }
  async function flames(t, frames = 30) {
    const c = ctr(t), off = [[-12, -6], [8, -10], [0, 6]];
    off.forEach(([ox, oy]) => fx(frames, tt => draw((tt >> 3) & 1 ? 'flame1' : 'flame0', c.x + ox - 4, c.y + oy - 5 - (tt % 8 < 4 ? 1 : 0))));
    await wait(frames);
  }
  async function leaves(u, t) {
    const a = ctr(u), b = ctr(t);
    for (let k = 0; k < 8; k++) {
      const t0 = k * 4, j = ((k * 37) % 21) - 10;
      fx(36 + t0, tt => { const v = (tt - t0) / 28; if (v < 0 || v > 1) return; draw('leaf', a.x + (b.x - a.x) * v - 4, a.y + (b.y - a.y) * v + j + Math.sin(v * 9 + k) * 6 - 4); });
    }
    await wait(36 + 32);
  }
  function picket(c, life = 70) {
    fx(life, t => draw('picket', c.x + 40, c.y + 2 + ((t >> 3) & 1 ? -2 : 0)));
  }
  async function whiteFlash(c) { c.white = true; await wait(4); c.white = false; }
  async function faintDrop(c) { for (let i = 0; i <= 16; i++) { c.drop = i * 4; await wait(1); } c.vis = false; }
  async function slide(c, x1, y1, frames) {
    const x0 = c.x, y0 = c.y;
    for (let i = 1; i <= frames; i++) { c.x = x0 + (x1 - x0) * i / frames; c.y = y0 + (y1 - y0) * i / frames; await wait(1); }
  }

  // ---------------------------------------------------------------- text
  const bsay = (s, o = {}) => say(s, Object.assign({ style: 'battle' }, o));
  const noEffect = t => t.side === 'me' ? "It doesn't affect you..." : `It doesn't affect ${nm(t)}...`;
  const STAT_NAME = { atk: 'ATTACK', def: 'DEFENSE', spa: 'SP. ATK', spd: 'SP. DEF', spe: 'SPEED', acc: 'accuracy', eva: 'evasiveness' };

  // ---------------------------------------------------------------- effects
  async function hurt(t, dmg, o = {}) {
    dmg = Math.max(0, Math.min(dmg, t.hp));
    let endured = false;
    if (dmg > 0 && dmg >= t.hp && t.hp >= 2 && passive(t) === 'ill_be_back' && !t.endured) { dmg = t.hp - 1; t.endured = true; endured = true; }
    t.hp -= dmg;
    if (!o.noBlink) await blink(t);
    await drainBar(t);
    if (endured) await bsay(`${nm(t)} endured the hit!`);
    return dmg;
  }
  async function healBy(c, n) { c.hp = Math.min(c.maxhp, c.hp + n); await drainBar(c); }
  const canBurn = t => !t.types.includes('FIRE') && !t.status;
  async function burnIt(t) {
    t.status = 'brn';
    await flames(t, 24);
    await bsay(t.side === 'me' ? 'You were burned!' : `${nm(t)} was burned!`);
  }
  async function sleepIt(t, a, line) {
    t.status = 'slp'; t.sleep = rollTurns(a.min, a.max); t.sleepHeal = a.heal || 0;
    if (t.rampage > 0) { t.rampage = 0; t.confuse = rollTurns(2, 5); }
    zzz(t);
    await bsay(line || `${nm(t)} fell asleep!`);
  }
  async function confuseIt(t, line) {
    t.confuse = rollTurns(2, 5);
    await bsay(line || `${nm(t)} became confused!`);
  }
  async function stageChange(t, k, n) {
    const cur = t.stages[k], S = STAT_NAME[k];
    if (n > 0 && cur >= 6) return bsay(`${poss(t)} ${S} won't go higher!`);
    if (n < 0 && cur <= -6) return bsay(`${poss(t)} ${S} won't go lower!`);
    t.stages[k] = clamp6(cur + n);
    const w = n >= 2 ? 'sharply rose!' : n === 1 ? 'rose!' : n === -1 ? 'fell!' : 'harshly fell!';
    return bsay(`${poss(t)} ${S} ${w}`);
  }
  async function applyStats(t, statsObj) { for (const k in statsObj) await stageChange(t, k, statsObj[k]); }
  function hitRoll(u, t, mv) {
    if (mv.acc === null || mv.target === 'self') return true;
    const q = take(u.side === 'foe' ? 'foeHits' : 'hits');
    if (q) return !!q.v;
    return Math.random() * 100 < mv.acc * accMult(u.stages.acc - t.stages.eva);
  }

  // ---------------------------------------------------------------- moves
  async function attackAnim(u, t, id, mv, miss) {
    switch (id) {
      case 'throw': return stoneAnim(u, t, false, miss);
      case 'sling': return stoneAnim(u, t, true, miss);
      case 'bow': return boltAnim(u, t, miss);
      case 'glock': return muzzle(u, t, 1, miss ? 30 : 0);
      case 'sniper': return miss ? null : crosshair(t);
      case 'uzi': return null;
      case 'hole':
        if (miss) return null;
        await holeAnim(t);
        return bsay(t.side === 'me' ? 'You were dragged down the tunnel!' : `${nm(t)} was dragged down the tunnel!`);
      case 'hop': return miss ? null : hopAnim(u, t);
      case 'enrage': await flames(u, 20); return lunge(u, t);
    }
    if (mv.cat === 'physical') return lunge(u, t);
    return miss ? null : squares(u, t, TYPE_COL[mv.type] || '#f8f8f8');
  }
  async function strike(u, mv, id, t, spread) {
    const fxk = mv.effect, a = mv.args || {};
    const eff = effOf(mv.type, t.types);
    if (eff === 0) { await bsay(noEffect(t)); return 0; }
    if ((fxk === 'ohko' || fxk === 'multi_roll') && !ohkoAllowed(u.level, t.level)) {
      await bsay(`${nm(t)} is too high-level to be affected!`);
      return 0;
    }
    if (fxk === 'multi_roll') {
      const q = take(u.side === 'foe' ? 'foeHits' : 'hits');
      let hits = 0;
      if (q) hits = q.v ? 1 : 0;
      else for (let k = 0; k < a.rounds; k++) if (Math.random() * 100 < mv.acc * accMult(u.stages.acc - t.stages.eva)) hits++;
      await muzzle(u, t, a.rounds, 14);
      if (!hits) { await bsay(`All ${a.rounds} rounds missed!`); return 0; }
      await whiteFlash(t);
      const d = await hurt(t, t.hp);
      await bsay(`Hit ${hits} time(s)!`);
      if (t.hp <= 0) await bsay("It's a one-hit KO!");
      return d;
    }
    if (!hitRoll(u, t, mv)) {
      if (['throw', 'sling', 'bow', 'glock'].includes(id)) await attackAnim(u, t, id, mv, true);
      await bsay(`${poss(u)} attack missed!`);
      return 0;
    }
    if (fxk === 'fraction_hp' || fxk === 'fraction_bleed') {
      await attackAnim(u, t, id, mv, false);
      const d = await hurt(t, fraction(u.level, t.level, t.maxhp, a.frac));
      if (fxk === 'fraction_bleed' && t.hp > 0) {
        t.bleed = rollTurns(a.min, a.max);
        t.bleedAmt = Math.max(1, Math.floor(t.maxhp * a.bleed * levelFactor(u.level, t.level) + 1e-9));
        await bsay(`${nm(t)} is wounded by the bolt!`);
      }
      return d;
    }
    if (fxk === 'ohko') {
      await attackAnim(u, t, id, mv, false);
      await whiteFlash(t);
      const d = await hurt(t, t.hp);
      if (t.hp <= 0) await bsay("It's a one-hit KO!");
      return d;
    }
    if (fxk === 'fixed_level') {
      await attackAnim(u, t, id, mv, false);
      return hurt(t, u.level);
    }
    let hits = 1;
    if (fxk === 'multi_hit') { const r = Math.random(); hits = r < 3 / 8 ? 2 : r < 6 / 8 ? 3 : r < 7 / 8 ? 4 : 5; }
    let dealt = 0, n = 0;
    for (let k = 0; k < hits && t.hp > 0; k++) {
      await attackAnim(u, t, id, mv, false);
      const crit = critRoll(mv);
      const { dmg } = dmgCore(u, t, mv, { crit, roll: dmgRoll(), spread });
      dealt += await hurt(t, dmg);
      n++;
      if (crit) await bsay('A critical hit!');
    }
    if (eff > 1) await bsay("It's super effective!");
    else if (eff < 1) await bsay("It's not very effective...");
    if (fxk === 'multi_hit') await bsay(`Hit ${n} time(s)!`);
    await secondary(u, mv, t, dealt);
    return dealt;
  }
  async function secondary(u, mv, t, dealt) {
    const a = mv.args || {};
    switch (mv.effect) {
      case 'drain':
        if (dealt > 0 && u.hp > 0) {
          await healBy(u, Math.max(1, Math.floor(dealt * a.frac)));
          await bsay(t.side === 'me' ? 'Your energy was drained!' : `${nm(t)} had its energy drained!`);
        }
        break;
      case 'recoil':
        if (dealt > 0 && u.hp > 0) { await hurt(u, Math.max(1, Math.floor(dealt * a.frac)), { noBlink: true }); await bsay(`${isAre(u)} hit with recoil!`); }
        break;
      case 'flinch': if (t.hp > 0 && !t.acted && chance(a.chance)) t.flinch = true; break;
      case 'burn': if (t.hp > 0 && canBurn(t) && chance(a.chance)) await burnIt(t); break;
      case 'confuse': if (t.hp > 0 && !t.confuse && chance(a.chance)) await confuseIt(t); break;
      case 'sleep': if (t.hp > 0 && !t.status && chance(a.chance)) await sleepIt(t, a); break;
      case 'stat': { const w = a.who === 'self' ? u : t; if (w.hp > 0 && chance(a.chance)) await applyStats(w, a.stats); break; }
      case 'trap':
        if (t.hp > 0 && t.trappedBy !== u) { t.trappedBy = u; await bsay(t.side === 'me' ? "You can't escape now!" : `${nm(t)} can't escape now!`); }
        break;
      case 'rampage_confuse': if (t.hp > 0 && canBurn(t) && chance(a.burn)) await burnIt(t); break;
    }
  }
  async function statusMove(u, mv, id, t) {
    const a = mv.args || {};
    switch (mv.effect) {
      case 'summon_ally': return deployAI();
      case 'police_call': return callPolice(u, mv, t);
      case 'ideologize': return ideologize(u, mv);
    }
    if (!t) { await bsay('But it failed!'); return; }
    const tgt = a.who === 'self' ? u : t;
    let fail = false;
    if (mv.effect === 'sleep') fail = !!t.status;
    else if (mv.effect === 'infatuate') fail = t.love > 0;
    else if (mv.effect === 'confuse') fail = t.confuse > 0;
    else if (mv.effect === 'burn') fail = !canBurn(t);
    if (fail) { await bsay('But it failed!'); return; }
    if (mv.target !== 'self' && !hitRoll(u, t, mv)) { await bsay(`${poss(u)} attack missed!`); return; }
    switch (mv.effect) {
      case 'sleep':
        if (id === 'math') { await mathAnim(u, t); return sleepIt(t, a, `${nm(t)} fell asleep from boredom!`); }
        if (id === 'nap') return sleepIt(t, a, `${nm(t)} curled up and fell asleep!`);
        await sparks(t);
        return sleepIt(t, a);
      case 'infatuate':
        if (id === 'aegyo') { await aegyoAnim(u, t); await bsay('Bunny bunny~!'); } else await hearts(ctr(u), ctr(t), 3);
        t.love = rollTurns(a.min, a.max); t.loveBy = u;
        return bsay(`${nm(t)} fell in love with ${nm(u)}!`);
      case 'confuse': await sparks(t); return confuseIt(t);
      case 'burn': return burnIt(t);
      case 'stat':
        if (tgt === u) await wiggle(u); else await sparks(t);
        if (chance(a.chance)) await applyStats(tgt, a.stats);
        return;
      case 'heal_half':
        await wiggle(u);
        if (u.hp >= u.maxhp) return bsay(`${poss(u)} HP is full!`);
        await healBy(u, Math.max(1, Math.floor(u.maxhp / 2)));
        return bsay(`${u.side === 'me' ? 'You' : nm(u)} regained health!`);
    }
    if (u === t) await wiggle(u); else await sparks(t);
  }
  async function callPolice(u, mv, t) {
    const ok = hitRoll(u, t || u, mv);
    await phoneAnim(u);
    if (!ok) { await bsay('But nobody picked up!'); return; }
    u.policeFor = t || null; u.policePending = true;
    await bsay('You called the police!\nThey are on their way!');
  }
  function freeSlot() {
    if (B.foes.length < 2) return B.foes.length;
    const i = B.foes.findIndex(f => f.gone);
    return i;
  }
  async function ideologize(u, mv) {
    const me = B.me, a = mv.args;
    const canDup = !!a.duplicate && liveFoes().length === 1 && freeSlot() >= 0;
    if (me.protest > 0 && !canDup) { await bsay('But it failed!'); return; }
    if (!hitRoll(u, me, mv)) { await bsay(`${poss(u)} attack missed!`); return; }
    await leaves(u, me);
    if (me.protest === 0) {
      await bsay('You became ideologized!');
      picket(me, 60);
      await bsay('You joined a climate protest!');
      me.protest = rollTurns(a.min, a.max);
    }
    if (canDup) await duplicate(u);
  }
  async function duplicate(u) {
    const slot = freeSlot();
    const c = fighter('foe', u.species, u.level, u.moves.map(m => m.id), { clone: true, slot });
    c.hp = u.hp; c.shown = u.hp;
    B.foes[slot] = c;
    const wasDouble = B.double;
    B.double = true;
    const [hx, hy] = home(u), [cx, cy] = home(c);
    c.x = 250; c.y = cy; c.clipY = cy + 66;
    u.clipY = hy + 66;
    if (!wasDouble) B.foeBox = -240;
    const ux0 = u.x, uy0 = u.y;
    for (let i = 1; i <= 20; i++) {
      u.x = ux0 + (hx - ux0) * i / 20; u.y = uy0 + (hy - uy0) * i / 20;
      c.x = 250 + (cx - 250) * i / 20;
      await wait(1);
    }
    if (!wasDouble) for (let i = 0; i <= 12; i++) { B.foeBox = -240 + 240 * i / 12; await wait(1); }
    await bsay(`${nm(u)} split in two!`);
  }
  async function deployAI() {
    if (B.ally && !B.ally.gone) { await bsay('But it failed!'); return; }
    if (B.crashed) { await bsay('Your AI is still rebooting!'); return; }
    await bsay('You deployed your AI!');
    const A = ME.ai;
    const c = fighter('ally', A.species, A.level, A.moves.map(m => m.id), { ready: false });
    B.ally = c;
    B.allyBox = -240;
    const [mx, my] = home(B.me), [ax, ay] = home(c);
    c.x = ax; c.y = ay; c.clipY = 112; c.vis = false;
    await slide(B.me, mx, my, 12);
    for (let i = 0; i < 6; i++) { c.vis = true; c.white = true; await wait(3); c.vis = i > 3; await wait(3); }
    c.vis = true; c.white = false;
    await meBoxSize(true);
    for (let i = 0; i <= 12; i++) { B.allyBox = -240 + 240 * i / 12; await wait(1); }
    await bsay(A.species === 'ai' ? `AI (Lv ${A.level}) joined the battle!` : `${NAME(c)} (Lv ${A.level}) is online!`);
  }

  // ---------------------------------------------------------------- one move use
  function resolveTargets(u, p) {
    const mv = MV[p.move];
    if (mv.target === 'self') return [u];
    if (mv.target === 'player') return live(B.me) ? [B.me] : [];
    const o = opp(u);
    if (mv.target === 'foes') return o;
    let t = p.target;
    if (!live(t) || t.side === u.side || (t.side !== 'foe') === (u.side !== 'foe')) t = u.side === 'foe' ? pickRand(o) : o[0];
    return t ? [t] : [];
  }
  async function perform(u, p) {
    const id = p.move, mv = MV[id];
    if (p.slotObj && !p.ramp) p.slotObj.pp = Math.max(0, p.slotObj.pp - 1);
    if (id === 'struggle' && u.side === 'me') await bsay('You have no moves left!');
    await bsay(`${nm(u)} used ${mv.name}!`);
    if (mv.effect === 'rampage_confuse' && !p.ramp) { u.rampage = rollTurns(mv.args.min, mv.args.max); u.rampMove = id; }
    const targets = resolveTargets(u, p);
    if (mv.cat === 'status') await statusMove(u, mv, id, targets[0]);
    else if (!targets.length) await bsay('But it failed!');
    else {
      const spread = mv.target === 'foes' && targets.length > 1;
      for (const t of targets) if (live(t) && u.hp > 0) await strike(u, mv, id, t, spread);
    }
    if (u.side !== 'foe' && mv.cat !== 'status' && !B.wanted && targets.some(t => passive(t) === 'witness')) {
      B.wanted = B.turn;
      await bsay(`Uh-oh. You attacked an ${NAME(targets.find(t => passive(t) === 'witness'))}.`);
      await bsay('Someone called the police!');
    }
    if (mv.effect === 'rampage_confuse' && u.rampage > 0 && u.hp > 0) {
      u.rampage--;
      if (u.rampage === 0) { u.confuse = rollTurns(2, 5); await bsay(`${nm(u)} became confused due to fatigue!`); }
    }
  }

  // ---------------------------------------------------------------- action slots
  async function doSlot(p) {
    const c = p.c;
    c.acted = true;
    if (c.side === 'me' && p.act === 'police') return policeArrive();
    if (c.status === 'slp') {
      if (c.sleep > 0) {
        c.sleep--;
        zzz(c);
        await bsay(`${isAre(c)} fast asleep.`);
        if (c.sleepHeal > 0 && c.hp < c.maxhp) {
          await healBy(c, Math.max(1, Math.floor(c.maxhp * c.sleepHeal)));
          await bsay(`${nm(c)} restored a little HP in its sleep.`);
        }
        return null;
      }
      c.status = null; c.sleepHeal = 0;
      await bsay(`${nm(c)} woke up!`);
    }
    if (c.side === 'me' && c.protest > 0) {
      picket(c, 70);
      for (let i = 0; i < 2; i++) { c.dx = 2; await wait(5); c.dx = -2; await wait(5); }
      c.dx = 0;
      await bsay('You are marching in the climate protest!');
      c.protest--;
      if (c.protest === 0) await bsay('You left the protest. Your voice is hoarse.');
      return null;
    }
    if (p.act === 'march') return null;
    if (c.flinch) { await bsay(`${nm(c)} flinched!`); return null; }
    if (c.confuse > 0) {
      c.confuse--;
      if (c.confuse === 0) await bsay(`${nm(c)} snapped out of confusion!`);
      else {
        await bsay(`${isAre(c)} confused!`);
        if (Math.random() < 0.5) {
          await bsay(c.side === 'me' ? 'You hurt yourself in your confusion!' : 'It hurt itself in its confusion!');
          const { dmg } = dmgCore(c, c, { type: 'TYPELESS', cat: 'physical', power: 40 }, { crit: false, roll: dmgRoll() });
          await hurt(c, dmg);
          return null;
        }
      }
    }
    if (c.love > 0) {
      await bsay(`${isAre(c)} in love with ${c.loveBy ? nm(c.loveBy) : 'someone'}!`);
      await hearts({ x: c.x + 44, y: c.y + 12 }, { x: c.x + 48, y: c.y - 8 }, 2);
      if (Math.random() < 0.5) { await bsay(`${isAre(c)} immobilized by love!`); return null; }
    }
    await perform(c, p);
    return null;
  }
  async function policeArrive() {
    const me = B.me;
    let t = me.policeFor;
    me.policeFor = null; me.policePending = false;
    await bsay('The police arrived!');
    if (B.wanted) return arrestSeq(true);
    if (!live(t)) t = liveFoes()[0] || null;
    if (!t) { await bsay('The police found nothing to do.'); return null; }
    await policeAnim(t);
    t.gone = true; t.removed = true;
    await bsay(`The police took ${nm(t)} away!`);
    return null;
  }
  async function arrestSeq(arrived) {
    if (!arrived) await bsay('The police arrived!');
    const me = B.me;
    me.vis = true; me.drop = 0;
    const car = await arrestAnim(me);
    await bsay('The police arrested YOU!');
    await car.drive();
    await bsay('You were taken away...');
    close();
    await fadeTo(1, 30, '248,248,248');
    return 'arrested';
  }

  // ---------------------------------------------------------------- planning
  function targetFor(u, mv) {
    if (mv.target === 'self') return u;
    if (mv.target === 'player') return B.me;
    if (mv.target === 'foes') return null;
    return pickRand(opp(u)) || null;
  }
  function planFoe(f) {
    const q = take('foeMoves');
    if (f.rampage > 0) {
      const id = f.rampMove;
      return { c: f, move: id, target: targetFor(f, MV[id]), ramp: true, prio: MV[id].prio };
    }
    const usable = f.moves.filter(m => m.pp > 0);
    let slotObj = null, id;
    if (!usable.length) id = 'struggle';
    else {
      slotObj = (q && usable.find(m => m.id === q.v)) || pickRand(usable);
      id = slotObj.id;
    }
    return { c: f, move: id, slotObj, target: targetFor(f, MV[id]), prio: MV[id].prio };
  }
  function aiValue(a, id, t) {
    const mv = MV[id];
    if (mv.cat !== 'status') {
      const one = tt => {
        if (!live(tt)) return 0;
        let d;
        if (mv.effect === 'fixed_level') d = effOf(mv.type, tt.types) ? a.level : 0;
        else if (mv.effect === 'fraction_hp' || mv.effect === 'fraction_bleed') d = effOf(mv.type, tt.types) ? fraction(a.level, tt.level, tt.maxhp, mv.args.frac) : 0;
        else if (mv.effect === 'ohko' || mv.effect === 'multi_roll') d = ohkoAllowed(a.level, tt.level) && effOf(mv.type, tt.types) ? tt.hp : 0;
        else d = dmgCore(a, tt, mv, { crit: false, roll: 92.5, spread: mv.target === 'foes' && liveFoes().length > 1 }).dmg;
        d = Math.min(d, tt.hp);
        const acc = mv.acc === null ? 1 : mv.acc / 100;
        return d * acc + (d >= tt.hp && d > 0 ? 1000 : 0);
      };
      return mv.target === 'foes' ? liveFoes().reduce((s, tt) => s + one(tt), 0) : one(t);
    }
    if (mv.effect === 'heal_half') return a.hp < a.maxhp / 2 ? a.maxhp / 2 : 0;
    if (mv.effect === 'confuse') return t && !t.confuse ? 0.15 * t.maxhp : 0;
    if (mv.effect === 'stat' && mv.args.who === 'self') {
      const ks = Object.keys(mv.args.stats).filter(k => mv.args.stats[k] > 0);
      return ks.every(k => a.stages[k] < 2) ? 0.1 * a.maxhp : 0;
    }
    return 0;
  }
  function planAlly(a) {
    const usable = a.moves.filter(m => m.pp > 0);
    if (!usable.length) return { c: a, move: 'struggle', target: pickRand(liveFoes()), prio: 0 };
    const pSmart = Math.min(1, a.level / 40);
    if (pSmart >= 1 || Math.random() < pSmart) {
      let best = null, bv = -1;
      for (const m of usable) {
        const mv = MV[m.id];
        const ts = mv.target === 'foe' ? liveFoes() : [targetFor(a, mv)];
        for (const t of ts) { const v = aiValue(a, m.id, t); if (v > bv) { bv = v; best = { m, t }; } }
      }
      return { c: a, move: best.m.id, slotObj: best.m, target: best.t, prio: MV[best.m.id].prio };
    }
    const m = pickRand(usable), mv = MV[m.id];
    return { c: a, move: m.id, slotObj: m, target: mv.target === 'foe' ? pickRand(liveFoes()) : targetFor(a, mv), prio: mv.prio };
  }
  function planMe(act) {
    const me = B.me;
    if (act.t === 'police' || act.t === 'march') return { c: me, act: act.t, prio: 0 };
    if (act.t === 'struggle') return { c: me, move: 'struggle', target: pickRand(liveFoes()), prio: 0 };
    const slotObj = ME.moves[act.i], mv = MV[slotObj.id];
    return { c: me, move: slotObj.id, slotObj, target: act.target || targetFor(me, mv), prio: mv.prio };
  }
  function sortPlans(plans) {
    const keyed = plans.map(p => ({ p, prio: p.prio, spe: effSpe(p.c) }));
    keyed.sort((a, b) => b.prio - a.prio || b.spe - a.spe);
    for (let i = 0; i < keyed.length;) {
      let j = i + 1;
      while (j < keyed.length && keyed[j].prio === keyed[i].prio && keyed[j].spe === keyed[i].spe) j++;
      for (let k = j - 1; k > i; k--) { const r = i + rnd(k - i + 1); [keyed[k], keyed[r]] = [keyed[r], keyed[k]]; }
      i = j;
    }
    return keyed.map(k => k.p);
  }

  // ---------------------------------------------------------------- menus
  async function chooseMove() {
    for (;;) {
      const names = [0, 1, 2, 3].map(k => ME.moves[k] ? MV[ME.moves[k].id].name : '-');
      close();
      const i = await choose(names, {
        cols: 2, x: 0, y: 112, w: 160, h: 48, iw: 74, cancel: -1, start: Math.min(B.lastMove || 0, ME.moves.length - 1),
        onMove: k => { B.moveInfo = k; },
      });
      B.moveInfo = null;
      if (i < 0) return -1;
      if (!ME.moves[i]) continue;
      B.lastMove = i;
      if (ME.moves[i].pp <= 0) { await bsay("There's no PP left for this move!"); continue; }
      return i;
    }
  }
  async function chooseTarget() {
    const lf = liveFoes();
    if (lf.length < 2) return lf[0] || null;
    const same = NAME(lf[0]) === NAME(lf[1]);
    const labels = lf.map(f => same ? (f.slot === 0 ? 'LEFT ' : 'RIGHT ') + NAME(f) : NAME(f));
    close();
    const k = await choose(labels, { cancel: -1, x: 0, y: 112, w: 160, h: 48, cols: 1 });
    return k < 0 ? undefined : lf[k];
  }
  async function chooseAction() {
    for (;;) {
      await bsay('What will\nyou do?', { wait: false, speed: 4, narrow: 104 });
      const i = await choose(['FIGHT', 'BAG', 'TEAM', 'RUN'], { cols: 2, x: 120, y: 112, w: 120, h: 48, iw: 54, start: B.lastAction || 0 });
      B.lastAction = i;
      if (i === 0) {
        if (ME.moves.every(m => m.pp <= 0)) return { t: 'struggle' };
        for (;;) {
          const m = await chooseMove();
          if (m < 0) break;
          const mv = MV[ME.moves[m].id];
          if (mv.target === 'foe' && liveFoes().length === 2) {
            const t = await chooseTarget();
            if (t === undefined) continue;
            return { t: 'move', i: m, target: t };
          }
          return { t: 'move', i: m };
        }
      } else if (i === 1) await bsay('Your BAG is empty.');
      else if (i === 2) {
        const A = ME.ai;
        if (B.ally && !B.ally.gone) await bsay(`${NAME(B.ally)} Lv${B.ally.level}  HP ${Math.max(0, B.ally.hp)}/${B.ally.maxhp}`);
        else if (B.crashed) await bsay('Your AI is still rebooting!');
        else if (A.unlocked) await bsay('Your AI is on standby.\nUse the move AI to deploy it.');
        else await bsay("There is no one else on your team.\nIt's just you.");
      } else {
        if (!B.canRun) { await bsay("No! There's no running from a trainer battle!"); continue; }
        return { t: 'run' };
      }
    }
  }
  async function tryRun() {
    const me = B.me;
    if (me.protest > 0 || trapped(me)) { await bsay("You can't escape!"); return false; }
    B.runs++;
    const fs = liveFoes();
    const F = Math.max(...fs.map(f => f.st.spe)), ds = fs.some(f => passive(f) === 'death_stare');
    const q = take('runs');
    let ok;
    if (q) ok = !!q.v;
    else { const o = escapeNum(me.st.spe, F, B.runs, ds); ok = o >= 256 || rnd(256) < o; }
    if (ok) {
      if (B.wanted) return true;
      await bsay('Got away safely!');
      return true;
    }
    await bsay(ds ? "You can't escape her DEATH STARE!" : "Can't escape!");
    return false;
  }

  // ---------------------------------------------------------------- turn
  async function processFaints() {
    for (const f of B.foes) if (!f.gone && f.hp <= 0) await foeDown(f);
    if (B.ally && !B.ally.gone && B.ally.hp <= 0) await allyDown();
    if (B.me.hp <= 0) return 'lose';
    return checkEnd();
  }
  function checkEnd() {
    if (!B.foes.every(f => f.gone)) return null;
    if (B.foes.some(f => f.fainted)) return 'win';
    if (B.foes.some(f => f.fled)) return 'flee';
    return 'police';
  }
  async function foeDown(f) {
    f.gone = true; f.fainted = true;
    await faintDrop(f);
    await bsay(`${nm(f)} fainted!`);
    if (f.clone) return;
    const n = expGain(SP[f.species].exp_yield, f.level, B.kind === 'trainer');
    if (ME.hp > 0) await gainExp(n);
    if (B.ally && !B.ally.gone && B.ally.hp > 0) await aiGain(n);
  }
  async function allyDown() {
    const a = B.ally;
    a.gone = true; a.fainted = true;
    await faintDrop(a);
    await bsay(`${NAME(a)} crashed!`);
    for (let i = 0; i <= 12; i++) { B.allyBox = -240 * i / 12; await wait(1); }
    B.ally = null; B.crashed = true;
    const [mx, my] = home(B.me);
    await slide(B.me, mx, my, 12);
    await meBoxSize(false);
  }
  async function meBoxSize(small) {
    if (B.meSmall === small) return;
    for (let i = 1; i <= 8; i++) { B.meBox = 240 * i / 8; await wait(1); }
    B.meSmall = small;
    for (let i = 7; i >= 0; i--) { B.meBox = 240 * i / 8; await wait(1); }
  }
  async function turn() {
    const me = B.me;
    for (const c of everyone()) c.acted = false;
    let act;
    if (me.policePending) act = { t: 'police' };
    else if (me.protest > 0) act = { t: 'march' };
    else act = await chooseAction();
    close();
    const plans = [];
    for (const f of B.foes) if (live(f)) plans.push(planFoe(f));
    if (B.ally && live(B.ally) && B.ally.ready) plans.push(planAlly(B.ally));
    if (act.t === 'run') { if (await tryRun()) return 'run'; }
    else plans.push(planMe(act));
    for (const p of sortPlans(plans)) {
      if (!live(p.c)) continue;
      const r = await doSlot(p);
      if (r) return r;
      const e = await processFaints();
      if (e) return e;
    }
    return endTurn();
  }
  async function endTurn() {
    for (const c of everyone()) c.flinch = false;
    const order = [B.me, B.ally, ...B.foes].filter(live).sort((a, b) => effSpe(b) - effSpe(a));
    for (const c of order) {
      if (!live(c)) continue;
      if (c.bleed > 0) {
        c.bleed--;
        await bsay(`${nm(c)} is hurt by its wound!`);
        await hurt(c, c.bleedAmt || 1);
        const r = await processFaints(); if (r) return r;
      }
      if (live(c) && c.status === 'brn') {
        await flames(c, 20);
        await bsay(c.side === 'me' ? 'You are hurt by your burn!' : `${nm(c)} is hurt by its burn!`);
        await hurt(c, Math.max(1, Math.floor(c.maxhp / 8)));
        const r = await processFaints(); if (r) return r;
      }
    }
    for (const c of everyone()) if (live(c) && c.love > 0) { c.love--; if (c.love === 0) await bsay(`${nm(c)} got over the infatuation.`); }
    if (B.wanted && B.turn > B.wanted) return arrestSeq(false);
    if (B.kind === 'wild' && B.turn === 3) {
      for (const f of liveFoes()) if (passive(f) === 'midnight') {
        await bsay('The clock struck twelve!');
        const c = ctr(f);
        fx(48, t => { for (let k = 0; k < 5; k++) { const a = k * 1.256 + t / 8, r = 20 + (t % 16); if ((t + k * 3) & 4) draw('spark', c.x + Math.cos(a) * r - 3, c.y + Math.sin(a) * r - 3); } });
        for (let i = 0; i <= 24; i++) { f.alpha = 1 - i / 24; await wait(2); }
        f.vis = false; f.gone = true; f.fled = true;
        await bsay(`${nm(f)} ran off!`);
      }
    }
    B.turn++;
    if (B.ally) B.ally.ready = true;
    return checkEnd();
  }

  // ---------------------------------------------------------------- level up, moves, exp
  async function statBox(old, nu) {
    let phase = 0;
    const rows = [['MAX. HP', 'hp'], ['ATTACK', 'atk'], ['DEFENSE', 'def'], ['SP. ATK', 'spa'], ['SP. DEF', 'spd'], ['SPEED', 'spe']];
    const layer = () => {
      box(140, 2, 96, 108, 'menu');
      rows.forEach(([lab, k], i) => {
        text(lab, 150, 11 + i * 16);
        const v = phase === 0 ? '+' + (nu[k] - old[k]) : String(nu[k]);
        text(v, 228 - measure(v), 11 + i * 16);
      });
      TG.region(0, 0, 240, 160, () => { pressed.a = true; });
    };
    TG.layers.add(layer);
    await until(() => pressed.a || pressed.b);
    phase = 1;
    await wait(1);
    await until(() => pressed.a || pressed.b);
    TG.layers.delete(layer);
  }
  async function learnMove(id, style) {
    const s = (t, o = {}) => say(t, Object.assign({ style }, o));
    const name = MV[id].name;
    const learned = () => { if (id === 'ai') ME.ai.unlocked = true; };
    if (ME.moves.length < 4) { ME.moves.push({ id, pp: MV[id].pp }); learned(); await s(`You learned ${name}!`); return; }
    for (;;) {
      await s(`You are trying to learn ${name}.`);
      await s("But you can't learn more than four moves.");
      await s(`Delete a move to make room for ${name}?`, { wait: false });
      if (await yesno()) {
        await s('Which move should be forgotten?', { wait: false });
        const list = ME.moves.map(m => MV[m.id].name);
        const i = await choose(list, { cancel: -1, x: 238 - (Math.max(...list.map(measure)) + 30), y: 113 - (list.length * 16 + 12) });
        if (i >= 0) {
          const old = MV[ME.moves[i].id].name;
          await s('1, 2, and... ... ... Poof!');
          await s(`You forgot ${old}.`);
          await s('And...');
          ME.moves[i] = { id, pp: MV[id].pp };
          learned();
          await s(`You learned ${name}!`);
          return;
        }
      }
      await s(`Stop learning ${name}?`, { wait: false });
      if (await yesno()) { await s(`You did not learn ${name}.`); return; }
    }
  }
  async function levelUp(style) {
    const old = stats(ME.species, ME.level);
    ME.level++;
    const nu = stats(ME.species, ME.level);
    ME.hp = Math.min(nu.hp, ME.hp + nu.hp - old.hp);
    if (B.active && B.me) { refreshMe(); B.me.shown = ME.hp; B.expShown = expFor(GROW, ME.level); B.expTarget = B.expShown; }
    await say(`You grew to Lv. ${ME.level}!`, { style });
    await statBox(old, nu);
    for (const [lv, m] of SP[ME.species].learnset) if (lv === ME.level && !knows(m)) await learnMove(m, style);
    if (ME.species === SP.student.evolves.into && ME.level > EVO_LV && !knows('ai')) await learnMove('ai', style);
  }
  async function gainExp(n) {
    const cap = expFor(GROW, 100);
    await bsay(`You gained ${n} EXP. Points!`);
    ME.exp = Math.min(cap, ME.exp + n);
    while (ME.level < 100 && ME.exp >= expFor(GROW, ME.level + 1)) {
      B.expTarget = expFor(GROW, ME.level + 1);
      await until(() => B.expShown >= B.expTarget);
      await levelUp('battle');
    }
    B.expTarget = ME.exp;
    await until(() => B.expShown >= B.expTarget);
  }
  async function aiLearn(id, style = 'battle') {
    const A = ME.ai, name = SP[A.species].name, mn = MV[id].name;
    if (A.moves.some(m => m.id === id)) return;
    if (A.moves.length < 4) { A.moves.push({ id }); await say(`${name} learned ${mn}!`, { style }); }
    else {
      let k = 0;
      A.moves.forEach((m, i) => { if (MV[m.id].power < MV[A.moves[k].id].power) k = i; });
      const old = MV[A.moves[k].id].name;
      A.moves[k] = { id };
      await say(`${name} deleted ${old} and learned ${mn}!`, { style });
    }
    if (B.active && B.ally && !B.ally.gone) {
      const prev = B.ally.moves;
      B.ally.moves = A.moves.map(m => prev.find(p => p.id === m.id) || { id: m.id, pp: MV[m.id].pp });
    }
  }
  async function aiGain(n) {
    const A = ME.ai, cap = expFor('agent', 100);
    await bsay(`${SP[A.species].name} gained ${n} EXP. Points!`);
    A.exp = Math.min(cap, A.exp + n);
    while (A.level < 100 && A.exp >= expFor('agent', A.level + 1)) {
      A.level++;
      const a = B.ally;
      if (a && !a.gone) {
        const st = stats(a.species, A.level);
        a.hp = Math.min(st.hp, a.hp + st.hp - a.maxhp); a.level = A.level; a.st = st; a.maxhp = st.hp; a.shown = a.hp;
      }
      await bsay(`${SP[A.species].name} grew to Lv. ${A.level}!`);
      for (const [lv, m] of SP[A.species].learnset) if (lv === A.level) await aiLearn(m);
    }
  }
  async function rareCandy(style = 'world') {
    if (ME.level >= 100) { await say("It won't have any effect.", { style }); return; }
    ME.exp = expFor(GROW, ME.level + 1);
    await levelUp(style);
    if (style === 'world') await evolve('world');
  }

  // ---------------------------------------------------------------- evolution
  async function evoScene(style, from, to, lines, onChange) {
    const E = { spr: from, white: false };
    B.fx = [];
    TG.hooks.update = update;
    TG.hooks.render = () => {
      g.fillStyle = '#000000'; g.fillRect(0, 0, 240, 160);
      if (E.spr) { if (E.white) drawSolid(E.spr, 88, 28, [248, 248, 248]); else draw(E.spr, 88, 28); }
      for (const e of B.fx) e.draw(e.t);
    };
    await fadeTo(0, 16);
    await say(lines[0], { style });
    close();
    await wait(20);
    E.white = true;
    let t = 0, k = 0, iv = 24;
    while (t < 150) {
      E.spr = k % 2 ? to : from;
      const n = Math.max(2, Math.round(iv));
      await wait(n);
      t += n; iv *= 0.82; k++;
    }
    E.spr = to;
    await fadeTo(1, 10, '248,248,248');
    E.white = false;
    if (onChange) onChange();
    await wait(10);
    await fadeTo(0, 20);
    await say(lines[1], { style });
  }
  async function evolve(style = 'world') {
    const needMe = ME.species === 'student' && ME.level >= EVO_LV;
    const needAi = ME.ai.species === 'ai' && ME.ai.level >= SP.ai.evolves.level;
    if (!needMe && !needAi) return;
    const saved = { u: TG.hooks.update, r: TG.hooks.render };
    close();
    await fadeTo(1, 16, '0,0,0');
    if (needMe) {
      const into = SP.student.evolves.into;
      await evoScene(style, SP.student.sprites.back, SP[into].sprites.back,
        ['What? You are evolving!', 'Congratulations! You evolved into a PhD CANDIDATE!'],
        () => {
          const old = stats(ME.species, ME.level).hp;
          ME.species = into;
          ME.hp = Math.min(stats(into, ME.level).hp, ME.hp + stats(into, ME.level).hp - old);
          if (B.active) refreshMe();
        });
      for (const [lv, m] of SP[into].learnset) if (lv === EVO_LV && !knows(m)) await learnMove(m, style);
      close();
    }
    if (needAi) {
      if (needMe) await fadeTo(1, 16, '0,0,0');
      const into = SP.ai.evolves.into;
      await evoScene(style, SP.ai.sprites.back, SP[into].sprites.back,
        ['What? Your AI is evolving!', `Your AI evolved into ${SP[into].name}!`],
        () => { ME.ai.species = into; });
      const aiSet = new Set(SP.ai.learnset.map(e => e[1]));
      for (const [lv, m] of SP[into].learnset) if (lv <= ME.ai.level && !aiSet.has(m)) await aiLearn(m, style);
      close();
    }
    await fadeTo(1, 16, '0,0,0');
    B.fx = [];
    TG.hooks.update = saved.u; TG.hooks.render = saved.r;
    if (style === 'world') await fadeTo(0, 16);
  }

  // ---------------------------------------------------------------- flow
  const RABBIT = { kind: 'wild', foes: [{ species: 'rabbit', level: 30 }], canRun: true, intro: 'The RABBIT challenges you!', bg: 'grass' };
  function introText(o) {
    if (o.intro) return o.intro;
    const n = o.foes.map(f => SP[f.species].name);
    if (o.kind === 'trainer') return n.length > 1 ? `${n[0]} and ${n[1]} want to battle!` : `${n[0]} wants to battle!`;
    return n.length > 1 ? `A wild ${n[0]} and ${n[1]} appeared!` : `A wild ${n[0]} appeared!`;
  }
  async function intro(line) {
    for (let i = 0; i < 2; i++) { await fadeTo(0.85, 4, '248,248,248'); await fadeTo(0, 4); }
    const layer = () => drawBars(B.bars);
    B.bars = 0;
    TG.layers.add(layer);
    for (let i = 1; i <= 20; i++) { B.bars = i / 20; await wait(1); }
    TG.layers.delete(layer);
    TG.hooks.update = update; TG.hooks.render = render;
    B.foeBox = -240; B.meBox = 240;
    const fs = B.foes.map(f => f.x), mx = B.me.x;
    B.foes.forEach(f => { f.x -= 208; });
    B.me.x += 204;
    for (let i = 19; i >= 0; i--) { B.bars = i / 20; await wait(1); }
    B.bars = 0;
    for (let i = 0; i <= 40; i++) {
      B.foes.forEach((f, k) => { f.x = fs[k] - 208 + 208 * i / 40; });
      B.me.x = mx + 204 - 204 * i / 40;
      await wait(1);
    }
    await bsay(line);
    for (let i = 0; i <= 12; i++) { B.foeBox = -240 + 240 * i / 12; await wait(1); }
    for (let i = 0; i <= 12; i++) { B.meBox = 240 - 240 * i / 12; await wait(1); }
  }
  async function start(opts) {
    if (B.active) throw new Error('battle already running');
    const o = Object.assign({}, opts || RABBIT);
    o.kind = o.kind || 'wild';
    if (o.canRun === undefined) o.canRun = o.kind === 'wild';
    const prev = { u: TG.hooks.update, r: TG.hooks.render };
    Object.assign(B, {
      active: true, fx: [], kind: o.kind, canRun: o.canRun, bg: o.bg || 'grass', turn: 1, runs: 0, wanted: 0,
      crashed: false, ally: null, hole: 0, holeC: null, tint: null, bars: 0, lastAction: 0, lastMove: 0, moveInfo: null,
      foeBox: -240, meBox: 240, allyBox: -240, meSmall: false,
    });
    B.foes = o.foes.slice(0, 2).map((f, i) => fighter('foe', f.species, f.level, f.moves || defaultMoves(f.species, f.level), { slot: i }));
    B.double = B.foes.length === 2;
    B.me = mkMe();
    ME.hp = Math.min(ME.hp, B.me.maxhp); B.me.shown = ME.hp;
    for (const c of everyone()) placeHome(c);
    B.expShown = ME.exp; B.expTarget = ME.exp;
    TG.TB.defaultStyle = 'battle';
    let result = null;
    try {
      await intro(introText(o));
      for (const f of B.foes) {
        if (passive(f) === 'death_stare') await bsay(`${nm(f)} gives you a DEATH STARE!`);
        if (passive(f) === 'intimidate') {
          for (const c of [B.me, B.ally]) if (live(c)) c.stages.atk = clamp6(c.stages.atk - 1);
          await bsay(`${nm(f)}'s INTIMIDATE cuts your ATTACK!`);
        }
      }
      while (!result) result = await turn();
      if (B.wanted && ['win', 'police', 'run', 'flee'].includes(result)) result = await arrestSeq(false);
      if (result === 'police') await bsay('The battle is over. No EXP. Points were gained.');
      if (result === 'lose') {
        await faintDrop(B.me);
        await bsay('You fainted!');
        await bsay('You whited out!');
      }
      if (result !== 'lose' && result !== 'arrested') await evolve('battle');
    } finally {
      close();
      TG.TB.defaultStyle = 'world';
      B.active = false;
      B.moveInfo = null;
    }
    if (result === 'lose' || result === 'arrested') {
      await fadeTo(1, result === 'lose' ? 30 : 1, '248,248,248');
      TG.hooks.update = prev.u; TG.hooks.render = prev.r;
      return result;
    }
    await fadeTo(1, 16, '0,0,0');
    heal();
    TG.hooks.update = prev.u; TG.hooks.render = prev.r;
    await wait(8);
    await fadeTo(0, 16);
    return result;
  }

  Object.assign(API, { start, heal, rareCandy, evolve, setLevel, setAiLevel, calc, ME, B, MOVES: MV });
  Object.defineProperty(API, 'active', { get: () => B.active, enumerable: true });
  return API;
})();
