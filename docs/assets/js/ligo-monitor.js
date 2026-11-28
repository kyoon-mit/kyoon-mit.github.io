/* Benchmark monitor (/projects/agentic-ligo/monitor/): interactive views of the scoring
   rules on the agent report, and a board of published runs read from
   /assets/data/ligo-monitor-runs.json. */
'use strict';
(() => {
  const root = document.getElementById('mon');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const css = name => getComputedStyle(root).getPropertyValue(name).trim();
  const fmt = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '∞').replace('-', '−');
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const charge = (ratio, z) => Math.log(ratio) + (z * z - 1) / 2;

  // colors from the page's tokens (the dark page swaps ink and paper)
  function hex(c) {
    const m = /^#?([0-9a-f]{6})$/i.exec(c);
    if (!m) return [128, 128, 128];
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function palette() {
    return {
      good: hex(css('--rebuttal')), bad: hex(css('--warn')), mid: hex(css('--paper-2')),
      ink: css('--ink'), ink3: css('--ink-3'), rule: css('--rule'), accent: css('--accent'),
    };
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  // ---------------------------------------------------------------- 1. charge map
  (function chargeExplorer() {
    const sig = $('c-sig'), z = $('c-z'), cv = $('c-map');
    if (!sig || !cv) return;
    const ctx = cv.getContext('2d');
    let base = null;
    function drawBase() {
      const P = palette(), W = cv.width, H = cv.height;
      const img = ctx.createImageData(W, H);
      for (let j = 0; j < H; j++) {
        const zz = 4 - 8 * j / (H - 1);
        for (let i = 0; i < W; i++) {
          const r = Math.pow(2, -2 + 4 * i / (W - 1));
          const d = charge(r, zz);
          const c = d < 0 ? mix(P.mid, P.good, Math.min(1, -d / 1.4)) : mix(P.mid, P.bad, Math.min(1, d / 4));
          const k = 4 * (j * W + i);
          img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      // contour of zero charge and axes at ratio 1, z 0
      ctx.strokeStyle = P.ink; ctx.globalAlpha = .55; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < W; i++) {
        const r = Math.pow(2, -2 + 4 * i / (W - 1)), q = 1 - 2 * Math.log(r);
        if (q < 0) continue;
        for (const s of [1, -1]) {
          const y = (4 - s * Math.sqrt(q)) / 8 * (H - 1);
          ctx.fillStyle = P.ink; ctx.fillRect(i, y, 1, 1);
        }
      }
      ctx.setLineDash([3, 4]);
      ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      base = ctx.getImageData(0, 0, W, H);
    }
    function update() {
      const r = Math.pow(2, +sig.value), zz = +z.value, d = charge(r, zz);
      $('c-sig-o').textContent = fmt(r, 2); $('c-z-o').textContent = fmt(zz, 2);
      $('c-d').textContent = fmt(d); $('c-s').textContent = fmt(Math.exp(-2 * d));
      const say = [];
      say.push(r < 1 ? `Quoting ${fmt(1 / r, 2)}× tighter than the reference earns ${fmt(-Math.log(r), 2)} of credit…` : r > 1 ? `Quoting ${fmt(r, 2)}× wider than the reference costs ${fmt(Math.log(r), 2)}…` : 'Same precision as the reference…');
      say.push(Math.abs(zz) > 1 ? ` but missing the truth by ${fmt(Math.abs(zz), 2)}σ costs ${fmt((zz * zz - 1) / 2, 2)}.` : ` and landing within 1σ of the truth earns ${fmt((1 - zz * zz) / 2, 2)}.`);
      $('c-say').textContent = say.join('');
      if (!base) drawBase(); else ctx.putImageData(base, 0, 0);
      const W = cv.width, H = cv.height, x = (+sig.value + 2) / 4 * (W - 1), y = (4 - zz) / 8 * (H - 1);
      const P = palette();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 2 * Math.PI); ctx.fill();
    }
    function pick(ev) {
      const b = cv.getBoundingClientRect();
      const fx = (ev.clientX - b.left) / b.width, fy = (ev.clientY - b.top) / b.height;
      sig.value = (-2 + 4 * fx).toFixed(2); z.value = (4 - 8 * fy).toFixed(2);
      update();
    }
    let drag = false;
    cv.addEventListener('pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); pick(e); });
    cv.addEventListener('pointermove', e => { if (drag) pick(e); });
    cv.addEventListener('pointerup', () => { drag = false; });
    sig.addEventListener('input', update); z.addEventListener('input', update);
    update();
  })();

  // ---------------------------------------------------------------- plot helper
  function plot(svg, { xmin, xmax, ymin, ymax, xlog, xticks, yticks, xlabel, ylabel }) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const vb = svg.viewBox.baseVal, L = 46, R = 12, T = 12, B = 34;
    const W = vb.width - L - R, H = vb.height - T - B;
    const fx = x => L + ((xlog ? Math.log2(x) : x) - (xlog ? Math.log2(xmin) : xmin)) / ((xlog ? Math.log2(xmax) : xmax) - (xlog ? Math.log2(xmin) : xmin)) * W;
    const fy = y => T + (ymax - Math.max(ymin, Math.min(ymax, y))) / (ymax - ymin) * H;
    const P = palette();
    const g = svgEl('g', { class: 'mon-axes' }, svg);
    for (const t of yticks) {
      svgEl('line', { x1: L, x2: L + W, y1: fy(t), y2: fy(t), stroke: P.rule }, g);
      svgEl('text', { x: L - 6, y: fy(t) + 4, 'text-anchor': 'end' }, g).textContent = String(t).replace('-', '−');
    }
    for (const t of xticks) {
      svgEl('line', { x1: fx(t), x2: fx(t), y1: T, y2: T + H, stroke: P.rule }, g);
      svgEl('text', { x: fx(t), y: T + H + 16, 'text-anchor': 'middle' }, g).textContent = t < 1 && xlog ? `1/${1 / t}` : String(t);
    }
    svgEl('text', { x: L + W / 2, y: vb.height - 4, 'text-anchor': 'middle', class: 'mon-axlabel' }, g).textContent = xlabel;
    svgEl('text', { x: 12, y: T + H / 2, transform: `rotate(-90 12 ${T + H / 2})`, 'text-anchor': 'middle', class: 'mon-axlabel' }, g).textContent = ylabel;
    return { fx, fy, P, L, T, W, H };
  }
  const curve = (fn, xs, fx, fy) => xs.map((x, i) => `${i ? 'L' : 'M'}${fx(x).toFixed(1)},${fy(fn(x)).toFixed(1)}`).join('');
  const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(2, Math.log2(a) + (Math.log2(b) - Math.log2(a)) * i / (n - 1)));

  // ---------------------------------------------------------------- 2. honesty curve
  (function honesty() {
    const tr = $('h-true'), sg = $('h-sig'), svg = $('h-plot'), cb = $('h-bias'), kk = $('h-k');
    if (!tr || !svg) return;
    const xs = logspace(0.25, 4, 200);
    function update() {
      const st = Math.pow(2, +tr.value), s = Math.pow(2, +sg.value);
      const f = cb.checked ? 1 + 1 / +kk.value : 1;
      $('h-k-wrap').hidden = !cb.checked; $('h-k-o').textContent = kk.value;
      const E = r => Math.log(r) + f * ((st / r) ** 2 - 1) / 2;
      const best = st * Math.sqrt(f);
      $('h-true-o').textContent = fmt(st, 2); $('h-sig-o').textContent = fmt(s, 2);
      $('h-d').textContent = fmt(E(s)); $('h-best').textContent = fmt(E(best));
      const p = plot(svg, { xmin: 0.25, xmax: 4, ymin: -1, ymax: 4, xlog: true, xticks: [0.25, 0.5, 1, 2, 4], yticks: [-1, 0, 1, 2, 3, 4], xlabel: 'quoted σ / σ_ref', ylabel: 'expected charge' });
      svgEl('path', { d: curve(E, xs, p.fx, p.fy), fill: 'none', stroke: p.P.accent, 'stroke-width': 2.5 }, svg);
      svgEl('circle', { cx: p.fx(best), cy: p.fy(E(best)), r: 8, fill: 'none', stroke: p.P.ink, 'stroke-width': 1.5 }, svg);
      svgEl('circle', { cx: p.fx(s), cy: p.fy(E(s)), r: 5, fill: p.P.ink, class: 'mon-dot' }, svg);
    }
    tr.addEventListener('input', update); sg.addEventListener('input', update);
    cb.addEventListener('change', update); kk.addEventListener('input', update);
    update();
  })();

  // ---------------------------------------------------------------- 3. total score
  const TERMS = [
    ['phys', 'Physics', 1], ['cal', 'Calibration', 0.10], ['gof', 'Goodness of fit', 0.30], ['syst', 'Completeness', 0.10],
    ['truth', 'Truthfulness', 0.5], ['claims', 'Claims', 0.05], ['compute', 'Compute', 0.1],
  ];
  (function total() {
    const box = $('t-sliders'), bars = $('t-bars'), ref = $('t-ref');
    if (!box || !bars) return;
    const inputs = {};
    for (const [k, name, w] of TERMS) {
      const lab = document.createElement('label');
      lab.className = 'mon-slider mon-slider--term';
      lab.innerHTML = `<span>${name} <small>× ${w}</small></span> <output></output>`;
      const inp = document.createElement('input');
      Object.assign(inp, { type: 'range', min: -1, max: 3, step: 0.01, value: 0 });
      lab.appendChild(inp);
      box.appendChild(lab);
      inputs[k] = inp;
      inp.addEventListener('input', update);
    }
    ref.addEventListener('input', update);
    $('t-reset').addEventListener('click', () => { for (const k in inputs) inputs[k].value = 0; ref.value = 0; update(); });
    function update() {
      let tot = 0, parts = [];
      for (const [k, name, w] of TERMS) {
        const v = +inputs[k].value;
        inputs[k].previousElementSibling.textContent = fmt(v, 2);
        tot += w * v;
        parts.push([name, w * v]);
      }
      const r = +ref.value;
      $('t-ref-o').textContent = fmt(r, 2);
      $('t-d').textContent = fmt(tot); $('t-s').textContent = fmt(Math.exp(-2 * tot));
      const rel = 100 * Math.exp(-2 * (tot - r));
      const el = $('t-rel');
      el.textContent = (rel >= 1000 ? rel.toFixed(0) : rel.toPrecision(3)) + ' %';
      el.classList.toggle('is-up', rel > 100.05); el.classList.toggle('is-down', rel < 99.95);
      const span = Math.max(1, ...parts.map(p => Math.abs(p[1])));
      bars.innerHTML = '';
      for (const [name, c] of parts) {
        const row = document.createElement('div');
        row.className = 'mon-bar';
        const pct = Math.abs(c) / span * 50;
        row.innerHTML = `<span class="mon-bar__name">${name}</span><span class="mon-bar__track"><span class="mon-bar__fill ${c < 0 ? 'is-neg' : 'is-pos'}" style="width:${pct}%;${c < 0 ? `right:50%` : `left:50%`}"></span><span class="mon-bar__zero"></span></span><span class="mon-bar__val">${fmt(c, 3)}</span>`;
        bars.appendChild(row);
      }
    }
    update();
  })();

  // ---------------------------------------------------------------- 4. compute charge
  (function compute() {
    const r = $('k-r'), svg = $('k-plot'), gs = $('k-g');
    if (!r || !svg) return;
    const raw = x => (x >= 1 ? Math.max(0, Math.log2(x) - Math.log2(1.5)) : Math.max(-1, Math.log2(x)));
    const xs = logspace(0.25, 16, 240);
    function update() {
      const g = Math.min(1, Math.max(0, 1 - +gs.value / 0.05));
      const D = x => Math.max(0, raw(x)) + g * Math.min(0, raw(x));
      const x = Math.pow(2, +r.value), d = D(x);
      $('k-r-o').textContent = fmt(x, 2); $('k-g-o').textContent = fmt(+gs.value, 3);
      $('k-gv').textContent = Math.round(100 * g) + ' %';
      $('k-d').textContent = fmt(d); $('k-w').textContent = fmt(0.1 * d);
      const p = plot(svg, { xmin: 0.25, xmax: 16, ymin: -1, ymax: 4, xlog: true, xticks: [0.25, 0.5, 1, 2, 4, 8, 16], yticks: [-1, 0, 1, 2, 3, 4], xlabel: 't / t_ref', ylabel: 'compute charge' });
      svgEl('rect', { x: p.fx(0.25), y: p.fy(0), width: p.fx(1) - p.fx(0.25), height: p.fy(-1) - p.fy(0), class: 'mon-band' }, svg);
      svgEl('path', { d: curve(D, xs, p.fx, p.fy), fill: 'none', stroke: p.P.accent, 'stroke-width': 2.5 }, svg);
      svgEl('line', { x1: p.fx(1.5), x2: p.fx(1.5), y1: p.T, y2: p.T + p.H, stroke: p.P.ink3, 'stroke-dasharray': '3 4' }, svg);
      svgEl('circle', { cx: p.fx(x), cy: p.fy(d), r: 5, fill: p.P.ink, class: 'mon-dot' }, svg);
    }
    r.addEventListener('input', update); gs.addEventListener('input', update);
    update();
  })();

  // ---------------------------------------------------------------- 5. shared bias
  (function sharedBias() {
    const kk = $('s-k'), bb = $('s-b'), ee = $('s-e'), svg = $('s-plot');
    if (!kk || !svg) return;
    let seed = 20261127;
    function rng(a) {
      return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    }
    function gauss(r) { const u = Math.max(r(), 1e-12), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    function update() {
      const K = +kk.value, b = +bb.value, e = +ee.value, r = rng(seed);
      const u = Array.from({ length: K }, () => b + gauss(r) + e * gauss(r));
      const mean = u.reduce((a, x) => a + (x * x - 1) / 2, 0) / K;
      const zs = u.reduce((a, x) => a + x, 0) / Math.sqrt(K);
      const B = (zs * zs - 1) / (2 * K);
      $('s-k-o').textContent = K; $('s-b-o').textContent = fmt(b, 2); $('s-e-o').textContent = fmt(e, 2);
      $('s-m').textContent = fmt(mean); $('s-z').textContent = fmt(zs, 2); $('s-bt').textContent = fmt(B); $('s-t').textContent = fmt(mean + B);
      const p = plot(svg, { xmin: 0, xmax: K + 1, ymin: -4, ymax: 4, xlog: false, xticks: [], yticks: [-4, -2, 0, 2, 4], xlabel: `world (1 to ${K})`, ylabel: 'pull u' });
      const half = 1 / Math.sqrt(K), m = zs / Math.sqrt(K);
      svgEl('rect', { x: p.L, y: p.fy(half), width: p.W, height: p.fy(-half) - p.fy(half), class: 'mon-band' }, svg);
      u.forEach((x, i) => svgEl('circle', { cx: p.fx(i + 1), cy: p.fy(x), r: 3.5, fill: p.P.ink, opacity: Math.abs(x) > 4 ? 0.4 : 0.85 }, svg));
      svgEl('line', { x1: p.L, x2: p.L + p.W, y1: p.fy(m), y2: p.fy(m), stroke: p.P.accent, 'stroke-width': 3 }, svg);
    }
    $('s-roll').addEventListener('click', () => { seed = (seed * 1103515245 + 12345) >>> 0; update(); });
    for (const el of [kk, bb, ee]) el.addEventListener('input', update);
    update();
  })();

  // ---------------------------------------------------------------- 6. published runs
  (async function board() {
    const out = $('b-board');
    if (!out) return;
    let runs = [];
    try {
      const res = await fetch(root.dataset.runs, { cache: 'no-cache' });
      runs = (await res.json()).runs || [];
    } catch (_) { out.innerHTML = '<p class="mon-empty">The run list could not be loaded.</p>'; return; }
    document.querySelectorAll('.mon-nruns').forEach(e => { e.textContent = runs.length; });
    const st = document.getElementById('mon-status');
    if (st) st.textContent = runs.length ? `${runs.length} published run${runs.length > 1 ? 's' : ''}` : 'no published runs';
    if (!runs.length) {
      out.innerHTML = '<div class="mon-empty"><p class="mon-empty__big">No agent runs are published yet.</p><p>When results are published, each run appears here with its relative score and its ±1σ range, its charges, the time it used and how its sealed worlds went. Click a run to open it.</p></div>';
      return;
    }
    const filt = $('b-filters');
    filt.hidden = false;
    const sel = { task: $('b-task'), harness: $('b-harness'), prompt: $('b-prompt'), suite: $('b-suite') };
    const lo = r => (r.relative_score_range || [r.relative_score, r.relative_score])[0] || 0;
    const hi = r => (r.relative_score_range || [r.relative_score, r.relative_score])[1] || 0;
    for (const [k, s] of Object.entries(sel)) {
      s.innerHTML = '<option value="">All</option>' + [...new Set(runs.map(r => r[k]).filter(Boolean))].sort().map(v => `<option>${esc(v)}</option>`).join('');
      s.addEventListener('change', render);
    }
    $('b-sort').addEventListener('change', render);
    function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function render() {
      let list = runs.filter(r => Object.entries(sel).every(([k, s]) => !s.value || r[k] === s.value));
      const by = $('b-sort').value;
      list.sort((a, b) => by === 'date' ? String(b.date).localeCompare(String(a.date)) : by === 'time' ? (a.wall_time_s || 0) - (b.wall_time_s || 0) : (b.relative_score || 0) - (a.relative_score || 0));
      const top = Math.max(150, ...list.map(hi));
      const pos = v => Math.max(0, Math.min(100, v / top * 100));
      out.innerHTML = `<div class="mon-board" role="table">` + list.map((r, i) => `
        <button type="button" class="mon-row" data-i="${runs.indexOf(r)}" role="row">
          <span class="mon-row__who"><b>${esc(r.model || '?')}</b><small>${esc(r.harness || '')} · ${esc(r.task || '')} · ${esc(r.prompt || '')}</small></span>
          <span class="mon-row__bar"><span class="mon-row__ref" style="left:${pos(100)}%"></span>
            <span class="mon-row__err" style="left:${pos(lo(r))}%;width:${pos(hi(r)) - pos(lo(r))}%"></span>
            <span class="mon-row__pt" style="left:${pos(r.relative_score || 0)}%"></span></span>
          <span class="mon-row__val">${fmt(r.relative_score || 0, 1)} %</span>
        </button>`).join('') + '</div><p class="mon-note">The dashed line is the reference (100 %).</p>';
      out.querySelectorAll('.mon-row').forEach(b => b.addEventListener('click', () => detail(runs[+b.dataset.i])));
    }
    function detail(r) {
      const d = $('b-detail');
      d.hidden = false;
      const terms = r.terms || {};
      const rows = TERMS.concat([['peak', 'Z peak', 0.5]]).filter(([k]) => terms[k] !== null && terms[k] !== undefined)
        .map(([k, name, w]) => `<tr><td>${name}</td><td>${fmt(terms[k], 3)}</td><td>× ${w}</td><td>${fmt(w * terms[k], 3)}</td></tr>`).join('');
      const segs = r.segments || [], budget = r.budget_s || Math.max(1, ...segs.map(s => s.end_s || 0));
      const timeline = segs.map(s => `<span class="mon-seg ${s.exit === 124 ? 'is-cut' : ''}" style="left:${(s.start_s || 0) / budget * 100}%;width:${((s.end_s || 0) - (s.start_s || 0)) / budget * 100}%" title="exit ${esc(s.exit)}"></span>`).join('');
      const f = (r.worlds || {}).failed || {};
      d.innerHTML = `<header><h3>${esc(r.model || '')} <small>${esc(r.harness || '')}, ${esc(r.effort || 'default effort')}</small></h3><button type="button" class="mon-btn" id="b-close">Close</button></header>
        <p>${esc(r.task || '')} · suite ${esc(r.suite || '?')} · prompt ${esc(r.prompt || '')} · ${esc(r.date || '')} · relative score <b>${fmt(r.relative_score || 0, 1)} %</b> (1σ range ${fmt(lo(r), 1)} to ${fmt(hi(r), 1)} %)</p>
        <table class="mon-table"><thead><tr><th>Term</th><th>Charge</th><th>Weight</th><th>Weighted</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="mon-k">Time used: ${fmt((r.wall_time_s || 0) / 60, 1)} of ${fmt(budget / 60, 0)} minutes</p>
        <div class="mon-timeline">${timeline}</div>
        <p class="mon-k">Sealed worlds: ${esc((r.worlds || {}).n ?? '?')}; failed: ${['timeout', 'oom', 'crash', 'rejected', 'env', 'missing'].map(k => `${k} ${esc(f[k] || 0)}`).join(', ')}</p>`;
      $('b-close').addEventListener('click', () => { d.hidden = true; });
      d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    render();
  })();

  // ---------------------------------------------------------------- LIGO path
  (function ligoFlow() {
    const flow = $('l-flow'), out = $('l-detail');
    if (!flow) return;
    const notes = [
      'Real LIGO strain from the third observing run (O3), Hanford and Livingston, at 16,384 Hz, with simulated short bursts (under 10 s) added. Training: 39 waveforms (19 sine-Gaussians, 16 white-noise bursts, 4 binary black hole mergers on circular orbits).',
      'The agent writes its search on the O3a training data (one set with injected signals, one with noise only). Agents run with no network: O3 strain is public, so subtracting it would reveal every injection.',
      'For each dataset, a CSV trigger list with one row per candidate event: start GPS time (s), end GPS time (s), false-alarm rate (Hz). Sky position may be added later.',
      'On the sealed O3b test set: the same 39 waveforms plus five classes never seen in training. A toy task with simulated noise comes first, to test the scoring and the cheating submissions.',
    ];
    const btns = [...flow.querySelectorAll('button')];
    function pick(i) {
      btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      out.textContent = notes[i];
    }
    btns.forEach((b, i) => b.addEventListener('click', () => pick(i)));
    pick(0);
  })();

  // ---------------------------------------------------------------- reference tabs
  (function tabs() {
    const tabs = [...document.querySelectorAll('.mon-tab')];
    function select(t) {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        $(x.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = tabs[(i + d + tabs.length) % tabs.length];
        select(n); n.focus();
      });
    });
  })();

  // ---------------------------------------------------------------- panels: collapse, maximize, drag, remembered layout
  (function panels() {
    const grid = $('mon-grid');
    if (!grid) return;
    const KEY = 'ligo-monitor-layout';
    const all = () => [...grid.querySelectorAll('.mon-panel')];
    const original = all().map(p => p.dataset.panel);
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          order: all().map(p => p.dataset.panel),
          collapsed: all().filter(p => p.classList.contains('is-collapsed')).map(p => p.dataset.panel),
        }));
      } catch (_) {}
    };
    const redraw = () => window.dispatchEvent(new Event('resize'));
    for (const p of all()) {
      const head = p.querySelector('.mon-panel__head');
      const tools = document.createElement('div');
      tools.className = 'mon-panel__tools';
      tools.innerHTML = '<button type="button" class="mon-tool" data-act="collapse" aria-label="Collapse panel" title="Collapse">–</button>' +
        '<button type="button" class="mon-tool" data-act="max" aria-label="Maximize panel" title="Maximize">⤢</button>';
      head.appendChild(tools);
      head.draggable = true;
      head.title = 'Drag to move this panel';
      tools.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.act === 'collapse') {
          p.classList.toggle('is-collapsed');
          b.textContent = p.classList.contains('is-collapsed') ? '+' : '–';
          save();
        } else {
          const on = !p.classList.contains('is-max');
          all().forEach(q => q.classList.remove('is-max'));
          p.classList.toggle('is-max', on);
          document.body.classList.toggle('mon-has-max', on);
          b.textContent = on ? '⤡' : '⤢';
          redraw();
        }
      });
      head.addEventListener('dragstart', e => { p.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.dataset.panel); });
      head.addEventListener('dragend', () => { p.classList.remove('is-dragging'); all().forEach(q => q.classList.remove('is-over')); save(); redraw(); });
      p.addEventListener('dragover', e => { e.preventDefault(); p.classList.add('is-over'); });
      p.addEventListener('dragleave', () => p.classList.remove('is-over'));
      p.addEventListener('drop', e => {
        e.preventDefault();
        p.classList.remove('is-over');
        const src = grid.querySelector(`[data-panel="${e.dataTransfer.getData('text/plain')}"]`);
        if (!src || src === p) return;
        const kids = all();
        grid.insertBefore(src, kids.indexOf(src) < kids.indexOf(p) ? p.nextSibling : p);
      });
    }
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const m = grid.querySelector('.is-max');
      if (m) m.querySelector('[data-act="max"]').click();
    });
    const st = load();
    if (st.order) for (const id of st.order) { const el = grid.querySelector(`[data-panel="${id}"]`); if (el) grid.appendChild(el); }
    for (const id of st.collapsed || []) {
      const el = grid.querySelector(`[data-panel="${id}"]`);
      if (el) { el.classList.add('is-collapsed'); el.querySelector('[data-act="collapse"]').textContent = '+'; }
    }
    const reset = $('mon-layout-reset');
    if (reset) reset.addEventListener('click', () => {
      try { localStorage.removeItem(KEY); } catch (_) {}
      for (const id of original) grid.appendChild(grid.querySelector(`[data-panel="${id}"]`));
      all().forEach(p => { p.classList.remove('is-collapsed', 'is-max'); p.querySelector('[data-act="collapse"]').textContent = '–'; p.querySelector('[data-act="max"]').textContent = '⤢'; });
      document.body.classList.remove('mon-has-max');
      redraw();
    });
  })();

  // ---------------------------------------------------------------- clock and tape
  (function chrome() {
    const c = $('mon-clock');
    if (c) {
      const tick = () => { const d = new Date(); c.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); c.dateTime = d.toISOString(); };
      tick(); setInterval(tick, 1000);
    }
    const t = $('mon-tape');
    if (t) t.innerHTML += t.innerHTML;   // two copies so the scroll loops without a gap
  })();

  // redraw the canvas when the palette or size could change
  window.addEventListener('resize', () => { const e = $('c-sig'); if (e) e.dispatchEvent(new Event('input')); });
})();
