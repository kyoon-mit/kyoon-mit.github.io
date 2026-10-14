/* Thesis gate: battle system (Gen 3 rules: stats, damage, priority, sleep, flinch, run, exp, moves). */
'use strict';
window.BATTLE = (() => {
  const { g, draw, drawSolid, text, measure, say, close, choose, yesno, wait, until, fadeTo, pressed, box, C } = TG;

  const MOVES = {
    math:   { name: 'MATH',        pp: 20, acc: 100, prio: -1, kind: 'sleep' },
    police: { name: 'CALL POLICE', pp: 5,  acc: 60,  prio: 0,  kind: 'police' },
    throw:  { name: 'STONE THROW', pp: 25, acc: 50,  prio: 0,  kind: 'frac', frac: 0.25 },
    sling:  { name: 'STONE SLING', pp: 15, acc: 70,  prio: 0,  kind: 'frac', frac: 0.5 },
    bow:    { name: 'CROSSBOW',    pp: 10, acc: 90,  prio: 0,  kind: 'bow', frac: 0.9 },
    glock:  { name: 'GLOCK',       pp: 10, acc: 80,  prio: 0,  kind: 'ohko' },
    uzi:    { name: 'UZI',         pp: 5,  acc: 5,   prio: 0,  kind: 'uzi', rounds: 18 },
    sniper: { name: 'SNIPER',      pp: 5,  acc: 100, prio: -1, kind: 'ohko' },
  };
  const FOE_MOVES = {
    hole:  { name: 'RABBIT HOLE', power: 120, acc: 95, prio: 0 },
    aegyo: { name: 'AEGYO', acc: 100, prio: 0 },
    sleep: { name: 'SLEEP', acc: 100, prio: 0 },
    hop:   { name: 'BUNNY HOP', power: 20, acc: 100, prio: 2, flinch: 0.8 },
  };
  const FOE_LIST = ['hole', 'aegyo', 'sleep', 'hop'];
  const LEARN = { 8: 'sling', 13: 'bow', 20: 'glock', 30: 'uzi', 40: 'sniper' };
  const BASE_ME = { hp: 50, atk: 50, def: 45, spe: 40 };
  const BASE_FOE = { hp: 60, atk: 80, def: 50, spe: 110 };
  const FOE_LEVEL = 30, FOE_YIELD = 150, FOE_Y = 3;
  const stat = (b, L, hp) => { const v = Math.floor((2 * b + 15) * L / 100); return hp ? v + L + 10 : v + 5; };
  const stats = (base, L) => ({ hp: stat(base.hp, L, true), atk: stat(base.atk, L), def: stat(base.def, L), spe: stat(base.spe, L) });
  const expFor = L => L * L * L;
  const rnd = n => Math.floor(Math.random() * n);

  // the player; levels reset on reload
  const ME = { level: 5, exp: expFor(5), hp: stats(BASE_ME, 5).hp, moves: ['math', 'police', 'throw'].map(id => ({ id, pp: MOVES[id].pp })) };
  function heal() { ME.hp = stats(BASE_ME, ME.level).hp; ME.moves.forEach(m => { m.pp = MOVES[m.id].pp; }); }

  // ---------------------------------------------------------------- battle state + drawing
  const B = { active: false, fx: [], foeFace: 'normal' };
  let bgCanvas = null;
  function buildBG() {
    const c = document.createElement('canvas');
    c.width = 240; c.height = 112;
    const x = c.getContext('2d'), im = x.createImageData(240, 112), d = im.data;
    const put = (i, j, hex) => { const o = (j * 240 + i) * 4; d[o] = parseInt(hex.substr(1, 2), 16); d[o + 1] = parseInt(hex.substr(3, 2), 16); d[o + 2] = parseInt(hex.substr(5, 2), 16); d[o + 3] = 255; };
    const inE = (i, j, cx, cy, rx, ry) => ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1;
    for (let j = 0; j < 112; j++)
      for (let i = 0; i < 240; i++) {
        let col;
        if (j < 12) col = j < 6 ? '#d0ecf8' : '#c0e4f4';
        else col = (Math.floor(j / 3) % 2) ? '#a8d880' : '#9ccf74';
        const bump = 18 + Math.round(3 * Math.sin(i / 7) + 2 * Math.sin(i / 3.1));
        if (j >= 8 && j < bump) col = (j < bump - 2) ? '#4c9a48' : '#3c7c3c';
        if (j >= 8 && j < bump && (i * 7 + j * 3) % 13 === 0) col = '#66b058';
        if (inE(i, j, 176, 66, 52, 11)) col = inE(i, j, 176, 65, 48, 9) ? (j < 65 ? '#d4eeb0' : '#b8e090') : '#78b058';
        if (inE(i, j, 70, 112, 70, 15)) col = inE(i, j, 70, 113, 66, 13) ? '#c8e8a4' : '#78b058';
        if (j > 30 && (i * 13 + j * 7) % 97 === 0 && !inE(i, j, 176, 66, 52, 11) && !inE(i, j, 70, 112, 70, 15)) col = '#80c060';
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
  function foeSprite() { return B.foeFace === 'aegyo' ? 'rab_b_aegyo' : B.foeFace === 'sleep' ? 'rab_b_sleep' : 'rab_b'; }
  function render() {
    if (!bgCanvas) bgCanvas = buildBG();
    g.drawImage(bgCanvas, 0, 0);
    g.fillStyle = '#283038'; g.fillRect(0, 112, 240, 48);
    // foe
    if (B.foeVis) {
      g.save(); g.beginPath(); g.rect(0, 0, 240, FOE_Y + 66); g.clip();
      const fx = Math.round(B.foeX), fy = Math.round(B.foeY + B.foeDrop);
      if (B.foeWhite) TG.drawSolid(foeSprite(), fx, fy, [248, 248, 248]); else draw(foeSprite(), fx, fy);
      g.restore();
    }
    // hole under the player
    if (B.hole > 0) {
      g.fillStyle = `rgba(16,12,8,${Math.min(1, B.hole)})`;
      g.beginPath(); g.ellipse(70, 104, 30 * Math.min(1, B.hole), 6 * Math.min(1, B.hole), 0, 0, Math.PI * 2); g.fill();
    }
    if (B.meVis) {
      g.save(); g.beginPath(); g.rect(0, 0, 240, B.hole > 0 ? 104 : 112); g.clip();
      draw('me_b', Math.round(B.meX + B.meShake), Math.round(B.meY + B.meDrop));
      g.restore();
    }
    for (const e of B.fx) e.draw(e.t);
    // foe HP box
    if (B.foeBox > -200) {
      const x = 6 + B.foeBox, y = 12;
      box(x, y, 106, 32, 'hp');
      let cx = text('RABBIT', x + 8, y + 6);
      text('♀', cx + 2, y + 6, '#e05878', '#f0c8d0');
      const lv = 'Lv' + FOE_LEVEL;
      text(lv, x + 98 - measure(lv), y + 6);
      g.fillStyle = '#f0a020'; g.fillRect(x + 14, y + 18, 13, 7);
      text('HP', x + 15, y + 17, '#f8f8f8', null);
      hpBar(x + 30, y + 20, 64, B.foeHP / B.foe.maxhp);
      if (B.foe.asleep) badge('SLP', x + 8, y + 26 - 1);
    }
    // player HP box
    if (B.meBox < 200) {
      const x = 126 + B.meBox, y = 68;
      box(x, y, 110, 42, 'hp');
      text('YOU', x + 10, y + 6);
      const lv = 'Lv' + ME.level;
      text(lv, x + 102 - measure(lv), y + 6);
      g.fillStyle = '#f0a020'; g.fillRect(x + 20, y + 17, 13, 7);
      text('HP', x + 21, y + 16, '#f8f8f8', null);
      hpBar(x + 36, y + 19, 64, B.meHP / B.me.maxhp);
      const nums = Math.max(0, Math.round(B.meHP)) + '/ ' + B.me.maxhp;
      text(nums, x + 100 - measure(nums), y + 25);
      if (B.me.love > 0) text('♥', x + 10, y + 25, '#e05878', '#f0c8d0');
      const lo = expFor(ME.level), hi = expFor(ME.level + 1);
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
        const mv = MOVES[m.id], f = m.pp / mv.pp;
        const col = m.pp === 0 ? '#e04838' : f <= 0.25 ? '#e08830' : f <= 0.5 ? '#c8a020' : C.text;
        text('PP', 170, 120);
        const s = m.pp + '/' + mv.pp;
        text(s, 230 - measure(s), 120, col);
        text('TYPE/???', 170, 136);
      }
    }
    if (B.bars > 0) drawBars(B.bars);
    if (B.tint) { g.fillStyle = B.tint; g.fillRect(0, 0, 240, 112); }
  }
  function badge(s, x, y) {
    g.fillStyle = '#9068b0'; g.fillRect(x, y, measure(s) + 4, 9);
    text(s, x + 2, y + 1, '#f8f8f8', null);
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
    if (B.expTarget !== undefined && B.expShown < B.expTarget) B.expShown = Math.min(B.expTarget, B.expShown + Math.max(1, (expFor(ME.level + 1) - expFor(ME.level)) / 60));
  }

  // ---------------------------------------------------------------- animation helpers
  const fx = (life, drawFn) => { const e = { t: 0, life, draw: drawFn }; B.fx.push(e); return e; };
  async function blink(who) {
    for (let i = 0; i < 4; i++) {
      if (who === 'foe') B.foeVis = false; else B.meVis = false;
      await wait(3);
      B.foeVis = true; B.meVis = true;
      await wait(3);
    }
  }
  async function drainHP(who) {
    const target = who === 'foe' ? B.foe.hp : ME.hp, max = who === 'foe' ? B.foe.maxhp : B.me.maxhp;
    const step = Math.max(1, max / 48);
    for (;;) {
      const cur = who === 'foe' ? B.foeHP : B.meHP;
      if (Math.abs(cur - target) < 0.01) break;
      const nxt = cur > target ? Math.max(target, cur - step) : Math.min(target, cur + step);
      if (who === 'foe') B.foeHP = nxt; else B.meHP = nxt;
      await wait(1);
    }
  }
  async function projectile(name, x0, y0, x1, y1, frames, arc = 0, miss = false) {
    if (miss) { x1 += 30; y1 -= 26; }
    const e = fx(frames + 1, t => {
      const k = Math.min(1, t / frames);
      draw(name, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * arc);
    });
    await wait(frames);
    return e;
  }
  async function stoneAnim(big, miss) {
    await projectile('stone', 92, 72, 172, 32, big ? 10 : 16, big ? 10 : 24, miss);
    if (big && !miss) await projectile('stone', 96, 68, 180, 38, 8, 8);
  }
  async function boltAnim(miss) { await projectile('bolt', 92, 62, 160, 32, 10, 0, miss); }
  async function muzzle(n = 1, spread = 0) {
    for (let k = 0; k < n; k++) {
      const dy = spread ? Math.round((TG.crand() - 0.5) * spread) : 0;
      const e = fx(3, () => {
        g.fillStyle = '#f8e070'; g.fillRect(98, 64, 5, 3); g.fillRect(100, 62, 1, 7);
        g.strokeStyle = 'rgba(248,240,160,0.9)'; g.beginPath(); g.moveTo(102, 65.5); g.lineTo(174, 32.5 + dy); g.stroke();
      });
      await wait(3);
    }
  }
  async function crosshair() {
    for (let i = 0; i <= 20; i++) {
      const s = 2 - i / 20;
      const e = fx(1, () => { const w = 17 * s; g.drawImage(TG.spr('cross'), Math.round(176 - w / 2), Math.round(32 - w / 2), Math.round(w), Math.round(w)); });
      await wait(1);
    }
    fx(12, () => TG.draw('cross', 168, 24));
    await wait(12);
    await TG.fadeTo(0.9, 2, '248,248,248'); await TG.fadeTo(0, 6);
  }
  async function mathAnim() {
    const sym = ['π', 'Σ', '∫', '√', '=', '+', '×', 'ρ'];
    sym.forEach((s, k) => {
      const t0 = k * 4;
      fx(40 + t0, t => {
        const u = (t - t0) / 30;
        if (u < 0 || u > 1) return;
        text(s, 90 + 82 * u, 70 - 40 * u - Math.sin(u * Math.PI) * 10, '#3870d0', '#c8dcf8');
      });
    });
    await wait(64);
  }
  async function phoneAnim() {
    fx(40, t => { draw('phone', 100, 58 + ((t >> 2) & 1)); if ((t >> 3) & 1) { text('(', 92, 60, C.text, null); text(')', 109, 60, C.text, null); } });
    await wait(40);
  }
  async function policeAnim() {
    let x = 250;
    const e = fx(0, t => { draw((t >> 3) & 1 ? 'police0' : 'police1', Math.round(x), 44); });
    const tint = setTintFlash();
    for (let i = 0; i < 40; i++) { x = 250 - i * 3; await wait(1); }
    await wait(16);
    for (let i = 0; i < 40; i++) { x += 4; B.foeX += 4; await wait(1); }
    B.foeVis = false;
    B.fx.splice(B.fx.indexOf(e), 1);
    tint.stop();
  }
  function setTintFlash() {
    let on = true;
    (async () => { let k = 0; while (on) { B.tint = k % 2 ? 'rgba(56,112,208,0.18)' : 'rgba(232,72,56,0.18)'; k++; await wait(6); } B.tint = null; })();
    return { stop() { on = false; } };
  }
  async function holeAnim() {
    for (let i = 0; i <= 10; i++) { B.hole = i / 10; await wait(1); }
    for (let i = 0; i < 18; i++) { B.meDrop = i * 3; await wait(1); }
    await wait(14);
    for (let i = 18; i >= 0; i--) { B.meDrop = i * 3; await wait(1); }
    for (let i = 10; i >= 0; i--) { B.hole = i / 10; await wait(1); }
    B.hole = 0;
  }
  async function hopAnim() {
    for (let r = 0; r < 2; r++) for (let i = 0; i <= 6; i++) { B.foeY = FOE_Y - Math.sin(i / 6 * Math.PI) * 12; await wait(1); }
    B.foeY = FOE_Y;
    await shakeMe();
  }
  async function shakeMe() { for (let i = 0; i < 8; i++) { B.meShake = i % 2 ? 3 : -3; await wait(1); } B.meShake = 0; }
  async function hearts(fromX, fromY, toX, toY, n = 3) {
    for (let k = 0; k < n; k++) {
      const t0 = k * 6;
      fx(36 + t0, t => { const u = (t - t0) / 30; if (u < 0 || u > 1) return; draw('heart', fromX + (toX - fromX) * u, fromY + (toY - fromY) * u - Math.sin(u * Math.PI) * 10); });
    }
    await wait(36 + n * 6);
  }
  async function aegyoAnim() {
    B.foeFace = 'aegyo';
    for (let i = 0; i < 3; i++) { B.foeX = 146; await wait(4); B.foeX = 142; await wait(4); }
    B.foeX = 144;
    await hearts(170, 22, 80, 70, 3);
    B.foeFace = B.foe.asleep ? 'sleep' : 'normal';
  }
  async function zzzAnim() {
    fx(40, t => { text(t < 20 ? 'z' : 'Z', 198 + t * 0.3, 12 - t * 0.3, '#e8e8f8', '#4c3c78'); });
    await wait(30);
  }
  async function foeFaint() { for (let i = 0; i <= 16; i++) { B.foeDrop = i * 4; await wait(1); } B.foeVis = false; }
  async function meFaint() { for (let i = 0; i <= 16; i++) { B.meDrop = i * 4; await wait(1); } B.meVis = false; }

  // ---------------------------------------------------------------- rules
  function damage(att, def, power) {
    const base = Math.floor(Math.floor(Math.floor(2 * att.level / 5 + 2) * power * att.atk / def.def) / 50) + 2;
    const crit = Math.random() < 1 / 16;
    const r = (85 + rnd(16)) / 100;
    return { dmg: Math.max(1, Math.floor(base * (crit ? 2 : 1) * r)), crit };
  }
  const bsay = (s, o = {}) => say(s, Object.assign({ style: 'battle' }, o));

  async function hitFoe(d) {
    const foe = B.foe;
    foe.hp = Math.max(0, foe.hp - Math.min(d, foe.hp));
    await blink('foe');
    await drainHP('foe');
  }
  async function hitMe(d) {
    ME.hp = Math.max(0, ME.hp - Math.min(d, ME.hp));
    await blink('me');
    await drainHP('me');
  }

  async function meAct(act) {
    const me = B.me, foe = B.foe;
    if (act.t === 'wait') {
      await bsay('The police arrived!');
      await policeAnim();
      await bsay('The police took Foe RABBIT away!');
      return 'police';
    }
    if (me.flinch) { await bsay('You flinched!'); return null; }
    if (me.love > 0) {
      await bsay('You are in love with Foe RABBIT!');
      await hearts(80, 60, 84, 40, 2);
      if (Math.random() < 0.5) { await bsay('You are immobilized by love!'); return null; }
    }
    if (act.t === 'struggle') {
      await bsay('You have no moves left!');
      await bsay('You used STRUGGLE!');
      const { dmg } = damage(me, foe, 50);
      await hitFoe(dmg);
      const rec = Math.max(1, Math.floor(dmg / 4));
      await hitMe(rec);
      await bsay('You are hit with recoil!');
      return null;
    }
    const slot = ME.moves[act.i], mv = MOVES[slot.id];
    slot.pp = Math.max(0, slot.pp - 1);
    await bsay(`You used ${mv.name}!`);
    if (mv.kind === 'sleep' && foe.asleep) { await bsay('But it failed!'); return null; }
    if (mv.kind === 'uzi') {
      let hits = 0;
      for (let k = 0; k < mv.rounds; k++) if (Math.random() * 100 < mv.acc) hits++;
      await muzzle(mv.rounds, 14);
      if (!hits) { await bsay(`All ${mv.rounds} rounds missed!`); return null; }
      B.foeWhite = true; await wait(4); B.foeWhite = false;
      await hitFoe(foe.hp);
      await bsay(`Hit ${hits} time(s)!`);
      await bsay("It's a one-hit KO!");
      return null;
    }
    const hit = Math.random() * 100 < mv.acc;
    if (!hit) {
      if (mv.kind === 'frac') await stoneAnim(slot.id === 'sling', true);
      if (mv.kind === 'bow') await boltAnim(true);
      if (mv.kind === 'ohko' && slot.id === 'glock') await muzzle(1, 30);
      if (mv.kind === 'police') { await phoneAnim(); await bsay('But nobody picked up!'); return null; }
      await bsay('Your attack missed!');
      return null;
    }
    switch (mv.kind) {
      case 'sleep':
        await mathAnim();
        foe.asleep = true; foe.sleep = 2 + rnd(4); foe.sleepHeal = false; B.foeFace = 'sleep';
        zzzAnim();
        await bsay('Foe RABBIT fell asleep from boredom!');
        return null;
      case 'police':
        await phoneAnim();
        me.police = 1;
        await bsay('You called the police!\nThey are on their way!');
        return null;
      case 'frac':
        await stoneAnim(slot.id === 'sling', false);
        await hitFoe(Math.max(1, Math.floor(foe.maxhp * mv.frac)));
        return null;
      case 'bow':
        await boltAnim(false);
        await hitFoe(Math.max(1, Math.floor(foe.maxhp * mv.frac)));
        if (foe.hp > 0) { foe.bleed = 2 + rnd(4); await bsay('Foe RABBIT is wounded by the bolt!'); }
        return null;
      case 'ohko':
        if (slot.id === 'glock') await muzzle(1); else await crosshair();
        B.foeWhite = true; await wait(4); B.foeWhite = false;
        await hitFoe(foe.hp);
        await bsay("It's a one-hit KO!");
        return null;
    }
    return null;
  }

  async function foeAct(id) {
    const foe = B.foe, me = B.me;
    if (foe.asleep) {
      if (foe.sleep > 0) {
        foe.sleep--;
        zzzAnim();
        await bsay('Foe RABBIT is fast asleep.');
        if (foe.sleepHeal && foe.hp < foe.maxhp) {
          foe.hp = Math.min(foe.maxhp, foe.hp + Math.max(1, Math.floor(foe.maxhp / 16)));
          await drainHP('foe');
          await bsay('Foe RABBIT restored a little HP in its sleep.');
        }
        return;
      }
      foe.asleep = false; foe.sleepHeal = false; B.foeFace = 'normal';
      await bsay('Foe RABBIT woke up!');
    }
    const mv = FOE_MOVES[id];
    await bsay(`Foe RABBIT used ${mv.name}!`);
    if (Math.random() * 100 >= mv.acc) { await bsay("Foe RABBIT's attack missed!"); return; }
    if (id === 'hole') {
      await holeAnim();
      await bsay('You were dragged down the tunnel!');
      const { dmg, crit } = damage(foe, me, mv.power);
      await hitMe(dmg);
      if (crit) await bsay('A critical hit!');
    } else if (id === 'hop') {
      await hopAnim();
      const { dmg, crit } = damage(foe, me, mv.power);
      await hitMe(dmg);
      if (crit) await bsay('A critical hit!');
      if (ME.hp > 0 && Math.random() < mv.flinch) me.flinch = true;
    } else if (id === 'aegyo') {
      await aegyoAnim();
      if (me.love > 0) { await bsay('But it failed!'); return; }
      await bsay('Bunny bunny~!');
      me.love = 2 + rnd(4);
      await bsay('You fell in love with Foe RABBIT!');
    } else if (id === 'sleep') {
      B.foeFace = 'sleep';
      foe.asleep = true; foe.sleep = 2 + rnd(4); foe.sleepHeal = true;
      zzzAnim();
      await bsay('Foe RABBIT curled up and fell asleep!');
    }
  }

  async function endTurn() {
    const me = B.me, foe = B.foe;
    me.flinch = false;
    if (foe.bleed > 0 && foe.hp > 0) {
      foe.bleed--;
      await bsay('Foe RABBIT is hurt by its wound!');
      await hitFoe(Math.max(1, Math.floor(foe.maxhp / 20)));
      if (foe.hp <= 0) return 'win';
    }
    if (me.love > 0) { me.love--; if (me.love === 0) await bsay('You got over the infatuation.'); }
    return null;
  }

  async function tryRun() {
    B.runs++;
    const me = B.me, foe = B.foe;
    let ok = me.spe >= foe.spe;
    if (!ok) { const f = (Math.floor(me.spe * 128 / foe.spe) + 30 * B.runs) % 256; ok = rnd(256) < f; }
    if (ok) { await bsay('Got away safely!'); return true; }
    await bsay("Can't escape!");
    return false;
  }

  async function chooseMove() {
    for (;;) {
      const names = [0, 1, 2, 3].map(k => ME.moves[k] ? MOVES[ME.moves[k].id].name : '-');
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
  async function chooseAction() {
    for (;;) {
      await bsay('What will\nyou do?', { wait: false, speed: 4, narrow: 104 });
      const i = await choose(['FIGHT', 'BAG', 'TEAM', 'RUN'], { cols: 2, x: 120, y: 112, w: 120, h: 48, iw: 54, start: B.lastAction || 0 });
      B.lastAction = i;
      if (i === 0) {
        if (ME.moves.every(m => m.pp <= 0)) return { t: 'struggle' };
        const m = await chooseMove();
        if (m >= 0) return { t: 'move', i: m };
      } else if (i === 1) await bsay('Your BAG is empty.');
      else if (i === 2) await bsay("There is no one else on your team.\nIt's just you.");
      else return { t: 'run' };
    }
  }

  async function turn() {
    const me = B.me, foe = B.foe;
    const act = me.police === 1 ? { t: 'wait' } : await chooseAction();
    close();
    if (act.t === 'run') {
      if (await tryRun()) return 'run';
      await foeAct(FOE_LIST[rnd(4)]);
      if (ME.hp <= 0) return 'lose';
      return await endTurn();
    }
    const fm = FOE_LIST[rnd(4)];
    const myPrio = act.t === 'move' ? MOVES[ME.moves[act.i].id].prio : 0;
    const foePrio = foe.asleep ? 0 : FOE_MOVES[fm].prio;
    const meFirst = myPrio > foePrio || (myPrio === foePrio && (me.spe > foe.spe || (me.spe === foe.spe && Math.random() < 0.5)));
    for (const who of meFirst ? ['me', 'foe'] : ['foe', 'me']) {
      if (who === 'me') { const r = await meAct(act); if (r) return r; }
      else await foeAct(fm);
      if (ME.hp <= 0) return 'lose';
      if (foe.hp <= 0) return 'win';
    }
    return await endTurn();
  }

  // ---------------------------------------------------------------- level up, moves
  async function statBox(old, nu) {
    let phase = 0;
    const rows = [['MAX. HP', 'hp'], ['ATTACK', 'atk'], ['DEFENSE', 'def'], ['SPEED', 'spe']];
    const layer = () => {
      box(140, 22, 96, 76, 'menu');
      rows.forEach(([lab, k], i) => {
        text(lab, 150, 31 + i * 16);
        const v = phase === 0 ? '+' + (nu[k] - old[k]) : String(nu[k]);
        text(v, 228 - measure(v), 31 + i * 16);
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
    const name = MOVES[id].name;
    if (ME.moves.length < 4) { ME.moves.push({ id, pp: MOVES[id].pp }); await s(`You learned ${name}!`); return; }
    for (;;) {
      await s(`You are trying to learn ${name}.`);
      await s("But you can't learn more than four moves.");
      await s(`Delete a move to make room for ${name}?`, { wait: false });
      if (await yesno()) {
        await s('Which move should be forgotten?', { wait: false });
        const list = ME.moves.map(m => MOVES[m.id].name);
        const i = await choose(list, { cancel: -1, x: 238 - (Math.max(...list.map(measure)) + 30), y: 113 - (list.length * 16 + 12) });
        if (i >= 0) {
          const old = MOVES[ME.moves[i].id].name;
          await s('1, 2, and... ... ... Poof!');
          await s(`You forgot ${old}.`);
          await s('And...');
          ME.moves[i] = { id, pp: MOVES[id].pp };
          await s(`You learned ${name}!`);
          return;
        }
      }
      await s(`Stop learning ${name}?`, { wait: false });
      if (await yesno()) { await s(`You did not learn ${name}.`); return; }
    }
  }
  async function levelUp(style) {
    const old = stats(BASE_ME, ME.level);
    ME.level++;
    const nu = stats(BASE_ME, ME.level);
    ME.hp = Math.min(nu.hp, ME.hp + nu.hp - old.hp);
    if (B.active) { Object.assign(B.me, nu, { maxhp: nu.hp, level: ME.level }); B.meHP = ME.hp; B.expShown = expFor(ME.level); B.expTarget = expFor(ME.level); }
    await say(`You grew to Lv. ${ME.level}!`, { style });
    await statBox(old, nu);
    if (LEARN[ME.level]) await learnMove(LEARN[ME.level], style);
  }
  async function gainExp(n) {
    await bsay(`You gained ${n} EXP. Points!`);
    ME.exp += n;
    while (ME.level < 100 && ME.exp >= expFor(ME.level + 1)) {
      B.expTarget = expFor(ME.level + 1);
      await until(() => B.expShown >= B.expTarget);
      await levelUp('battle');
    }
    B.expTarget = ME.exp;
    await until(() => B.expShown >= B.expTarget);
  }
  async function rareCandy(style) {
    if (ME.level >= 100) { await say("It won't have any effect.", { style }); return; }
    ME.exp = expFor(ME.level + 1);
    await levelUp(style);
  }

  // ---------------------------------------------------------------- flow
  async function intro() {
    for (let i = 0; i < 2; i++) { await fadeTo(0.85, 4, '248,248,248'); await fadeTo(0, 4); }
    const layer = () => drawBars(B.bars);
    B.bars = 0;
    TG.layers.add(layer);
    for (let i = 1; i <= 20; i++) { B.bars = i / 20; await wait(1); }
    TG.layers.delete(layer);
    TG.hooks.update = update; TG.hooks.render = render;
    B.foeX = -64; B.meX = 240; B.foeBox = -240; B.meBox = 240;
    for (let i = 19; i >= 0; i--) { B.bars = i / 20; await wait(1); }
    B.bars = 0;
    for (let i = 0; i <= 40; i++) { B.foeX = -64 + 208 * i / 40; B.meX = 240 - 204 * i / 40; await wait(1); }
    await bsay('The RABBIT challenges you!');
    for (let i = 0; i <= 12; i++) { B.foeBox = -240 + 240 * i / 12; await wait(1); }
    for (let i = 0; i <= 12; i++) { B.meBox = 240 - 240 * i / 12; await wait(1); }
  }
  async function start() {
    const prev = { u: TG.hooks.update, r: TG.hooks.render };
    const fs = stats(BASE_FOE, FOE_LEVEL), ms = stats(BASE_ME, ME.level);
    Object.assign(B, {
      active: true, fx: [], foeFace: 'normal', foeVis: true, meVis: true, foeWhite: false, foeDrop: 0, meDrop: 0, meShake: 0,
      hole: 0, tint: null, foeY: FOE_Y, meY: 48, runs: 0, lastAction: 0, lastMove: 0, moveInfo: null, bars: 0,
      foe: Object.assign({ level: FOE_LEVEL, maxhp: fs.hp, asleep: false, sleep: 0, sleepHeal: false, bleed: 0 }, fs),
      me: Object.assign({ level: ME.level, maxhp: ms.hp, love: 0, flinch: false, police: 0 }, ms),
    });
    ME.hp = Math.min(ME.hp, ms.hp);
    B.foeHP = B.foe.hp; B.meHP = ME.hp; B.expShown = ME.exp; B.expTarget = ME.exp;
    TG.TB.defaultStyle = 'battle';
    await intro();
    let result = null;
    while (!result) result = await turn();
    if (result === 'win') {
      await foeFaint();
      await bsay('Foe RABBIT fainted!');
      await gainExp(Math.floor(FOE_YIELD * FOE_LEVEL / 7));
    } else if (result === 'police') {
      await bsay('The battle is over. No EXP. Points were gained.');
    } else if (result === 'lose') {
      await meFaint();
      await bsay('You fainted!');
      await bsay('You whited out!');
    }
    close();
    TG.TB.defaultStyle = 'world';
    B.active = false;
    if (result === 'lose') {
      await fadeTo(1, 30, '248,248,248');
      TG.hooks.update = prev.u; TG.hooks.render = prev.r;
      await WORLD.whiteout();
      return;
    }
    await fadeTo(1, 16, '0,0,0');
    heal();
    TG.hooks.update = prev.u; TG.hooks.render = prev.r;
    await wait(8);
    await fadeTo(0, 16);
  }

  return { start, heal, rareCandy, ME, MOVES, stats, expFor, B, get active() { return B.active; } };
})();
