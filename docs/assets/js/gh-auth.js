/* GitHub sign-in (GitHub App kyoon-mit-site-login) and file reads from the private
   repository kyoon-mit/site-private. The token exchange runs on the Cloudflare Worker in
   auth-worker/; the access token is kept in this browser's localStorage. token() gives a
   current access token, renewing it when needed, or null; the blog editor uses it to publish. */
'use strict';
window.GHAUTH = (() => {
  const CLIENT_ID = 'Iv23liWHhUCCklDDkViM';
  const WORKER = 'https://kyoon-mit-site-login.kyoon-fbe.workers.dev';
  const REDIRECT_URI = 'https://kyoon-mit.github.io/auth/callback/';
  const REPO = 'kyoon-mit/site-private';
  const KEY = 'gh-site-token';   // localStorage: {access, exp, refresh, rexp}
  const FLOW = 'gh-site-flow';   // sessionStorage: {state, back}

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; }
  }
  function save(res) {
    const now = Date.now();
    localStorage.setItem(KEY, JSON.stringify({
      access: res.access_token,
      exp: now + (res.expires_in || 28800) * 1000,
      refresh: res.refresh_token || null,
      rexp: res.refresh_token_expires_in ? now + res.refresh_token_expires_in * 1000 : null,
    }));
  }
  // with an access token: only while that is still the stored one
  function signOut(access) {
    try {
      if (typeof access === 'string' && (read() || {}).access !== access) return;
      localStorage.removeItem(KEY);
    } catch (_) {}
  }
  const safeBack = p => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//')) ? p : '/';

  function signIn(back) {
    const a = crypto.getRandomValues(new Uint8Array(16));
    const state = Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(FLOW, JSON.stringify({ state, back: safeBack(back || location.pathname + location.hash) }));
    location.assign('https://github.com/login/oauth/authorize?' +
      new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, state }));
  }

  /* Errors: final (the Worker refused: a 4xx answer with its error) or not (no
     answer in 20 s, no connection, a server fault, an answer that is not the
     Worker's). A renewal is saved only while the sign-in it renewed is still
     stored. */
  async function exchange(path, body) {
    const fail = (msg, final) => Object.assign(new Error(msg), { final });
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 20000);
    let r, d = null;
    try {
      r = await fetch(WORKER + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: stop.signal,
      });
      const text = await r.text();
      try { d = JSON.parse(text); } catch (_) { d = null; }
    } catch (_) {
      throw fail('net', false);
    } finally {
      clearTimeout(timer);
    }
    if (!r.ok || !d || !d.access_token) {
      const refused = !!(d && d.error) && r.status >= 400 && r.status < 500 && r.status !== 429;
      throw fail((d && d.error) || 'net', refused);
    }
    if (path === '/refresh') {
      const now = read();
      if (!now || now.refresh !== body.refresh_token) throw fail('stale', false);
    }
    save(d);
  }

  /* Callback page: check state, trade the code, return the page to go back to. */
  async function finish(params) {
    let flow = null;
    try { flow = JSON.parse(sessionStorage.getItem(FLOW)); } catch (_) {}
    sessionStorage.removeItem(FLOW);
    if (!flow || !params.get('code') || params.get('state') !== flow.state) throw new Error('state');
    await exchange('/token', { code: params.get('code') });
    return safeBack(flow.back);
  }

  let renewing = null;  // one /refresh at a time: a refresh token works once
  /* null when signed out; throws 'net' when the Worker could not be reached (the
     sign-in is kept for a later try). */
  async function token() {
    const t = read();
    if (!t || !t.access) return null;
    if (Date.now() < t.exp - 60000) return t.access;
    let fault = null;
    if (t.refresh && (!t.rexp || Date.now() < t.rexp)) {
      if (!renewing) {
        renewing = exchange('/refresh', { refresh_token: t.refresh }).then(() => null, e => e);
        renewing.then(() => { renewing = null; });
      }
      fault = await renewing;
      if (!fault) { const n = read(); if (n && n.access) return n.access; }
    }
    // signed out meanwhile, or another tab renewed it
    const n = read();
    if (!n || !n.access) return null;
    if (Date.now() < n.exp - 60000) return n.access;
    if (fault && !fault.final) throw new Error('net');
    signOut();
    return null;
  }

  /* Errors: 'signin' (no valid token), 'denied' (no access to the file), 'net'. */
  async function get(path) {
    const tok = await token();
    if (!tok) throw new Error('signin');
    const url = `https://api.github.com/repos/${REPO}/contents/` + path.split('/').map(encodeURIComponent).join('/');
    let r;
    try {
      r = await fetch(url, { headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
    } catch (_) { throw new Error('net'); }
    if (r.status === 401) { signOut(); throw new Error('signin'); }
    if (r.status === 403 || r.status === 404) throw new Error('denied');
    if (!r.ok) throw new Error('net');
    return r;
  }

  return {
    signIn, finish, signOut, token,
    get signedIn() { return !!read(); },
    json: async path => (await get(path)).json(),
    blob: async (path, type) => new Blob([await (await get(path)).arrayBuffer()], { type: type || 'application/octet-stream' }),
  };
})();
