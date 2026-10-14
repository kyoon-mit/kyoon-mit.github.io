/* Thesis vault: PBKDF2 + AES-GCM decryption, remembered keys, and the notes reader. */
'use strict';
window.VAULT = (() => {
  const AAD = new TextEncoder().encode('thesis-vault-v1');
  const DB = 'thesis-vault', STORE = 'keys', REC = 'key';
  const TOKEN = 'thesis-session';
  const SESSION_MS = 12 * 3600 * 1000;
  let vault = null;

  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function loadVault() {
    if (vault) return vault;
    const r = await fetch('vault.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('net');
    vault = await r.json();
    return vault;
  }
  async function deriveKey(pw, v) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(v.salt), iterations: v.iter },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  async function decrypt(key, v) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(v.iv), additionalData: AAD }, key, b64(v.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  async function tryPassword(pw) {
    let v;
    try { v = await loadVault(); } catch (_) { return { ok: false, error: 'net' }; }
    try {
      const key = await deriveKey(pw, v);
      const data = await decrypt(key, v);
      return { ok: true, key, data };
    } catch (_) {
      return { ok: false, error: 'pw' };
    }
  }

  // ---------------------------------------------------------------- remembered key (IndexedDB, non-extractable)
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
        const tx = d.transaction(STORE, mode), st = tx.objectStore(STORE);
        const q = fn(st);
        tx.oncomplete = () => res(q && q.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
    } finally { d.close(); }
  }
  const getRec = () => idb('readonly', st => st.get(REC));
  const putRec = v => idb('readwrite', st => st.put(v, REC));
  const delRec = () => idb('readwrite', st => st.delete(REC)).catch(() => {});
  function randomToken() {
    const a = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
  }
  let memKey = null;
  async function remember(key, keep) {
    memKey = key;
    const v = await loadVault();
    const rec = { key, mode: keep ? 'persist' : 'session', salt: v.salt, at: Date.now() };
    try {
      if (!keep) {
        rec.token = randomToken();
        sessionStorage.setItem(TOKEN, rec.token);
      }
      await putRec(rec);
      return true;
    } catch (_) {
      return false;
    }
  }
  async function recall() {
    let rec;
    try { rec = await getRec(); } catch (_) { return null; }
    if (!rec || !rec.key) return null;
    let v;
    try { v = await loadVault(); } catch (_) { return null; }
    let bad = rec.salt !== v.salt;
    if (!bad && rec.mode === 'session') {
      let tok = null;
      try { tok = sessionStorage.getItem(TOKEN); } catch (_) {}
      bad = !tok || tok !== rec.token || Date.now() - rec.at > SESSION_MS;
    }
    if (bad) { await delRec(); return null; }
    try {
      const data = await decrypt(rec.key, v);
      memKey = rec.key;
      return data;
    } catch (_) {
      await delRec();
      return null;
    }
  }
  async function logout() {
    memKey = null;
    await delRec();
    try { sessionStorage.removeItem(TOKEN); } catch (_) {}
    location.replace(location.pathname);
  }

  // ---------------------------------------------------------------- reader
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  function inline(parent, s) {
    // `code`, $math$, [text](https://...)
    const re = /`([^`]+)`|\$([^$]+)\$|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) parent.appendChild(document.createTextNode(s.slice(last, m.index)));
      if (m[1] !== undefined) parent.appendChild(el('code', null, m[1]));
      else if (m[2] !== undefined) parent.appendChild(el('code', 'tex', '$' + m[2] + '$'));
      else { const a = el('a', null, m[3]); a.href = m[4]; a.rel = 'noopener noreferrer'; a.target = '_blank'; parent.appendChild(a); }
      last = re.lastIndex;
    }
    if (last < s.length) parent.appendChild(document.createTextNode(s.slice(last)));
  }
  function copyButton(pre, src) {
    const b = el('button', 'th-copy', 'Copy');
    b.type = 'button';
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(src); b.textContent = 'Copied'; } catch (_) { b.textContent = 'Select and copy'; }
      setTimeout(() => { b.textContent = 'Copy'; }, 1500);
    });
    pre.appendChild(b);
  }
  function renderMarkdown(src, into) {
    const lines = src.replace(/\r/g, '').split('\n');
    let i = 0, para = null;
    const stack = [];   // [{indent, ul}]
    const endPara = () => { para = null; };
    const endLists = () => { stack.length = 0; };
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        endPara(); endLists();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        const code = buf.join('\n');
        const pre = el('pre', 'th-pre');
        pre.appendChild(el('code', null, code));
        copyButton(pre, code);
        into.appendChild(pre);
        continue;
      }
      const h = /^(#{1,3})\s+(.*)$/.exec(line);
      if (h) { endPara(); endLists(); const e = el('h' + (h[1].length + 1)); inline(e, h[2]); into.appendChild(e); i++; continue; }
      const li = /^(\s*)[-*]\s+(.*)$/.exec(line);
      if (li) {
        endPara();
        const ind = li[1].replace(/\t/g, '  ').length;
        while (stack.length && stack[stack.length - 1].indent > ind) stack.pop();
        let top = stack[stack.length - 1];
        if (!top || top.indent < ind) {
          const ul = el('ul');
          if (top && top.ul.lastElementChild) top.ul.lastElementChild.appendChild(ul); else into.appendChild(ul);
          stack.push(top = { indent: ind, ul });
        }
        const item = el('li');
        inline(item, li[2]);
        top.ul.appendChild(item);
        i++; continue;
      }
      if (/^>\s?/.test(line)) { endPara(); endLists(); const q = el('blockquote'); inline(q, line.replace(/^>\s?/, '')); into.appendChild(q); i++; continue; }
      if (!line.trim()) { endPara(); endLists(); i++; continue; }
      endLists();
      if (!para) { para = el('p'); into.appendChild(para); } else para.appendChild(document.createTextNode(' '));
      inline(para, line.trim());
      i++;
    }
  }
  function show(data) {
    const gate = document.getElementById('gate'), root = document.getElementById('thesis');
    if (gate) gate.hidden = true;
    root.hidden = false;
    root.textContent = '';
    document.title = 'Thesis · Kyungseop Yoon';
    const head = el('header', 'th-head');
    head.appendChild(el('p', 'th-eyebrow', 'Thesis'));
    head.appendChild(el('h1', 'th-title', data.title || 'My unfinished LaTeX snippets'));
    const out = el('button', 'th-logout', 'Log out');
    out.type = 'button';
    out.addEventListener('click', logout);
    head.appendChild(out);
    root.appendChild(head);
    const body = el('div', 'th-body');
    const nav = el('nav', 'th-nav');
    nav.setAttribute('aria-label', 'Sections');
    const main = el('div', 'th-main');
    body.appendChild(nav); body.appendChild(main);
    root.appendChild(body);
    if (data.built) root.appendChild(el('p', 'th-built', 'Last encrypted ' + data.built + '.'));
    const sections = data.sections || [];
    const navBtns = {};
    function openSection(sec, article) {
      Object.values(navBtns).forEach(b => b.removeAttribute('aria-current'));
      if (navBtns[sec.id]) navBtns[sec.id].setAttribute('aria-current', 'true');
      if (location.hash !== '#' + sec.id) history.replaceState(null, '', '#' + sec.id);
      main.textContent = '';
      if (!article) {
        main.appendChild(el('h2', 'th-sec', sec.title));
        if (sec.note) { const n = el('div', 'th-note'); renderMarkdown(sec.note, n); main.appendChild(n); }
        const list = el('ul', 'th-list');
        (sec.articles || []).forEach(a => {
          const li = el('li');
          const b = el('button', 'th-link', a.title);
          b.type = 'button';
          b.addEventListener('click', () => openSection(sec, a));
          li.appendChild(b);
          if (a.kind === 'tex') li.appendChild(el('span', 'th-kind', 'LaTeX'));
          list.appendChild(li);
        });
        if (!(sec.articles || []).length) list.appendChild(el('li', 'th-empty', 'Nothing here yet.'));
        main.appendChild(list);
      } else {
        const back = el('button', 'th-back', '← ' + sec.title);
        back.type = 'button';
        back.addEventListener('click', () => openSection(sec));
        main.appendChild(back);
        const art = el('article', 'th-article');
        art.appendChild(el('h2', 'th-sec', article.title));
        if (article.kind === 'tex') {
          const pre = el('pre', 'th-pre');
          pre.appendChild(el('code', null, article.text));
          copyButton(pre, article.text);
          art.appendChild(pre);
        } else renderMarkdown(article.text, art);
        main.appendChild(art);
      }
      main.focus({ preventScroll: true });
    }
    sections.forEach(sec => {
      const b = el('button', 'th-navbtn', sec.title);
      b.type = 'button';
      b.addEventListener('click', () => openSection(sec));
      navBtns[sec.id] = b;
      nav.appendChild(b);
    });
    main.tabIndex = -1;
    const want = location.hash.slice(1);
    const first = sections.find(s => s.id === want) || sections[0];
    if (first) openSection(first);
    window.scrollTo(0, 0);
  }

  async function boot() {
    if (!window.crypto || !crypto.subtle) return false;
    const data = await recall();
    if (data) { show(data); return true; }
    return false;
  }
  return { tryPassword, remember, recall, logout, show, boot, get hasKey() { return !!memKey; } };
})();
