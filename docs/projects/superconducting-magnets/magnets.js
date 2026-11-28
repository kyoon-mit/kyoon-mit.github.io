/* Superconducting magnet section: GitHub sign-in or password gate, and the pages behind it.
   After GitHub sign-in the page data and files come from the private repository
   (build/magnets.json, written by tools/magnets_encrypt.py --plain); with the password they come
   from vault/site.json and vault/f/*.bin, decrypted here (PBKDF2 + AES-GCM). Routes live in the URL fragment: #/documentation/slides, #/updates/<slug>, ... */
'use strict';
(() => {
  const root = document.getElementById('mg');
  if (!root) return;
  const VAULT = root.dataset.vault;
  const ICONS = root.dataset.icons;
  const GLOSSARY_JS = root.dataset.glossary;
  const KATEX = JSON.parse(root.dataset.katex);
  const AAD = 'magnets-vault-v1';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const DB = 'magnets-vault', STORE = 'keys', REC = 'key';
  const gate = document.getElementById('mg-gate');
  const app = document.getElementById('mg-app');
  const crumbs = document.getElementById('mg-crumbs');
  let head = null, key = null, data = null;
  const blobs = new Map();

  // ------------------------------------------------------------------ crypto
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function loadHead() {
    if (head) return head;
    const r = await fetch(VAULT + 'site.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('net');
    head = await r.json();
    return head;
  }
  async function deriveKey(pw, h) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(h.salt), iterations: h.iter },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  async function openVault(k, h) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(h.iv), additionalData: enc.encode(AAD) }, k, b64(h.ct));
    return JSON.parse(dec.decode(pt));
  }
  async function fileUrl(id) {
    if (blobs.has(id)) return blobs.get(id);
    const meta = data.files[id];
    if (!meta) throw new Error('missing');
    if (meta.path) {
      const gh = URL.createObjectURL(await GHAUTH.blob(meta.path, meta.type));
      blobs.set(id, gh);
      return gh;
    }
    const r = await fetch(VAULT + 'f/' + id + '.bin');
    if (!r.ok) throw new Error('net');
    const buf = new Uint8Array(await r.arrayBuffer());
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12), additionalData: enc.encode(AAD + '/' + id) },
      key, buf.slice(12));
    const url = URL.createObjectURL(new Blob([pt], { type: meta.type }));
    blobs.set(id, url);
    return url;
  }

  // ------------------------------------------------------------------ remembered key (IndexedDB, non-extractable)
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idb(mode, fn) {
    const d = await db();
    try {
      return await new Promise((res, rej) => {
        const tx = d.transaction(STORE, mode), q = fn(tx.objectStore(STORE));
        tx.oncomplete = () => res(q && q.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
    } finally { d.close(); }
  }
  const getRec = () => idb('readonly', st => st.get(REC)).catch(() => null);
  const putRec = v => idb('readwrite', st => st.put(v, REC)).catch(() => {});
  const delRec = () => idb('readwrite', st => st.delete(REC)).catch(() => {});

  // ------------------------------------------------------------------ helpers
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ymd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmtLong = s => { const d = ymd(s); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
  const fmtShort = s => { const d = ymd(s); return `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
  const size = n => n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' kB';

  function card(href, icon, title, detail) {
    return `<a class="card mg-card" href="${href}">
      <span class="card__media"><img src="${ICONS}${icon}.svg" alt="">
        <span class="card__wash"><span class="card__detail">${esc(detail)}</span><span class="card__cta">Open</span></span></span>
      <span class="card__body"><span class="card__title">${esc(title)}</span></span></a>`;
  }
  function pageHead(title, lede, eyebrow) {
    return `<header class="page__head">${eyebrow ? `<p class="page__eyebrow">${eyebrow}</p>` : ''}
      <h1 class="page__title">${esc(title)}</h1>${lede ? `<p class="page__lede">${esc(lede)}</p>` : ''}</header>`;
  }
  function setCrumbs(trail) {
    const parts = [`<a href="${root.dataset.home}">Home</a>`];
    trail.forEach(([label, href], i) => {
      parts.push('<span aria-hidden="true">/</span>');
      parts.push(i === trail.length - 1 || !href ? `<span aria-current="page">${esc(label)}</span>` : `<a href="${href}">${esc(label)}</a>`);
    });
    crumbs.innerHTML = parts.join('');
  }
  const TOP = ['Superconducting magnet control', '#/'];

  // ------------------------------------------------------------------ side menu
  function subnav(path) {
    const cur = p => (path === p || (p !== '' && path.startsWith(p + '/'))) ? ' is-current' : '';
    const li = (p, label, sub) => `<li><a class="subnav__link${cur(p)}" href="#/${p}">${label}</a>${sub || ''}</li>`;
    const sub = items => `<ul class="subnav__sub">${items.map(([p, l]) => li(p, l)).join('')}</ul>`;
    return `<nav class="subnav" aria-label="Project sections"><p class="subnav__label">Superconducting Magnets</p>
      <ul class="subnav__list">
        <li><a class="subnav__link${path === '' ? ' is-current' : ''}" href="#/">Home</a></li>
        ${li('documentation', 'Documentation', sub([['documentation/slides', 'Slides'], ['documentation/proposals', 'Proposals'],
          ['documentation/papers', 'Papers'], ['documentation/readings', 'Additional readings']]))}
        ${li('updates', 'Updates')}
        ${li('models', 'Models')}
        ${li('data', 'Data')}
        ${li('overview', 'Overview', sub([['background', 'Background'], ['definitions', 'Definitions'], ['brainstorm', 'Brainstorm'], ['results', 'Results']]))}
      </ul>
      <p class="mg-signout"><button type="button" class="mg-link" id="mg-signout">Sign out</button></p></nav>`;
  }
  function layout(path, body) {
    app.innerHTML = `<div class="doc__layout"><aside class="doc__aside">${subnav(path)}</aside>
      <article class="doc__body">${body}</article></div>`;
    document.getElementById('mg-signout').addEventListener('click', signOut);
  }

  // ------------------------------------------------------------------ plan diagram (hub)
  const ext = h => h.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : '';
  const kind = k => ' mg-k--' + esc(k || 'model');
  function planLinks(links) {
    return links && links.length ? `<p class="mg-plan__links">${links.map(l =>
      `<a href="${esc(l.href)}"${ext(l.href)}>${esc(l.label)}</a>`).join('')}</p>` : '';
  }
  function planBlock(b) {
    if (b.group) {
      return `<div class="mg-plan__block mg-plan__group">
        <div class="mg-plan__row">${b.group.map(g => `<span class="mg-plan__box${kind(g.kind)}">${esc(g.label)}</span>`).join('')}</div>
        ${b.note ? `<p class="mg-plan__note">${esc(b.note)}</p>` : ''}
        ${b.mit_note ? `<p class="mg-plan__mit">${esc(b.mit_note)}</p>` : ''}
        ${b.side ? `<p class="mg-plan__note">With <span class="mg-plan__box${kind(b.side.kind)}">${esc(b.side.label)}</span></p>` : ''}
        ${planLinks(b.links)}</div>`;
    }
    return `<div class="mg-plan__block${kind(b.kind)}${b.mit ? ' is-mit' : ''}">
      <p class="mg-plan__label">${esc(b.label)}${b.mit ? ' <span class="mg-plan__chip">MIT addition</span>' : ''}</p>
      ${b.owner ? `<p class="mg-plan__owner">${esc(b.owner)}</p>` : ''}
      ${b.to ? `<p class="mg-plan__to">→ ${esc(b.to)}</p>` : ''}
      ${b.note ? `<p class="mg-plan__note">${esc(b.note)}</p>` : ''}
      ${planLinks(b.links)}</div>`;
  }
  function planPanel(p) {
    const sep = p.flow ? '<span class="mg-plan__arrow" aria-hidden="true">↓</span>' : '';
    return `<section class="mg-plan__panel${p.flow ? ' is-flow' : ''}"><h3 class="mg-plan__title">${esc(p.title)}</h3>
      <div class="mg-plan__blocks">${(p.blocks || []).map(planBlock).join(sep)}</div></section>`;
  }
  function planHtml(p) {
    if (!p) return '';
    return `<section class="mg-plan" aria-label="${esc(p.title || 'The plan')}">
      <div class="mg-plan__head"><h2 class="mg-plan__h">${esc(p.title || 'The plan')}</h2>
        ${p.original ? `<a href="${esc(p.original.href)}"${ext(p.original.href)}>${esc(p.original.label)}</a>` : ''}</div>
      ${p.source ? `<p class="mg-plan__src">${esc(p.source)}</p>` : ''}
      ${(p.top || []).length ? `<div class="mg-plan__top">${p.top.map(planBlock).join('')}</div>` : ''}
      <div class="mg-plan__cols">${(p.columns || []).map(col => `<div class="mg-plan__col">${col.map(planPanel).join('')}</div>`).join('')}</div>
      <p class="mg-plan__legend"><span class="mg-plan__box mg-k--object">magnet or measurement</span>
        <span class="mg-plan__box mg-k--model">model or processing</span>
        <span class="mg-plan__box mg-k--surrogate">surrogate or dataset</span>
        <span class="mg-plan__box mg-k--surrogate is-mit">MIT addition</span></p>
    </section>`;
  }

  // ------------------------------------------------------------------ views
  function viewHub() {
    setCrumbs([[TOP[0]]]);
    const ov = data.pages.overview || {};
    app.innerHTML = `${pageHead(ov.title || TOP[0], ov.summary, esc(ov.eyebrow || 'Current project'))}
      ${planHtml(data.plan)}
      <h2 class="mg-plan__h mg-sections__h">Sections</h2>
      <div class="grid mg-grid">
        ${card('#/documentation', 'documentation', 'Documentation', 'Slides from the Genesis meetings, proposals, papers and additional readings.')}
        ${card('#/updates', 'updates', 'Updates', 'Dated research log of my own work.')}
        ${card('#/models', 'models', 'Models', 'Simulation and surrogate models. Not set up yet.')}
        ${card('#/data', 'data', 'Data', 'Datasets. Not set up yet.')}
      </div>
      <p class="mg-older">Earlier pages: <a href="#/overview">Overview</a> · <a href="#/background">Background</a> ·
        <a href="#/definitions">Definitions</a> · <a href="#/brainstorm">Brainstorm</a> · <a href="#/results">Results</a></p>
      <p class="mg-signout"><button type="button" class="mg-link" id="mg-signout">Sign out</button></p>`;
    document.getElementById('mg-signout').addEventListener('click', signOut);
  }
  function viewDocs() {
    setCrumbs([TOP, ['Documentation']]);
    const n = data.meetings.reduce((a, m) => a + m.talks.length, 0);
    app.innerHTML = `${pageHead('Documentation')}
      <div class="grid mg-grid">
        ${card('#/documentation/slides', 'slides', 'Slides', `Decks from the Genesis MIT meeting and the Genesis Digital Twin meeting, on a calendar, with notes. ${n} deck${n === 1 ? '' : 's'}.`)}
        ${card('#/documentation/proposals', 'proposals', 'Proposals', 'Nothing here yet.')}
        ${card('#/documentation/papers', 'papers', 'Papers', 'Nothing here yet.')}
        ${card('#/documentation/readings', 'readings', 'Additional readings', 'Nothing here yet.')}
      </div>`;
  }
  function viewEmpty(path, trail, title, text) {
    setCrumbs(trail);
    layout(path, `${pageHead(title)}<div class="prose"><p>${esc(text)}</p></div>`);
  }

  function viewData() {
    setCrumbs([TOP, ['Data']]);
    const ds = data.datasets || [];
    const items = ds.map(d => `<li class="mg-talk">
        <p class="mg-talk__title">${esc(d.title)}</p>
        ${d.source ? `<p class="mg-talk__who">${esc(d.source)}</p>` : ''}
        ${d.description ? `<p class="mg-data__desc">${esc(d.description)}</p>` : ''}
        ${d.url ? `<p class="mg-talk__files"><a class="mg-btn mg-btn--quiet" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Open on Google Drive${d.size ? ' · ' + esc(d.size) : ''}</a></p>` : ''}
      </li>`).join('');
    layout('data', `${pageHead('Data', ds.length ? 'Datasets, kept on Google Drive and linked here.' : '')}
      ${ds.length ? `<ul class="mg-talks mg-data">${items}</ul>` : '<div class="prose"><p>Not set up yet.</p></div>'}`);
  }

  function monthGrid(y, m, byDay) {
    const first = new Date(Date.UTC(y, m, 1));
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;  // Monday first
    let cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span class="mg-cal__wd">${d[0]}</span>`).join('');
    for (let i = 0; i < lead; i++) cells += '<span class="mg-cal__day mg-cal__day--pad"></span>';
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = byDay[key] || [];
      if (evs.length) {
        const s = evs.map(e => e.series).join(' ');
        const title = evs.map(e => (data.series[e.series] || {}).name || e.series).join(', ');
        cells += `<a class="mg-cal__day mg-cal__day--has" href="#/documentation/slides#ev-${evs[0].id}" title="${esc(title)}, ${fmtShort(key)}">
          ${d}<span class="mg-cal__dots">${evs.map(e => `<span class="mg-dot mg-dot--${esc(e.series)}"></span>`).join('')}</span></a>`;
        void s;
      } else {
        cells += `<span class="mg-cal__day">${d}</span>`;
      }
    }
    return `<div class="mg-cal__month"><p class="mg-cal__title">${MONTHS[m]} ${y}</p><div class="mg-cal__grid">${cells}</div></div>`;
  }
  function viewSlides() {
    setCrumbs([TOP, ['Documentation', '#/documentation'], ['Slides']]);
    const ms = data.meetings;
    const byDay = {};
    ms.forEach(m => (byDay[m.date] = byDay[m.date] || []).push(m));
    const months = [...new Set(ms.map(m => m.date.slice(0, 7)))].sort().reverse();
    const legend = Object.entries(data.series).map(([k, s]) =>
      `<span class="mg-legend__item"><span class="mg-dot mg-dot--${esc(k)}"></span>${esc(s.name)} · ${esc(s.when || '')}</span>`).join('');
    const grids = months.map(ym => { const [y, m] = ym.split('-').map(Number); return monthGrid(y, m - 1, byDay); }).join('');
    const list = months.map(ym => {
      const [y, m] = ym.split('-').map(Number);
      const evs = ms.filter(e => e.date.startsWith(ym));
      return `<section class="mg-month"><h2 class="mg-month__title">${MONTHS[m - 1]} ${y}</h2><ol class="mg-events">${evs.map(eventHtml).join('')}</ol></section>`;
    }).join('');
    layout('documentation/slides', `${pageHead('Slides', 'Decks shown at the Genesis MIT meeting (Wednesdays) and the Genesis Digital Twin meeting (Fridays), newest first. Notes from the meeting are under each deck.')}
      <div class="mg-legend">${legend}</div>
      <div class="mg-cal">${grids}</div>
      ${list || '<p>No meetings yet.</p>'}`);
    app.querySelectorAll('button[data-file]').forEach(b => b.addEventListener('click', onFile));
  }
  function notesHtml(notes, label) {
    if (!notes || !notes.length) return '';
    return `<div class="mg-notes"><p class="mg-notes__label">${label}</p><ul>${notes.map(n =>
      `<li${/:\s*$/.test(n) ? ' class="mg-notes__lead"' : ''}>${esc(n)}</li>`).join('')}</ul></div>`;
  }
  function eventHtml(e) {
    const d = ymd(e.date), s = data.series[e.series] || { name: e.series };
    const talks = e.talks.map(t => `<li class="mg-talk">
        <p class="mg-talk__title">${esc(t.title)}</p>
        ${t.speakers ? `<p class="mg-talk__who">${esc(t.speakers)}</p>` : ''}
        ${t.file ? `<p class="mg-talk__files">
          <button type="button" class="mg-btn" data-file="${esc(t.file.id)}" data-act="view">View PDF</button>
          <button type="button" class="mg-btn mg-btn--quiet" data-file="${esc(t.file.id)}" data-act="save">Download PDF · ${size(t.file.size)}</button>
          ${(t.extra || []).map(x => `<button type="button" class="mg-btn mg-btn--quiet" data-file="${esc(x.id)}" data-act="save">${esc(x.label)} · ${size(x.size)}</button>`).join('')}
          ${(t.links || []).map(x => `<a class="mg-btn mg-btn--quiet" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a>`).join('')}</p>` : ''}
        ${notesHtml(t.notes, 'Notes')}
      </li>`).join('');
    return `<li class="mg-event" id="ev-${esc(e.id)}">
      <div class="mg-event__date"><span class="mg-event__day">${d.getUTCDate()}</span><span class="mg-event__wd">${WD[d.getUTCDay()]}</span></div>
      <div class="mg-event__body">
        <p class="mg-event__series"><span class="mg-dot mg-dot--${esc(e.series)}"></span>${esc(s.name)}${s.time ? ` <span class="mg-event__time">${esc(s.time)}</span>` : ''}</p>
        ${e.title ? `<p class="mg-event__title">${esc(e.title)}</p>` : ''}
        <ul class="mg-talks">${talks}</ul>
        ${notesHtml(e.notes, 'Meeting notes')}
      </div></li>`;
  }
  async function onFile(ev) {
    const b = ev.currentTarget, id = b.dataset.file, meta = data.files[id];
    const w = b.dataset.act === 'view' ? window.open('', '_blank') : null;
    const label = b.textContent;
    b.disabled = true; b.textContent = 'Decrypting…';
    try {
      const url = await fileUrl(id);
      if (w) { w.opener = null; w.location.href = url; }
      else {
        const a = document.createElement('a');
        a.href = url; a.download = meta.name; document.body.appendChild(a); a.click(); a.remove();
      }
    } catch (_) {
      if (w) w.close();
      b.textContent = 'Could not open'; setTimeout(() => { b.textContent = label; b.disabled = false; }, 2500);
      return;
    }
    b.textContent = label; b.disabled = false;
  }

  function viewUpdates() {
    setCrumbs([TOP, ['Updates']]);
    const ups = data.updates.slice().reverse();
    const years = [...new Set(ups.map(u => u.date.slice(0, 4)))];
    const cal = years.map(y => {
      const cells = MONTHS.map((name, i) => {
        const mm = String(i + 1).padStart(2, '0');
        const n = ups.filter(u => u.date.startsWith(`${y}-${mm}`)).length;
        return n ? `<a class="cal__cell cal__cell--has" href="#/updates#y${y}m${mm}" title="${name.slice(0, 3)} ${y}, ${n} update${n === 1 ? '' : 's'}"><abbr>${name.slice(0, 3)}</abbr><span class="cal__n">${n}</span></a>`
          : `<span class="cal__cell cal__cell--empty" aria-hidden="true"><abbr>${name.slice(0, 3)}</abbr></span>`;
      }).join('');
      return `<div class="cal__row"><span class="cal__year">${y}</span><div class="cal__months">${cells}</div></div>`;
    }).join('');
    const tree = years.map((y, yi) => {
      const items = ups.filter(u => u.date.startsWith(y));
      const months = [...new Set(items.map(u => u.date.slice(5, 7)))];
      return `<details class="tree__year"${yi === 0 ? ' open' : ''}><summary>${y}<span class="tree__count">${items.length} entr${items.length === 1 ? 'y' : 'ies'}</span></summary>
        ${months.map(mm => {
          const its = items.filter(u => u.date.slice(5, 7) === mm);
          return `<details class="tree__month" id="y${y}m${mm}" open><summary>${MONTHS[Number(mm) - 1]}<span class="tree__count">${its.length}</span></summary>
            <ul class="tree__list">${its.map(u => `<li class="tree__item"><a class="tree__link" href="#/updates/${esc(u.slug)}">
              <span class="tree__meta"><span class="tree__title">${esc(u.title)}${u.talk ? ' <span class="tag">Talk</span>' : ''}</span>
              <time class="tree__date" datetime="${esc(u.date)}">${fmtShort(u.date)}</time></span>
              ${u.summary ? `<span class="tree__summary">${esc(u.summary)}</span>` : ''}</a></li>`).join('')}</ul></details>`;
        }).join('')}</details>`;
    }).join('');
    layout('updates', `${pageHead('Updates', 'Dated snapshots of the work in progress. Pick a month from the calendar, or browse the index below it.', 'Research log')}
      <section class="cal" aria-label="Updates by month"><p class="cal__legend">${ups.length} update${ups.length === 1 ? '' : 's'} · filled months link to that month's entries</p>${cal}</section>
      <div class="tree">${tree}</div>`);
  }
  function viewUpdate(slug) {
    const all = data.updates, i = all.findIndex(u => u.slug === slug);
    if (i < 0) return viewMissing();
    const u = all[i];
    setCrumbs([TOP, ['Updates', '#/updates'], [fmtShort(u.date)]]);
    const prev = all[i - 1], next = all[i + 1];
    const talk = u.talk ? `<aside class="talk" aria-label="Talk"><p class="talk__kind">Talk · ${esc(u.talk.venue)}</p>
      <p class="talk__title">${esc(u.talk.title)}</p>${u.talk.about ? `<p class="talk__about">${esc(u.talk.about)}</p>` : ''}</aside>` : '';
    layout('updates', `${pageHead(u.title, u.summary, `<time datetime="${esc(u.date)}">${fmtLong(u.date)}</time>`)}${talk}
      <div class="prose">${u.html}</div>
      <nav class="pager pager--split">
        ${prev ? `<a class="pager__prev" href="#/updates/${esc(prev.slug)}"><span class="pager__label">Previous update</span><span class="pager__title">${esc(prev.title)}</span></a>` : '<span></span>'}
        ${next ? `<a class="pager__next" href="#/updates/${esc(next.slug)}"><span class="pager__label">Next update</span><span class="pager__title">${esc(next.title)}</span></a>` : ''}
      </nav>`);
    return true;
  }
  function viewPage(id, label) {
    const p = data.pages[id];
    if (!p) return viewMissing();
    setCrumbs(id === 'overview' ? [TOP, ['Overview']] : [TOP, ['Overview', '#/overview'], [label || p.title]]);
    layout(id, `${pageHead(p.title, p.summary, p.eyebrow ? esc(p.eyebrow) : '')}<div class="prose">${p.html}</div>`);
    return true;
  }
  function viewDefinitions() {
    setCrumbs([TOP, ['Overview', '#/overview'], ['Definitions']]);
    const order = ['Superconductors', 'Runaway and protection', 'Coils', 'Simulation', 'Machine learning', 'Statistics', 'This project'];
    const groups = order.concat([...new Set(data.glossary.map(t => t.g))].filter(g => !order.includes(g)));
    const body = groups.map(g => {
      const ts = data.glossary.filter(t => t.g === g).sort((a, b) => a.n.localeCompare(b.n, undefined, { sensitivity: 'base' }));
      if (!ts.length) return '';
      return `<section class="glossary__group"><h2 id="${esc(g.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${esc(g)}</h2><dl class="glossary">
        ${ts.map(t => `<dt id="${esc(t.id)}">${esc(t.n)}${t.a.length ? ` <span class="glossary__also">(${esc(t.a.join(', '))})</span>` : ''}</dt>
          <dd>${t.d}<div class="glossary__source">Source: ${t.src}</div></dd>`).join('')}</dl></section>`;
    }).join('');
    layout('definitions', `${pageHead('Definitions', 'The terms used on these pages, in plain language, each with a source. On every other page of this section, the first appearance of a term links here; resting the pointer on it for a second shows the short definition.', 'Glossary')}
      <div class="prose">${body}</div>`);
  }
  function viewMissing() {
    setCrumbs([TOP, ['Not found']]);
    layout('', `${pageHead('Not found')}<div class="prose"><p>No such page here. <a href="#/">Back to the section</a>.</p></div>`);
  }

  // ------------------------------------------------------------------ after each view: figures, math, glossary
  async function finish(path) {
    app.querySelectorAll('img[data-vault]').forEach(async img => {
      try { img.src = await fileUrl(img.dataset.vault); } catch (_) { img.alt = '(figure could not be decrypted)'; }
    });
    app.querySelectorAll('a[data-vault-href]').forEach(a => {
      a.target = '_blank'; a.rel = 'noopener';
      fileUrl(a.dataset.vaultHref).then(u => { a.href = u; }).catch(() => {});
    });
    if (app.querySelector('.prose') && /\$|\\\(|\\\[/.test(app.querySelector('.prose').textContent)) {
      try { await loadKatex(); window.renderMathInElement(app, KATEX.opts); } catch (_) { /* math stays as TeX */ }
    }
    if (path !== 'definitions' && data.glossary.length && app.querySelector('.doc__body .prose')) {
      document.querySelectorAll('.term-tip').forEach(t => t.remove());
      window.BNS_GLOSSARY = data.glossary.map(t => ({ id: t.id, n: t.n, a: t.a, c: t.c, o: t.o, s: t.s }));
      window.BNS_GLOSSARY_URL = '#/definitions/';
      const s = document.createElement('script');
      s.src = GLOSSARY_JS;
      document.body.appendChild(s);
      s.onload = () => s.remove();
    }
  }
  let katexReady = null;
  function loadKatex() {
    if (katexReady) return katexReady;
    const add = (src, integrity) => new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.integrity = integrity; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = KATEX.css[0]; css.integrity = KATEX.css[1]; css.crossOrigin = 'anonymous';
    document.head.appendChild(css);
    katexReady = add(KATEX.js[0], KATEX.js[1]).then(() => add(KATEX.auto[0], KATEX.auto[1]));
    return katexReady;
  }

  // ------------------------------------------------------------------ router
  function parse() {
    const h = location.hash || '#/';
    if (!h.startsWith('#/')) return null;
    const rest = h.slice(2), j = rest.indexOf('#');
    return { path: (j < 0 ? rest : rest.slice(0, j)).replace(/\/+$/, ''), anchor: j < 0 ? '' : decodeURIComponent(rest.slice(j + 1)) };
  }
  let current = '';
  function route() {
    if (!data) return;
    const r = parse();
    if (!r) {  // a plain #id inside a page: keep the page, scroll to the id
      const id = decodeURIComponent(location.hash.slice(1));
      history.replaceState(null, '', `#/${current}#${encodeURIComponent(id)}`);
      return scrollTo(id);
    }
    const { path, anchor } = r;
    const same = path === current && app.childElementCount;
    if (!same) {
      const p = path.split('/');
      if (path === '') viewHub();
      else if (path === 'documentation') viewDocs();
      else if (path === 'documentation/slides') viewSlides();
      else if (path === 'documentation/proposals') viewEmpty(path, [TOP, ['Documentation', '#/documentation'], ['Proposals']], 'Proposals', 'Nothing here yet.');
      else if (path === 'documentation/papers') viewEmpty(path, [TOP, ['Documentation', '#/documentation'], ['Papers']], 'Papers', 'Nothing here yet.');
      else if (path === 'documentation/readings') viewEmpty(path, [TOP, ['Documentation', '#/documentation'], ['Additional readings']], 'Additional readings', 'Nothing here yet.');
      else if (path === 'models') viewEmpty(path, [TOP, ['Models']], 'Models', 'Not set up yet.');
      else if (path === 'data') viewData();
      else if (path === 'updates') viewUpdates();
      else if (p[0] === 'updates' && p.length === 2) viewUpdate(p[1]);
      else if (path === 'definitions') viewDefinitions();
      else if (['overview', 'background', 'brainstorm', 'results'].includes(path)) viewPage(path);
      else viewMissing();
      current = path;
      const t = app.querySelector('.page__title');
      document.title = (t ? t.textContent + ' · ' : '') + root.dataset.siteTitle;
      finish(path);
    }
    if (anchor) setTimeout(() => scrollTo(anchor), same ? 0 : 50);
    else if (!same) window.scrollTo(0, 0);
  }
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    for (let n = el; n; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true;
    el.scrollIntoView({ block: 'start' });
  }

  // ------------------------------------------------------------------ gate
  function show(d, k) {
    data = d; key = k;
    gate.hidden = true; app.hidden = false;
    route();
  }
  async function signOut() {
    if (window.GHAUTH) GHAUTH.signOut();
    await delRec();
    blobs.forEach(u => URL.revokeObjectURL(u));
    location.replace(location.pathname);
  }
  const form = document.getElementById('mg-form'), pw = document.getElementById('mg-pw');
  const keep = document.getElementById('mg-keep'), msg = document.getElementById('mg-msg'), btn = document.getElementById('mg-open');
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!pw.value) return;
    btn.disabled = true; msg.textContent = 'Opening…';
    let h;
    try { h = await loadHead(); } catch (_) { msg.textContent = 'Could not load the page data. Check the connection and try again.'; btn.disabled = false; return; }
    try {
      const k = await deriveKey(pw.value, h);
      const d = await openVault(k, h);
      pw.value = ''; msg.textContent = '';
      if (keep.checked) await putRec({ k, salt: h.salt });
      show(d, k);
    } catch (_) {
      msg.textContent = 'Wrong password.';
      pw.select();
    }
    btn.disabled = false;
  });
  const gh = document.getElementById('mg-gh');
  if (gh) gh.addEventListener('click', () => GHAUTH.signIn(location.pathname + location.hash));
  window.addEventListener('hashchange', route);

  (async () => {
    if (window.GHAUTH && GHAUTH.signedIn) {
      try { show(await GHAUTH.json('build/magnets.json'), null); return; }
      catch (e) { if (e.message !== 'signin') msg.textContent = e.message === 'denied' ? 'This GitHub account cannot open this section.' : 'Could not load the page data from GitHub. Try again.'; }
    }
    if (!window.crypto || !crypto.subtle) { msg.textContent = 'This browser cannot decrypt the page (it needs Web Crypto over HTTPS).'; gate.hidden = false; return; }
    try {
      const [h, rec] = await Promise.all([loadHead(), getRec()]);
      if (rec && rec.k && rec.salt === h.salt) {
        try { show(await openVault(rec.k, h), rec.k); return; } catch (_) { await delRec(); }
      }
    } catch (_) { /* fall through to the gate */ }
    gate.hidden = false;
    pw.focus();
  })();
})();
