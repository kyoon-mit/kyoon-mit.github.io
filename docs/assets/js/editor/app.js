// The blog editor (/blog/edit/, docs/blog/edit.html): write a post in the
// browser with the site's own styles, keep drafts in this browser, and
// publish to the site's repository on GitHub with the owner's token.
import {EditorState, NodeSelection, TextSelection, Selection} from '../../vendor/prosemirror/state.js';
import {EditorView} from '../../vendor/prosemirror/view.js';
import {Slice, Fragment, DOMSerializer} from '../../vendor/prosemirror/model.js';
import {fixTables} from '../../vendor/prosemirror/tables.js';
import {schema, safeHref, PENS} from './schema.js';
import {plugins, insertAtom, insertBlock, linkRange, cursorAfter} from './commands.js';
import {MathView, CodeBlockView, FigureView, FootnoteView} from './views.js';
import {buildToolbar, PEN_NAMES} from './toolbar.js';
import {el, button, popover, closePopover} from './ui.js';
import {GitHub} from './github.js';
import * as store from './store.js';
import {emptyMeta, parsePost, postFile, newSlug, addressOf, splitFile, cleanURL, webURL, descriptionProblem, visible, POST_NAME, RESERVED, stamp} from './format.js';
import {renderTex} from './math.js';

const N = schema.nodes, M = schema.marks;
const root = document.getElementById('ed');
const $ = s => root.querySelector(s);
const $$ = s => [...root.querySelectorAll(s)];
const REPO = root.dataset.repo, BRANCH = root.dataset.branch, BASE = root.dataset.base.replace(/\/$/, '');
const BLOG = JSON.parse(document.getElementById('ed-blog-data').textContent);
const POSTS = 'docs/_posts', IMAGES = 'docs/assets/img/blog';
const TOKEN = 'blog-editor-token', OWNER = 'blog-editor';

let gh = null, login = '';
// the open post: {id (draft key), path (on GitHub, or null), baseSha (the
// GitHub version the edits start from), public (that version is on the
// site), meta, slug, slugTouched, dirty (unpublished changes)}
let cur = null;
let inner = null;        // a footnote's editor while it has focus
let saveTimer = null, maxTimer = null, saving = 0;
// busyNow: a publish, delete or discard is talking to GitHub; readOnly:
// another tab holds the post; loading: another post is on its way in
let busyNow = false, busyURL = '', readOnly = false, loading = false;
let navSeq = 0;          // each navigation's number; a late one stops itself
let lastError = 0;
let externalPaste = false;  // the paste being read came from outside the editor
const TAB = store.randomId();
const urls = new Map();  // image src -> object URL, for images not on the site yet
const uploaded = new Set();  // site paths of images published from this page
const BACKUP = 'blog-editor-unsaved:';  // + draft id: the last edits, kept when the page closes

const app = {
  activeView: () => inner || view,
  canEdit: () => canEdit(),
  setInner(v) {
    inner = v;
    toolbar.update(app.activeView().state);
  },
  refreshToolbar: () => toolbar.update(app.activeView().state),
  notify: text => status(text, 'error'),
  justUploaded: src => uploaded.has(src),
  inners: new Set(),     // the open footnote editors
  pastedHTML: html => pastedHTML(html, true),
  editMath, editLink, editAlt, imageURL, insertMath, insertFootnote,
  pickImages: () => picker.click(),
};

// --- the editor -----------------------------------------------------------------

const PLUGINS = plugins(app);
const emptyDoc = () => schema.node('doc', null, [schema.node('paragraph')]);

function makeState(doc) {
  const state = EditorState.create({doc, plugins: PLUGINS});
  const fix = fixTables(state);
  return fix ? state.apply(fix.setMeta('addToHistory', false)) : state;
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'];
const imageFilesIn = dt => (dt ? [...dt.files].filter(f => f.type.startsWith('image/')) : []);

// Pasted pages: a small picture inside a line of text (an icon, an emoji, a
// formula drawn as an image) is not a figure; it becomes its alt text, or
// math when it is one of Wikipedia's formula images.
const INLINE = /^(A|ABBR|B|BDI|BDO|CITE|CODE|DATA|DEL|DFN|EM|FONT|I|INS|KBD|LABEL|MARK|PICTURE|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR)$/;
const lineText = (n, skip) => (n.nodeType === 3 ? n.data
  : n.nodeType === 1 && n !== skip && INLINE.test(n.tagName) ? [...n.childNodes].map(c => lineText(c, skip)).join('') : '');
function inLine(img) {
  let box = img.parentElement;
  while (box && INLINE.test(box.tagName)) box = box.parentElement;
  return !!box && [...box.childNodes].some(n => lineText(n, img).trim());
}
// an icon, emoji or badge: no taller than a line (or, with only a width,
// no wider than 64 px), a tiny inline image, or the word in its class or
// file name (a known large size wins)
function small(img) {
  const px = v => (/^\s*\d+(px)?\s*$/.test(v || '') ? parseInt(v, 10) : 0);
  const w = px(img.getAttribute('width')), h = px(img.getAttribute('height'));
  if (h) return h <= 64;
  if (w) return w <= 64;
  const src = img.getAttribute('src') || '';
  if (/^data:/i.test(src) && src.length < 2000) return true;
  const words = `${img.className} ${src.split(/[?#]/)[0].split('/').pop()}`.toLowerCase().split(/[^a-z]+/);
  return words.some(w2 => ['emoji', 'icon', 'icons', 'smiley', 'emoticon'].includes(w2));
}
const displaystyle = t => t.replace(/^\{\\displaystyle\s*([\s\S]*)\}$/, '$1').trim();
const BLOCKS = 'p, div, li, dt, dd, h1, h2, h3, h4, h5, h6, blockquote, pre, tr, td, th, table, figure, ul, ol, dl';

// Pasted pages. Formulas (Wikipedia's MathML with its fallback image, arXiv's
// LaTeXML tables) become math once; an icon or emoji inside a line of text,
// or any picture in a table cell (where a figure cannot go), becomes its alt
// text; other pictures become figures. For a footnote (inline), every block
// becomes inline: math in the line, pictures as alt text, blocks joined by
// spaces.
function pastedHTML(html, inlineOnly = false) {
  if (!inlineOnly) externalPaste = !(/data-pm-slice/.test(html) && /data-blog-editor/.test(html));
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('br.Apple-interchange-newline').forEach(e => e.remove());
  // no real table spans more than a few dozen columns
  for (const c of doc.querySelectorAll('[colspan], [rowspan]')) {
    for (const a of ['colspan', 'rowspan']) if (c.hasAttribute(a)) c.setAttribute(a, String(Math.min(50, Math.max(1, parseInt(c.getAttribute(a), 10) || 1))));
  }
  const math = (el, tex, display) => {
    const m = doc.createElement(display && !inlineOnly && !el.closest('td, th') ? 'div' : 'span');
    m.className = 'math-tex';
    m.setAttribute('data-tex', tex);
    el.replaceWith(m);
  };
  for (const t of doc.querySelectorAll('table.ltx_equation, table.ltx_equationgroup')) {
    t.querySelectorAll('.ltx_tag, .ltx_eqn_eqno').forEach(e => e.remove());
    // a row's first two parts meet at the alignment point (before "=")
    const rows = [...t.querySelectorAll('tr')].map(r => [...r.querySelectorAll('math')].map(mm => (mm.getAttribute('alttext') || '').trim()).filter(Boolean))
      .filter(cells => cells.length).map(cells => (cells.length > 1 ? `${cells[0]} & ${cells.slice(1).join(' ')}` : cells[0]));
    if (rows.length) math(t, rows.length > 1 ? `\\begin{aligned}${rows.join(' \\\\ ')}\\end{aligned}` : rows[0].replace(' & ', ' '), true);
  }
  for (const el of doc.querySelectorAll('.mwe-math-element')) {
    const mm = el.querySelector('math'), img = el.querySelector('img');
    const a = mm && mm.querySelector('annotation[encoding="application/x-tex"]');
    const tex = displaystyle((a && a.textContent) || (mm && mm.getAttribute('alttext')) || (img && img.getAttribute('alt')) || '');
    if (tex) math(el, tex, !!el.querySelector('.mwe-math-fallback-image-display, math[display="block"]'));
  }
  // KaTeX's and MathML's display math where only math in the line fits
  for (const el of doc.querySelectorAll(inlineOnly ? '.katex-display, math[display="block"]' : 'td .katex-display, th .katex-display, td math[display="block"], th math[display="block"]')) {
    const a = el.querySelector('annotation[encoding="application/x-tex"]');
    const tex = displaystyle((a && a.textContent) || el.getAttribute('alttext') || '');
    if (tex) math(el, tex, false);
  }
  for (const img of doc.querySelectorAll('img')) {
    const alt = img.getAttribute('alt') || '';
    if (/\bmwe-math-fallback-image-(inline|display)\b/.test(img.className) && alt) math(img, displaystyle(alt), /-display\b/.test(img.className));
    else if (inlineOnly || img.closest('td, th') || (small(img) && inLine(img))) img.replaceWith(doc.createTextNode(alt));
    else if (!img.closest('figure')) {
      // a paragraph holding nothing but the picture: the picture itself
      const p = img.parentElement;
      if (p && p.tagName === 'P' && [...p.childNodes].every(n => n === img || (n.nodeType === 3 && !n.data.trim()))) p.replaceWith(img);
    }
  }
  if (inlineOnly) {
    doc.querySelectorAll('div.math-tex').forEach(d => {
      const sp = doc.createElement('span');
      sp.className = 'math-tex';
      sp.setAttribute('data-tex', d.getAttribute('data-tex'));
      d.replaceWith(sp);
    });
    // a space between blocks (inside one, the reader would drop it)
    doc.querySelectorAll(BLOCKS).forEach(b2 => b2.after(doc.createTextNode(' ')));
  }
  return doc.body.innerHTML;
}

const toolbar = buildToolbar($('[data-toolbar]'), app);
// The editor's own copies are marked: other ProseMirror editors write
// data-pm-slice too, and their copies are read as from outside.
const domSerializer = DOMSerializer.fromSchema(schema);
const clipboardSerializer = {
  serializeFragment(fragment, options, target) {
    const out = domSerializer.serializeFragment(fragment, options, target);
    for (const c of out.childNodes) if (c.nodeType === 1) c.setAttribute('data-blog-editor', '');
    return out;
  },
};

const view = new EditorView($('[data-body]'), {
  state: makeState(emptyDoc()),
  attributes: {class: 'prose post__body ed-body', 'aria-label': 'Text of the post', spellcheck: 'true'},
  editable: () => canEdit(),
  transformPastedHTML: html => pastedHTML(html),
  transformPasted: (slice, v) => fitPaste(slice, v),
  clipboardSerializer,
  nodeViews: {
    math_inline: node => new MathView(node),
    math_display: node => new MathView(node),
    code_block: (node, v, getPos) => new CodeBlockView(node, v, getPos),
    figure: (node, v, getPos) => new FigureView(node, v, getPos, app),
    footnote: (node, v, getPos) => new FootnoteView(node, v, getPos, app),
  },
  dispatchTransaction(tr) {
    view.updateState(view.state.apply(tr));
    if (tr.docChanged && !tr.getMeta('quiet')) changed();
    toolbar.update(app.activeView().state);
  },
  handleClickOn(v, pos, node, nodePos, event, direct) {
    if (direct && (node.type === N.math_inline || node.type === N.math_display)) {
      editMath(v, nodePos);
      return true;
    }
    return false;
  },
  handlePaste(v, event) {
    const files = imageFilesIn(event.clipboardData);
    if (!files.length) return false;
    addImages(files);
    return true;
  },
  handleDrop(v, event) {
    const files = imageFilesIn(event.dataTransfer);
    if (!files.length) return false;
    const at = v.posAtCoords({left: event.clientX, top: event.clientY});
    if (at) v.dispatch(v.state.tr.setSelection(TextSelection.near(v.state.doc.resolve(at.pos))));
    event.preventDefault();
    addImages(files);
    return true;
  },
  handleDOMEvents: {
    focus: () => {
      inner = null;
      toolbar.update(view.state);
      return false;
    },
    // links in the post are changed with Ctrl+K, never followed from here
    click: (v, e) => {
      if (e.target instanceof Element && e.target.closest('a[href]')) e.preventDefault();
      return false;
    },
  },
});

view.dom.addEventListener('drop', e => {
  const at = view.posAtCoords({left: e.clientX, top: e.clientY});
  dropAt = at ? {pos: at.pos, time: Date.now()} : null;
}, true);

const picker = el('input');
picker.type = 'file';
picker.accept = 'image/png,image/jpeg,image/gif,image/webp,image/avif';
picker.multiple = true;
picker.hidden = true;
root.append(picker);
picker.addEventListener('change', () => {
  addImages([...picker.files]);
  picker.value = '';
});

// Where a drop lands (ProseMirror reads transformPasted before it says).
let dropAt = null;

// Pasted or dropped content, fitted to where it goes. A figure from outside
// sits at the slice's edge, open, and would merge with the line it lands on
// (taking that line's text as its caption, or vanishing when it has no
// caption): it is closed, at any depth, so it goes in as a block. The
// editor's own slices that start or end inside a caption carry that figure
// only as context: it becomes a plain line, so no copy of the picture is
// made. Where a block cannot go (a table cell, a caption), whole figures
// become their alt text and display math becomes math in the line.
function fitPaste(slice, v) {
  const outside = externalPaste;
  externalPaste = false;
  const drop = dropAt && Date.now() - dropAt.time < 1000 ? dropAt.pos : null;
  dropAt = null;
  const $at = v.state.doc.resolve(drop != null ? Math.min(drop, v.state.doc.content.size) : v.state.selection.from);
  let cell = false;
  for (let d = $at.depth; d > 0; d--) if ($at.node(d).type.spec.tableRole) cell = true;
  const caption = $at.parent.type === N.figure;
  let content = slice.content, {openStart, openEnd} = slice;
  if (outside) {
    const depthOf = (frag, open, side) => {
      let node = side < 0 ? frag.firstChild : frag.lastChild;
      for (let d = 0; node && d < open; d++, node = side < 0 ? node.firstChild : node.lastChild) {
        if (node.type === N.figure) return d;
      }
      return open;
    };
    openStart = depthOf(content, openStart, -1);
    openEnd = depthOf(content, openEnd, 1);
  } else content = edgeFigures(content, openStart, openEnd);
  if (caption) content = flatten(content, 'inline', openStart, openEnd);
  // a lone table pasted into a table is prosemirror-tables' to place
  else if (cell && !(content.childCount === 1 && content.firstChild.type.spec.tableRole)) content = flatten(content, 'cell', openStart, openEnd);
  if (content === slice.content && openStart === slice.openStart && openEnd === slice.openEnd) return slice;
  try {
    const max = Slice.maxOpen(content);
    return new Slice(content, Math.min(openStart, max.openStart), Math.min(openEnd, max.openEnd));
  } catch (e) {
    return slice;
  }
}

// The editor's own slice: a figure open at an edge (the slice starts or ends
// inside its caption) becomes a plain line holding that caption text.
function edgeFigures(frag, openStart, openEnd) {
  if (!openStart && !openEnd) return frag;
  const kids = [], n = frag.childCount;
  frag.forEach((node, _, i) => {
    const oS = i === 0 ? openStart : 0, oE = i === n - 1 ? openEnd : 0;
    if ((oS || oE) && node.type === N.figure) kids.push(N.paragraph.create(null, node.content));
    else if ((oS > 1 || oE > 1) && !node.isTextblock && node.childCount) kids.push(node.copy(edgeFigures(node.content, Math.max(0, oS - 1), Math.max(0, oE - 1))));
    else kids.push(node);
  });
  return Fragment.fromArray(kids);
}

// What a table cell (paragraphs only) or a caption (text only) can take of
// pasted blocks: whole figures as their alt text, display math as math in
// the line, headings as plain lines, code as lines with breaks, lists and
// boxes as their lines. In a caption, lines are joined by spaces.
function flatten(frag, mode, openStart = 0, openEnd = 0) {
  const lines = [];
  const text = t => (t ? [schema.text(t)] : []);
  const codeLines = t => t.split('\n').flatMap((l, i) => (i ? [N.hard_break.create(), ...text(l)] : text(l)));
  const n = frag.childCount;
  frag.forEach((node, _, i) => {
    const oS = i === 0 ? openStart : 0, oE = i === n - 1 ? openEnd : 0;
    if (node.isInline) {
      if (!lines.length || !lines[lines.length - 1].inline) lines.push({inline: true, nodes: []});
      lines[lines.length - 1].nodes.push(node);
    } else if (node.type === N.figure && !oS && !oE) lines.push({nodes: text(node.attrs.alt || node.textContent)});
    else if (node.type === N.math_display) lines.push({nodes: [N.math_inline.create({tex: node.attrs.tex})]});
    else if (node.type === N.paragraph && mode === 'cell') lines.push({block: node});
    else if (node.isTextblock) lines.push({nodes: node.type.spec.code ? codeLines(node.textContent) : [...node.content.content]});
    else for (const c of flatten(node.content, mode, Math.max(0, oS - 1), Math.max(0, oE - 1)).content) {
      lines.push(c.isInline ? {nodes: [c]} : {block: c});
    }
  });
  if (mode === 'inline') {
    const out = [];
    lines.forEach((l, i) => {
      if (i && out.length && !lines[i - 1].inline && !l.inline) out.push(schema.text(' '));
      out.push(...(l.block ? l.block.content.content : l.nodes));
    });
    return Fragment.fromArray(out);
  }
  return Fragment.fromArray(lines.map(l => l.block || N.paragraph.create(null, l.nodes)));
}

// --- small helpers ----------------------------------------------------------------

const oneLine = s => String(s || '').replace(/\s+/g, ' ').trim();
const composing = e => e.isComposing || e.keyCode === 229;
const clock = t => new Date(t).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
const when = t => new Date(t).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});
const dayOf = s => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});
};
const slugOfPath = path => (POST_NAME.exec(path.split('/').pop()) || [])[4] || '';
const dateOfPath = path => {
  const m = POST_NAME.exec(path.split('/').pop());
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null;
};
const addressFor = slug => `${BASE}/blog/${slug}/`;

// a text box as tall as its text (or its hint, when empty)
function grow(ta) {
  const empty = !ta.value;
  if (empty) ta.value = ta.placeholder;
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight}px`;
  if (empty) ta.value = '';
}

function status(text, kind = '') {
  const s = $('[data-status]');
  s.textContent = text;
  s.className = 'ed-status' + (kind ? ` is-${kind}` : '');
  if (kind === 'error') lastError = Date.now();
}

function statusLink(text, href, label) {
  status(text, 'ok');
  const a = el('a', '', label);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  $('[data-status]').append(a);
}

function notice(text, kind = '') {
  const n = $('[data-notice]');
  n.textContent = text || '';
  n.hidden = !text;
  n.className = 'ed-notice' + (kind ? ` is-${kind}` : '');
}

function explain(e) {
  const m = e.message || String(e);
  if (e.status === 401) return 'GitHub did not accept the token (expired or revoked?). Sign out on the Posts page and sign in with a new one.';
  if (e.status === 403 && /rate limit/i.test(m)) return 'GitHub limits how often a token may be used, and that limit is reached; try again within the hour.';
  if (e.status === 403 || e.status === 404) return `the token cannot write to ${REPO}; it needs Contents: Read and write on that repository.`;
  if (e.status === 422) return /fast.forward/i.test(m) ? 'the site changed meanwhile; try again.' : `GitHub refused the change (${m}).`;
  return m;
}

function setView(name) {
  for (const s of $$('[data-view]')) s.hidden = s.dataset.view !== name;
}

// While GitHub is busy with the post, in a tab that does not hold it, and
// while another post is on its way in, nothing in the post can change.
function canEdit() {
  return !busyNow && !readOnly && !loading;
}

function setLocked() {
  for (const sel of ['.ed-toolbar', '.ed-settings', '.ed-head']) $(sel).inert = !canEdit();
  for (const sel of ['[data-discard]', '[data-delete]']) $(sel).disabled = !canEdit();
  $('[data-back]').disabled = busyNow;
  view.setProps({});
  for (const v of app.inners) v.setProps({});
}

// One tab at a time edits a post (Web Locks "blog-editor:<draft id>");
// another tab shows it read-only. Requests run one after another, and a tab
// keeps a post it already holds.
let held = null, lockQueue = Promise.resolve();

function lock(id) {
  const p = lockQueue.then(() => takeLock(id));
  lockQueue = p.catch(() => {});
  return p;
}

function unlock() {
  lockQueue = lockQueue.then(releaseHeld);
}

async function releaseHeld() {
  if (!held) return;
  const h = held;
  held = null;
  h.release();
  await h.done;
}

async function takeLock(id) {
  if (held && held.id === id) return true;
  await releaseHeld();
  if (!navigator.locks) return true;
  return new Promise(resolve => {
    const done = navigator.locks.request('blog-editor:' + id, {ifAvailable: true}, l => {
      if (!l) return resolve(false);
      return new Promise(release => {
        held = {id, release, done};
        resolve(true);
      });
    }).catch(() => resolve(true));
  });
}

// Runs fn only while no other tab holds that draft.
async function withLock(id, fn) {
  if (!navigator.locks || (held && held.id === id)) {
    await fn();
    return true;
  }
  return navigator.locks.request('blog-editor:' + id, {ifAvailable: true}, async l => {
    if (!l) return false;
    await fn();
    return true;
  });
}

async function mapLimit(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({length: Math.min(n, items.length)}, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  }));
  return out;
}

function normMeta(m) {
  const e = emptyMeta();
  return {...e, ...m, paper: {...e.paper, ...(m && m.paper)}};
}

// --- drafts in this browser ----------------------------------------------------------

// Saved half a second after typing stops, and at least every two seconds
// while it goes on.
function changed() {
  if (!cur || readOnly) return;
  cur.dirty = true;
  if (!busyNow && Date.now() - lastError > 6000) status('Saving in this browser\u2026');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
  if (!maxTimer) maxTimer = setTimeout(saveDraft, 2000);
  updateBar();
}

const record = () => ({
  id: cur.id, path: cur.path, baseSha: cur.baseSha, public: cur.public, meta: cur.meta, slug: cur.slug,
  slugTouched: cur.slugTouched, doc: view.state.doc.toJSON(), dirty: cur.dirty, updated: Date.now(), tab: TAB,
});

let saveFailed = false;

async function saveDraft() {
  clearTimeout(saveTimer);
  clearTimeout(maxTimer);
  saveTimer = maxTimer = null;
  if (!cur || readOnly) return;
  const rec = record();
  saving++;
  try {
    await store.putDraft(rec);
    dropBackup(rec.id, true);
    if (cur && cur.id === rec.id && cur.dirty && !saveTimer && !busyNow && (saveFailed || Date.now() - lastError > 6000)) {
      status(`Saved in this browser at ${clock(rec.updated)}; ${gh ? 'not published yet' : 'sign in on the Posts page to publish'}.`);
    }
    saveFailed = false;
  } catch (e) {
    saveFailed = true;
    status(`Could not save in this browser (${e.message || e}); publish soon, or copy your text.`, 'error');
  } finally {
    saving--;
  }
}

async function flush() {
  if (saveTimer) await saveDraft();
}

// A save started as the page closes may never finish, so the last edits
// also go to localStorage, which is written at once. Opening the draft (in
// this tab or another) moves them back into IndexedDB first.
function backup() {
  if (!cur || readOnly || !(saveTimer || saving)) return;
  try {
    localStorage.setItem(BACKUP + cur.id, JSON.stringify(record()));
  } catch (e) { /* storage full or off */ }
}

// mine: only a backup this tab wrote (it is older than what was just saved)
function dropBackup(id, mine = false) {
  try {
    if (mine) {
      const b = JSON.parse(localStorage.getItem(BACKUP + id) || 'null');
      if (b && b.tab !== TAB) return;
    }
    localStorage.removeItem(BACKUP + id);
  } catch (e) { /* storage off */ }
}

async function restoreBackup(id) {
  let raw = null;
  try {
    raw = localStorage.getItem(BACKUP + id);
  } catch (e) {
    return;
  }
  if (!raw) return;
  try {
    const rec = JSON.parse(raw);
    const have = await store.getDraft(id).catch(() => null);
    if (!have || (have.updated || 0) < rec.updated) await store.putDraft(rec);
    localStorage.removeItem(BACKUP + id);
  } catch (e) { /* kept for the next try */ }
}

async function restoreBackups() {
  let ids = [];
  try {
    ids = Object.keys(localStorage).filter(k => k.startsWith(BACKUP)).map(k => k.slice(BACKUP.length));
  } catch (e) {
    return;
  }
  for (const id of ids) await withLock(id, () => restoreBackup(id)).catch(() => {});
}

// --- images ----------------------------------------------------------------------------

async function imageURL(src) {
  if (urls.has(src)) return urls.get(src);
  if (src.startsWith('local:')) {
    const rec = await store.getImage(src.slice(6)).catch(() => null);
    if (!rec) return '';
    const u = URL.createObjectURL(rec.blob);
    urls.set(src, u);
    return u;
  }
  return src.startsWith('/') && !src.startsWith('//') ? BASE + src : src;
}

const readAs = (blob, how) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r[how](blob);
});

function dataToBlob(src) {
  const [head, data] = src.split(',', 2);
  const type = ((/^data:([^;,]+)/i.exec(head) || [])[1] || 'application/octet-stream').toLowerCase();
  const bytes = /;base64/i.test(head) ? Uint8Array.from(atob(data), c => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(data));
  return new Blob([bytes], {type});
}

async function addImages(files) {
  if (!canEdit()) return;
  for (const f of files) {
    if (f.type === 'image/svg+xml') {
      status(`${f.name}: SVG images are not accepted, since an SVG can carry scripts; export it as PNG.`, 'error');
      continue;
    }
    if (!IMAGE_TYPES.includes(f.type)) {
      status(`${f.name}: only PNG, JPEG, GIF, WebP and AVIF images can go in a post.`, 'error');
      continue;
    }
    if (f.size > 20e6) {
      status(`${f.name} is over 20 MB; not added.`, 'error');
      continue;
    }
    let src;
    try {
      src = 'local:' + await store.putImage(f);
      urls.set(src, URL.createObjectURL(f));
    } catch (e) {
      src = await readAs(f, 'readAsDataURL');
    }
    const r = insertBlock(view.state, N.figure.create({src, alt: ''}));
    if (!r) {
      status('An image cannot go here.', 'error');
      continue;
    }
    r.tr.setSelection(TextSelection.create(r.tr.doc, r.pos + 1));
    view.dispatch(r.tr.scrollIntoView());
  }
  view.focus();
}

const EXT = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/avif': 'avif'};

function fileName(name, type) {
  const ext = EXT[type] || ((/\.([a-z0-9]+)$/i.exec(name) || [])[1] || 'png').toLowerCase();
  const base = name.replace(/\.[^.]*$/, '').normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image';
  return `${base.slice(0, 60)}.${ext}`;
}

function uniqueName(n, taken) {
  if (!taken.has(n.toLowerCase())) return n;
  const [, b, e = ''] = /^(.*?)(\.[^.]*)?$/.exec(n);
  for (let i = 2; ; i++) if (!taken.has(`${b}-${i}${e}`.toLowerCase())) return `${b}-${i}${e}`;
}

// Git's name for a file's content (the sha of "blob <size>\0" + bytes), to
// find an image already uploaded by an earlier try.
async function blobSha(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const head = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const all = new Uint8Array(head.length + bytes.length);
  all.set(head);
  all.set(bytes, head.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1', all))].map(b => b.toString(16).padStart(2, '0')).join('');
}

// The images of the post that are not on the site yet, as files for the
// commit, and where each one will be. An image already in the post's folder
// with the same content is used as it is.
async function newImages(doc, slug, ref, uploads = new Map()) {
  const srcs = new Set();
  doc.descendants(n => {
    if (n.type === N.figure && /^(local:|data:)/i.test(n.attrs.src)) srcs.add(n.attrs.src);
  });
  const files = [], map = new Map(), bySha = new Map();
  if (!srcs.size) return {files, map};
  const dir = `${IMAGES}/${slug}`;
  const listed = await gh.dir(dir, ref);
  const taken = new Set(listed.map(f => f.name.toLowerCase()));
  for (const src of srcs) {
    const up = uploads.get(src);
    if (up && !taken.has(up.name.toLowerCase())) {
      // uploaded by an earlier try of this publish, not committed yet
      taken.add(up.name.toLowerCase());
      files.push({path: `${dir}/${up.name}`, sha: up.sha, src});
      map.set(src, `/assets/img/blog/${slug}/${up.name}`);
      continue;
    }
    let blob, name = 'image';
    if (src.startsWith('local:')) {
      const rec = await store.getImage(src.slice(6)).catch(() => null);
      if (!rec) throw new Error('an image is missing from this browser\'s storage; remove it and add it again');
      ({blob, name} = rec);
    } else blob = dataToBlob(src);
    if (!IMAGE_TYPES.includes(blob.type)) throw new Error('the post has an image that is not PNG, JPEG, GIF, WebP or AVIF');
    const sha = await blobSha(blob);
    const same = listed.find(f => f.sha === sha);
    if (same || bySha.has(sha)) {
      map.set(src, same ? `/assets/img/blog/${slug}/${same.name}` : bySha.get(sha));
      continue;
    }
    const fname = uniqueName(fileName(name, blob.type), taken);
    taken.add(fname.toLowerCase());
    files.push({path: `${dir}/${fname}`, base64: (await readAs(blob, 'readAsDataURL')).split(',')[1], src});
    map.set(src, `/assets/img/blog/${slug}/${fname}`);
    bySha.set(sha, `/assets/img/blog/${slug}/${fname}`);
  }
  return {files, map};
}

// After publishing, the figures point at the site; the pictures shown stay
// the local ones until the site has them.
function swapImageSources(map) {
  if (!map.size) return;
  const tr = view.state.tr;
  view.state.doc.descendants((n, pos) => {
    if (n.type !== N.figure || !map.has(n.attrs.src)) return;
    const site = map.get(n.attrs.src);
    uploaded.add(site);
    if (urls.has(n.attrs.src)) urls.set(site, urls.get(n.attrs.src));
    tr.setNodeMarkup(pos, null, {...n.attrs, src: site});
  });
  view.dispatch(tr.setMeta('quiet', true).setMeta('addToHistory', false));
}

// --- popovers: link, math, alt text ---------------------------------------------------

function editLink(v) {
  if (!canEdit()) return;
  const state = v.state;
  if (state.selection.$from.parent.type.spec.code) return;
  const range = linkRange(state);
  const start = range ? range.from : state.selection.from, end = range ? range.to : state.selection.to;
  const rect = () => {
    const a = v.coordsAtPos(start), b = v.coordsAtPos(end);
    return {left: a.left, top: a.top, bottom: Math.max(a.bottom, b.bottom)};
  };
  const input = el('input', 'ed-input');
  input.type = 'text';
  input.placeholder = 'https://\u2026 or /blog/some-post/';
  input.value = range ? range.mark.attrs.href : '';
  const pop = popover(rect, {label: 'Link', onClose: commit => {
    if (commit) apply();
    v.focus();
  }});
  pop.el.append(el('span', 'ed-pop__label', 'Link to'), input);
  const actions = el('div', 'ed-pop__row');
  actions.append(el('span', 'ed-pop__hint', 'Enter to apply, Esc to cancel'));
  if (range) actions.append(button('Remove the link', () => { input.value = ''; closePopover(true); }, 'ed-link'));
  pop.el.append(actions);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !composing(e)) {
      e.preventDefault();
      closePopover(true);
    }
  });
  pop.place();
  input.focus();
  function apply() {
    if (!canEdit()) return;
    const raw = input.value.trim();
    if (raw === (range ? range.mark.attrs.href : '')) return;
    const tr = v.state.tr;
    if (!raw) {
      if (range) v.dispatch(tr.removeMark(range.from, range.to, M.link));
      return;
    }
    const href = webURL(raw);
    if (!href) {
      status('That is not a web address.', 'error');
      return;
    }
    const mark = M.link.create({href});
    if (start === end) {
      tr.insertText(raw, start);
      tr.addMark(start, start + raw.length, mark);
    } else {
      tr.removeMark(start, end, M.link);
      tr.addMark(start, end, mark);
    }
    v.dispatch(tr.scrollIntoView());
  }
}

function editMath(v, pos) {
  if (!canEdit()) return;
  const node = v.state.doc.nodeAt(pos);
  if (!node || !['math_inline', 'math_display'].includes(node.type.name)) return;
  const display = node.type === N.math_display;
  v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, pos)));
  const ta = el('textarea', 'ed-input ed-pop__tex');
  ta.rows = display ? 3 : 1;
  ta.spellcheck = false;
  ta.value = node.attrs.tex;
  ta.setAttribute('aria-label', 'TeX');
  const preview = el('div', 'ed-pop__preview');
  const show = () => {
    preview.textContent = '';
    if (ta.value.trim()) renderTex(ta.value, preview, display);
  };
  const pop = popover(v.nodeDOM(pos), {cls: 'ed-pop--math', label: 'Math', onClose: finish});
  pop.el.append(el('span', 'ed-pop__label', display ? 'Math on its own line, in TeX' : 'Math in the line, in TeX'), ta, preview);
  const pens = el('div', 'ed-pop__row');
  pens.append(el('span', 'ed-pop__hint', 'Pen for the selected part:'));
  for (const p of PENS) {
    const b = button('', () => {
      const s = ta.selectionStart, e = ta.selectionEnd, inside = ta.value.slice(s, e);
      ta.setRangeText(`\\${p}{${inside}}`, s, e, 'end');
      if (!inside) ta.setSelectionRange(s + p.length + 2, s + p.length + 2);
      ta.focus();
      show();
    }, 'ed-tb ed-tb--small');
    b.innerHTML = `<span class="ed-sw" style="--sw: var(--pen-${p})"></span>`;
    b.title = `${PEN_NAMES[p]}: \\${p}{\u2026}`;
    b.setAttribute('aria-label', b.title);
    pens.append(b);
  }
  pop.el.append(pens, el('span', 'ed-pop__hint', 'Enter to finish, Shift+Enter for a new line, Esc to cancel'));
  ta.addEventListener('input', show);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !composing(e)) {
      e.preventDefault();
      closePopover(true);
    }
  });
  show();
  pop.place();
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  function finish(commit) {
    if (!canEdit()) return;
    const now = v.state.doc.nodeAt(pos);
    if (!now || now.type !== node.type) {
      v.focus();
      return;
    }
    const tex = commit ? ta.value : now.attrs.tex;
    const tr = v.state.tr;
    if (!tex.trim()) tr.delete(pos, pos + now.nodeSize);
    else {
      if (tex !== now.attrs.tex) tr.setNodeMarkup(pos, null, {tex});
      if (display) cursorAfter(tr, pos + now.nodeSize);
      else tr.setSelection(TextSelection.create(tr.doc, pos + now.nodeSize));
    }
    v.dispatch(tr.scrollIntoView());
    v.focus();
  }
}

function insertMath(v, display) {
  if (!canEdit()) return;
  const pos = insertAtom(v, (display ? N.math_display : N.math_inline).create({tex: ''}));
  if (pos != null) editMath(v, pos);
}

function insertFootnote(v) {
  if (v !== view || !canEdit()) return;
  const pos = insertAtom(v, N.footnote.create());
  if (pos == null) return;
  requestAnimationFrame(() => {
    const dom = v.nodeDOM(pos);
    const ed = dom && dom.querySelector('.ProseMirror');
    if (ed) ed.focus();
  });
}

function editAlt(v, pos) {
  if (!canEdit()) return;
  const node = v.state.doc.nodeAt(pos);
  if (!node || node.type !== N.figure) return;
  const dom = v.nodeDOM(pos);
  const input = el('input', 'ed-input');
  input.type = 'text';
  input.value = node.attrs.alt;
  input.placeholder = 'What the image shows';
  const pop = popover(dom.querySelector('.ed-figure__tools') || dom, {label: 'Alt text', onClose: commit => {
    const now = v.state.doc.nodeAt(pos);
    if (commit && canEdit() && now && now.type === N.figure && input.value.trim() !== now.attrs.alt) {
      v.dispatch(v.state.tr.setNodeMarkup(pos, null, {...now.attrs, alt: input.value.trim()}));
    }
    v.focus();
  }});
  pop.el.append(el('span', 'ed-pop__label', 'Alt text: what the image shows, for readers who cannot see it'), input,
    el('span', 'ed-pop__hint', 'Enter to apply, Esc to cancel'));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !composing(e)) {
      e.preventDefault();
      closePopover(true);
    }
  });
  pop.place();
  input.focus();
}

// --- the post header and settings -------------------------------------------------------

function renderLinks() {
  const box = $('[data-paper-links]');
  box.textContent = '';
  cur.meta.paper.links.forEach((l, i) => {
    const r = el('div', 'ed-linkrow');
    const label = el('input', 'ed-in ed-in--meta');
    label.placeholder = 'Label, like PDF';
    label.value = l.label;
    label.setAttribute('aria-label', 'Label of the link');
    const url = el('input', 'ed-in ed-in--meta');
    url.placeholder = 'https://\u2026';
    url.value = l.url;
    url.setAttribute('aria-label', 'Address of the link');
    label.addEventListener('input', () => { cur.meta.paper.links[i].label = label.value; changed(); });
    url.addEventListener('input', () => { cur.meta.paper.links[i].url = url.value; changed(); });
    const del = button('Remove', () => { cur.meta.paper.links.splice(i, 1); renderLinks(); changed(); }, 'ed-link');
    r.append(label, url, del);
    box.append(r);
  });
}

function renderHeader() {
  const m = cur.meta;
  const title = $('[data-title]'), desc = $('[data-description]');
  title.value = m.title;
  desc.value = m.description;
  requestAnimationFrame(() => { grow(title); grow(desc); });
  for (const b of $$('[data-kind]')) b.setAttribute('aria-pressed', String(b.dataset.kind === m.kind));
  for (const b of $$('[data-field]')) b.setAttribute('aria-pressed', String(m.fields.includes(b.dataset.field)));
  $('[data-paper]').hidden = m.kind !== 'paper';
  for (const i of $$('[data-paper-key]')) i.value = m.paper[i.dataset.paperKey];
  renderLinks();
  $('[data-slug]').value = cur.slug;
  $('[data-toc]').checked = m.toc;
  $('[data-draft]').checked = m.draft;
  $('[data-date]').value = m.date ? m.date.slice(0, 10) : '';
  $('[data-date-label]').textContent = m.date ? dayOf(m.date) : 'Not published yet';
}

function updateBar() {
  if (!cur) return;
  const pub = $('[data-publish]');
  pub.textContent = cur.meta.draft ? 'Save draft to GitHub' : cur.path && cur.public ? 'Publish changes' : 'Publish';
  pub.disabled = !gh || !canEdit();
  pub.title = !gh ? 'Sign in on the Posts page to publish' : readOnly ? 'This post is open in another tab or window' : '';
  $('[data-delete]').hidden = !cur.path;
  $('[data-delete]').disabled = !gh || !canEdit();
  const discard = $('[data-discard]');
  discard.hidden = cur.path ? !cur.dirty : false;
  discard.textContent = cur.path ? 'Discard changes' : 'Delete draft';
  const live = $('[data-live]');
  live.hidden = !(cur.path && cur.public);
  if (cur.path) live.href = addressFor(slugOfPath(cur.path));
}

function wire() {
  const title = $('[data-title]'), desc = $('[data-description]'), slug = $('[data-slug]');
  title.addEventListener('input', () => {
    cur.meta.title = title.value;
    grow(title);
    if (!cur.slugTouched) {
      cur.slug = newSlug(title.value);
      slug.value = cur.slug;
    }
    changed();
  });
  title.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !composing(e)) {
      e.preventDefault();
      desc.focus();
    }
  });
  desc.addEventListener('input', () => {
    cur.meta.description = desc.value;
    grow(desc);
    changed();
  });
  desc.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !composing(e)) {
      e.preventDefault();
      view.focus();
    }
  });
  for (const b of $$('[data-kind]')) {
    b.addEventListener('click', () => {
      cur.meta.kind = b.dataset.kind;
      renderHeader();
      changed();
    });
  }
  const order = BLOG.fields.map(f => f.key);
  for (const b of $$('[data-field]')) {
    b.addEventListener('click', () => {
      const f = b.dataset.field, have = cur.meta.fields;
      const next = have.includes(f) ? have.filter(x => x !== f) : [...have, f];
      cur.meta.fields = [...order.filter(k => next.includes(k)), ...next.filter(k => !order.includes(k))];
      renderHeader();
      changed();
    });
  }
  for (const i of $$('[data-paper-key]')) {
    i.addEventListener('input', () => {
      cur.meta.paper[i.dataset.paperKey] = i.value;
      changed();
    });
  }
  $('[data-add-link]').addEventListener('click', () => {
    cur.meta.paper.links.push({label: '', url: ''});
    renderLinks();
    changed();
    const rows = $$('.ed-linkrow input');
    if (rows.length > 1) rows[rows.length - 2].focus();
  });
  slug.addEventListener('input', () => {
    cur.slugTouched = true;
    cur.slug = slug.value;
    changed();
  });
  slug.addEventListener('change', () => {
    cur.slug = newSlug(slug.value);
    slug.value = cur.slug;
    if (!cur.slug) cur.slugTouched = false;
    changed();
  });
  $('[data-toc]').addEventListener('change', e => {
    cur.meta.toc = e.target.checked;
    changed();
  });
  $('[data-draft]').addEventListener('change', e => {
    cur.meta.draft = e.target.checked;
    changed();
  });
  $('[data-date]').addEventListener('change', e => {
    const v = e.target.value;
    if (v) {
      const [y, mo, d] = v.split('-').map(Number);
      const t = /(\d\d):(\d\d):(\d\d)/.exec(cur.meta.date || '') || [null, ...new Date().toTimeString().slice(0, 8).split(':')];
      cur.meta.date = stamp(new Date(y, mo - 1, d, +t[1], +t[2], +t[3]));
    } else if (!cur.path) cur.meta.date = null;
    renderHeader();
    changed();
  });
  $('[data-back]').addEventListener('click', () => go(null));
  $('[data-publish]').addEventListener('click', publish);
  $('[data-delete]').addEventListener('click', deletePost);
  $('[data-discard]').addEventListener('click', discard);
  for (const b of $$('[data-new]')) b.addEventListener('click', () => newPost(b.dataset.new));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (cur) saveDraft();
    }
  });
}

// --- views: the list of posts, and a post ---------------------------------------------

function go(params) {
  history.pushState(null, '', params ? '?' + new URLSearchParams(params) : location.pathname);
  route();
}

async function route() {
  if (busyNow) {
    // the post stays open until GitHub has the change
    history.pushState(null, '', busyURL);
    return;
  }
  const seq = ++navSeq;
  if (cur) {
    // an open box (link, math, menu) is finished into the post being left;
    // then that post waits, untouchable, until the next one is shown
    closePopover(true);
    loading = true;
    setLocked();
    updateBar();
  }
  await flush();
  if (seq !== navSeq) return;
  const q = new URLSearchParams(location.search);
  try {
    if (q.get('post')) await openPost(q.get('post'), seq);
    else if (q.get('draft')) await openDraft(q.get('draft'), seq);
    else await showList();
  } catch (e) {
    if (seq !== navSeq) return;
    history.replaceState(null, '', location.pathname);
    await showList(`Could not open that: ${explain(e)}`, 'error');
  }
}

function renderAccount() {
  const box = $('[data-account]');
  box.textContent = '';
  if (gh) {
    const p = el('p', 'ed-account__line', `Signed in to GitHub${login ? ` as ${login}` : ''}; posts are published to ${REPO}. `);
    p.append(button('Sign out', signOut, 'ed-link'));
    box.append(p);
    return;
  }
  box.append($('[data-signin-template]').content.cloneNode(true));
  const form = box.querySelector('[data-signin]');
  form.addEventListener('submit', e => {
    e.preventDefault();
    signIn(form.querySelector('[data-token]').value, form.querySelector('[data-remember]').checked);
  });
}

async function signIn(token, remember) {
  token = token.trim();
  const msg = $('[data-signin-msg]');
  if (!token) return;
  msg.textContent = 'Checking the token\u2026';
  const g = new GitHub(token, REPO, BRANCH);
  try {
    await g.repoInfo();
    const u = await g.user().catch(() => null);
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN, token);
      localStorage.setItem(OWNER, '1');
    } catch (e) { /* storage off: signed in for this page only */ }
    gh = g;
    login = u ? u.login : '';
    if (cur) {
      updateBar();
      status('Signed in.', 'ok');
    } else if (location.search) await route();
    else await showList('Signed in.', 'ok');
  } catch (e) {
    msg.textContent = e.status === 401 ? 'GitHub did not accept this token.'
      : e.status === 403 || e.status === 404 ? `This token cannot see ${REPO}; give it access to that repository.`
      : explain(e);
  }
}

let signOutLater = false;
function signOutHere() {
  if (busyNow || loading) {
    signOutLater = true;
    return;
  }
  signOutLater = false;
  try {
    sessionStorage.removeItem(TOKEN);
  } catch (e) { /* storage off */ }
  gh = null;
  login = '';
  if (cur) {
    updateBar();
    status('Signed out in another tab; sign in again on the Posts page to publish.', 'error');
  } else showList('Signed out in another tab.');
}

function signOut() {
  try {
    localStorage.removeItem(TOKEN);
    sessionStorage.removeItem(TOKEN);
    localStorage.removeItem(OWNER);
  } catch (e) { /* nothing stored */ }
  gh = null;
  login = '';
  showList('Signed out; the token is no longer kept in this browser. Revoke it on GitHub if you will not use it again.');
}

// Every post Jekyll 3.10 builds: files named like posts in any _posts
// folder under docs/ that is not inside a folder starting with _ . # or ~;
// inside _posts, Jekyll skips a path whose first folder or file name starts
// with one of those, or that ends with ~.
function isPost(path) {
  if (!path.startsWith('docs/')) return false;
  const parts = path.slice(5).split('/'), i = parts.indexOf('_posts');
  if (i < 0 || parts.slice(0, i).some(x => /^[_.#~]/.test(x))) return false;
  const inner = parts.slice(i + 1), name = inner[inner.length - 1];
  return inner.length > 0 && !/^[_.#~]/.test(inner[0]) && !/^[_.#~]/.test(name) && !name.endsWith('~') && POST_NAME.test(name);
}

const slashed = r => ('/' + String(r).replace(/^\/+/, '')).replace(/\/?$/, '/');

async function listPosts(ref) {
  const files = (await gh.files(ref)).filter(f => isPost(f.path));
  const posts = await mapLimit(files, 6, async f => {
    const name = f.path.split('/').pop();
    const text = await gh.blobText(f.sha);
    let fm = {}, raw = '';
    try {
      ({fm, raw} = splitFile(text));
    } catch (e) { /* front matter that is not YAML: listed by its name */ }
    const date = ((/^date:[ \t]*(.+?)[ \t]*$/m.exec(raw) || [])[1] || name.slice(0, 10)).replace(/^(['"])(.*)\1$/, '$2');
    const address = addressOf(name, fm);
    const old = Array.isArray(fm.redirect_from) ? fm.redirect_from : fm.redirect_from ? [fm.redirect_from] : [];
    return {
      path: f.path, name, sha: f.sha, title: oneLine(fm.title) || name, kind: fm.kind,
      draft: fm.published === false || /^(n|no|false|off)$/i.test(String(fm.published)), date, md: !name.endsWith('.html'),
      address, addresses: [address, ...old.map(slashed)].filter(Boolean),
    };
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function listItem(meta, title, href, onOpen, extra) {
  const li = el('li', 'blog-list__item ed-item');
  const a = el('a', 'blog-list__link');
  a.href = href;
  if (onOpen) {
    a.addEventListener('click', e => {
      e.preventDefault();
      onOpen();
    });
  } else {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  a.append(el('span', 'blog-list__meta', meta), el('span', 'blog-list__title', title));
  li.append(a);
  if (extra) li.append(extra);
  return li;
}

async function showList(msg, kind) {
  const seq = ++navSeq;  // a post still on its way in stops itself
  closePopover(false);
  await flush();
  if (seq !== navSeq) return;
  cur = null;
  inner = null;
  readOnly = false;
  loading = false;
  unlock();
  if (location.search) history.replaceState(null, '', location.pathname);
  setView('list');
  notice(msg, kind);
  renderAccount();
  let drafts = [];
  try {
    drafts = await store.allDrafts();
  } catch (e) {
    notice('This browser does not allow the editor to keep drafts (private window?); publish before you leave.', 'error');
  }
  for (const d of drafts) if (!d.dirty && !d.path) withLock(d.id, () => store.deleteDraft(d.id)).catch(() => {});
  const shown = drafts.filter(d => d.dirty).sort((a, b) => b.updated - a.updated);
  const dl = $('[data-draft-list]');
  dl.textContent = '';
  $('[data-drafts]').hidden = !shown.length;
  for (const d of shown) {
    const params = d.path ? {post: d.path} : {draft: d.id};
    const t = oneLine(d.meta && d.meta.title) || 'Untitled';
    const drop = button('Discard', async () => {
      if (!confirm(`Discard the unpublished changes to "${t}"? They cannot be brought back.`)) return;
      const done = await withLock(d.id, async () => {
        await store.deleteDraft(d.id).catch(() => {});
        dropBackup(d.id);
      });
      showList(done ? '' : `"${t}" is open in another tab or window; discard it there.`, done ? '' : 'error');
    }, 'ed-link ed-item__drop');
    dl.append(listItem(`${d.path ? 'Changes to a post on the site' : 'New post'} \u00b7 edited ${when(d.updated)}`, t,
      '?' + new URLSearchParams(params), () => go(params), drop));
  }
  const pl = $('[data-post-list]'), ps = $('[data-posts-status]');
  pl.textContent = '';
  if (!gh) {
    ps.textContent = 'Sign in to see and edit the posts on the site.';
    return;
  }
  ps.textContent = 'Loading the posts from GitHub\u2026';
  try {
    const posts = await listPosts();
    if (seq !== navSeq || cur) return;
    ps.textContent = posts.length ? '' : 'No posts yet.';
    for (const p of posts) {
      const k = BLOG.kinds.find(x => x.key === p.kind);
      const meta = [dayOf(p.date), k && k.label, p.draft && 'draft, not on the site', p.md && 'Markdown: opens on GitHub'].filter(Boolean).join(' \u00b7 ');
      pl.append(p.md
        ? listItem(meta, p.title, `https://github.com/${REPO}/edit/${BRANCH}/${p.path}`)
        : listItem(meta, p.title, '?' + new URLSearchParams({post: p.path}), () => go({post: p.path})));
    }
  } catch (e) {
    if (seq === navSeq && !cur) ps.textContent = `Could not list the posts: ${explain(e)}`;
  }
}

// Shows a post (the caller holds its lock, or not: then it is read-only);
// false when it is read-only, or when a later navigation took over.
function mount(c, doc, held, seq = navSeq) {
  if (seq !== navSeq) return false;
  closePopover(false);
  cur = c;
  inner = null;
  loading = false;
  readOnly = !held;
  view.updateState(makeState(doc));
  renderHeader();
  updateBar();
  setView('edit');
  setLocked();
  toolbar.update(view.state);
  window.scrollTo(0, 0);
  if (readOnly) status('This post is open in another tab or window. Edit it there, or close that one and reload this page.', 'error');
  if (signOutLater) signOutHere();
  return held;
}

async function newPost(kind) {
  const seq = ++navSeq;
  await flush();
  if (seq !== navSeq) return;
  const id = 'new-' + store.randomId();
  const rec = {
    id, path: null, baseSha: null, public: false, meta: emptyMeta(BLOG.kinds.some(k => k.key === kind) ? kind : null),
    slug: '', slugTouched: false, doc: emptyDoc().toJSON(), dirty: false, updated: Date.now(),
  };
  history.pushState(null, '', '?' + new URLSearchParams({draft: id}));
  lock(id);  // a new id: no other tab has it
  mount({id, path: null, baseSha: null, public: false, meta: rec.meta, slug: '', slugTouched: false, dirty: false}, emptyDoc(), true, seq);
  status(gh ? 'New post: saved in this browser as you type; Publish puts it on the site.'
    : 'New post: saved in this browser as you type. Sign in on the Posts page to publish.');
  $('[data-title]').focus();
  // storage off: the post lives in this page until published
  store.putDraft(rec).catch(() => {});
}

// the list, with the list's address, after an open that could not happen
function fail(msg) {
  history.replaceState(null, '', location.pathname);
  return showList(msg, 'error');
}

async function openDraft(id, seq = navSeq, msg) {
  const held = await lock(id);
  if (seq !== navSeq) return;
  if (held) await restoreBackup(id);
  const rec = await store.getDraft(id).catch(() => null);
  if (seq !== navSeq) return;
  if (!rec) return fail('That draft is not in this browser.');
  if (rec.path) {
    history.replaceState(null, '', '?' + new URLSearchParams({post: rec.path}));
    return openPost(rec.path, seq);
  }
  if (mount({id, path: null, baseSha: null, public: false, meta: normMeta(rec.meta), slug: rec.slug || '',
    slugTouched: !!rec.slugTouched, dirty: !!rec.dirty}, schema.nodeFromJSON(rec.doc), held, seq)) {
    status(msg || (rec.dirty ? `Saved in this browser at ${when(rec.updated)}; not published yet.` : 'New post.'));
  }
}

// Opens a post from GitHub, with this browser's unpublished changes to it.
// Only a tab that holds the post changes its stored draft.
async function openPost(path, seq = navSeq) {
  if (!gh) return fail('Sign in to open the posts on the site.');
  if (!POST_NAME.test(path.split('/').pop())) return fail(`${path} is not a post.`);
  if (cur) status('Opening\u2026');
  else notice('Opening the post\u2026');
  const held = await lock(path);
  if (seq !== navSeq) return;
  if (held) await restoreBackup(path);
  const sha = await gh.fileSha(path);
  if (seq !== navSeq) return;
  const local = await store.getDraft(path).catch(() => null);
  if (seq !== navSeq) return;
  if (!sha) {
    if (!held || !local || !local.dirty) return fail(`${path} is not on GitHub; it may have been renamed or deleted.`);
    // renamed or deleted elsewhere: the unpublished changes here become a new post
    const id = 'new-' + store.randomId();
    await store.putDraft({...local, id, path: null, baseSha: null, public: false, updated: Date.now()});
    await store.deleteDraft(path).catch(() => {});
    dropBackup(path);
    if (seq !== navSeq) return;
    history.replaceState(null, '', '?' + new URLSearchParams({draft: id}));
    return openDraft(id, seq, 'This post is no longer on GitHub (it was renamed or deleted elsewhere); your unpublished changes are here as a new post.');
  }
  if (!path.endsWith('.html')) return fail('That post is written in Markdown; edit it on GitHub.');
  const {meta, doc} = parsePost(await gh.blobText(sha));
  if (seq !== navSeq) return;
  if (!meta.date) meta.date = dateOfPath(path);
  let c = {id: path, path, baseSha: sha, public: !meta.draft, meta, slug: slugOfPath(path), slugTouched: true, dirty: false};
  let d = doc, msg = 'Opened from GitHub.';
  if (local && local.dirty) {
    const keep = !held || local.baseSha === sha || confirm(
      `You have unpublished changes to this post from ${when(local.updated)}, but the post was changed on GitHub after that.\n\n` +
      'OK keeps your changes (publishing them replaces the GitHub version).\nCancel opens the GitHub version and discards your changes.');
    if (seq !== navSeq) return;
    if (keep) {
      c = {...c, meta: normMeta(local.meta), slug: local.slug || c.slug, dirty: true};
      d = schema.nodeFromJSON(local.doc);
      msg = `Restored your unpublished changes from ${when(local.updated)}.`;
    } else {
      await store.deleteDraft(path).catch(() => {});
      dropBackup(path);
    }
  }
  notice('');
  if (mount(c, d, held, seq)) status(msg);
}

// --- publish, delete, discard ------------------------------------------------------------

function busy(on) {
  busyNow = on;
  busyURL = on ? location.href : '';
  if (on) navSeq++;  // a navigation still on its way stops itself
  setLocked();
  updateBar();
  if (!on && signOutLater) signOutHere();
}

function paperProblem(m) {
  if (m.kind !== 'paper') return '';
  const p = m.paper;
  if (p.link.trim() && !cleanURL(p.link)) return 'The link to the paper is not a web address (it needs https://, a DOI or an arXiv number).';
  for (const l of p.links) {
    const label = visible(l.label) ? oneLine(l.label) : '', url = visible(l.url) ? l.url.trim() : '';
    if (url && !cleanURL(url)) return `The paper's link "${label || url}" is not a web address.`;
    if (url && !label) return "One of the paper's links has no label; give it one, like PDF.";
    if (label && !url) return `The paper's link "${label}" has no address.`;
  }
  return '';
}

async function publish() {
  if (!gh || !canEdit()) return;
  closePopover(true);
  const c = cur, m = c.meta;
  const slug = newSlug(c.slug || m.title);
  const address = `/blog/${slug}/`;
  const problem = !oneLine(m.title) ? 'Give the post a title first.'
    : !m.kind ? 'Choose what it is first: Paper summary or Concept, above the title.'
    : !slug ? 'The address is empty; type one next to Address.'
    : RESERVED.has(address) ? `${address} is used by the site itself; choose another address.`
    : descriptionProblem(m.description) || paperProblem(m);
  if (problem) return status(problem, 'error');
  busy(true);
  try {
    await flush();
    status(m.draft ? 'Saving the draft to GitHub…' : 'Publishing…');
    const doc = view.state.doc, date = m.date || stamp();
    // a question answered yes once is not asked again on a later try
    const yes = new Set();
    const ask = (key, q) => yes.has(key) || (confirm(q) && !!yes.add(key));
    const uploads = new Map();
    // When another commit lands on the branch meanwhile (another agent
    // writing the site), GitHub refuses this one, and the checks run again on
    // the new head.
    for (let attempt = 1; ; attempt++) {
      const head = await gh.head();
      const posts = await listPosts(head.tree);
      const mine = c.path && posts.find(p => p.path === c.path);
      const path = `${POSTS}/${date.slice(0, 10)}-${slug}.html`;
      const old = c.path ? slugOfPath(c.path) : null;
      const redirects = m.redirects.filter(r => r !== address);
      if (old && old !== slug && c.public && !redirects.includes(`/blog/${old}/`)) redirects.push(`/blog/${old}/`);
      const {files, map} = await newImages(doc, slug, head.sha, uploads);
      const text = await postFile({...m, date, redirects}, doc, src => map.get(src) || src);
      const others = posts.filter(p => p.path !== c.path);
      const there = posts.find(p => p.path === path);
      // the very file this would write is on GitHub already (an earlier try
      // whose answer was lost, or a tab closed while it published)
      if (there && !files.length && text === await gh.blobText(there.sha)) {
        return await done(c, doc, path, there.sha, map, redirects, () =>
          status(there === mine ? 'The site already has this version; nothing to publish.' : 'The site already has this post; nothing to publish.', 'ok'));
      }
      if (c.path && !mine && !ask('gone', 'This post is no longer on GitHub (it was deleted or renamed elsewhere). Publish it again?')) {
        return status('Not published.');
      }
      if (mine && mine.sha !== c.baseSha && !ask('changed ' + mine.sha, 'This post was changed on GitHub after you opened it. Publish anyway, replacing those changes?')) {
        return status('Not published. "Discard changes" loads the GitHub version.');
      }
      const clash = others.find(p => p.addresses.includes(address));
      if (clash && oneLine(clash.title) === oneLine(m.title)) {
        return status(`A post titled "${clash.title}" is already at ${address}: probably this one, published earlier. Open it from the Posts page (your changes here stay in the list) instead of publishing it again.`, 'error');
      }
      if (clash) {
        return status(clash.address === address
          ? `Another post${clash.draft ? ' (a draft)' : ''} already has the address ${address} ("${clash.title}"); choose another address.`
          : `${address} is the old address of "${clash.title}", which it redirects to; choose another address.`, 'error');
      }
      if (there && there !== mine) return status(`${path} already exists; choose another address.`, 'error');
      const verb = m.draft ? 'Save blog draft' : c.path && c.public ? 'Update blog post' : 'Publish blog post';
      // the date is fixed (and saved) as the commit goes out, so a try after
      // a lost answer writes the same file and finds the post already there
      if (!m.date) {
        m.date = date;
        await saveDraft();
      }
      try {
        // on the head checked above: if the branch moved, GitHub refuses
        const res = await gh.commit(`${verb} "${oneLine(m.title)}"`, [{path, text}, ...files], mine && c.path !== path ? [c.path] : [], {base: head});
        for (const f of files) uploads.set(f.src, {name: f.path.split('/').pop(), sha: f.sha});
        return await done(c, doc, path, res.shas[path], map, redirects, () => {
          if (m.draft) status(`Draft saved to GitHub at ${clock(Date.now())}; it is not on the site.`, 'ok');
          else statusLink(`Published at ${clock(Date.now())}; the site shows it within a minute or two. `, addressFor(slug), 'View the post');
        });
      } catch (e) {
        for (const f of files) if (f.sha) uploads.set(f.src, {name: f.path.split('/').pop(), sha: f.sha});
        if (attempt < 3 && e.status === 422 && /fast.forward/i.test(e.message)) continue;
        throw e;
      }
    }
  } catch (e) {
    status(`Not published: ${explain(e)}`, 'error');
  } finally {
    busy(false);
  }
}

// After a publish: the post is the file at path, and what is open is what
// GitHub has (unless the text changed meanwhile). A post that takes a new id
// (a first publish, a rename) needs that id's lock: without it another tab
// holds the post, so this one turns read-only. Unpublished changes to that
// post saved earlier (in a tab since closed) are kept, and opened here.
async function done(c, doc, path, sha, map, redirects, msg) {
  const m = c.meta, oldId = c.id, same = cur === c && view.state.doc.eq(doc);
  m.redirects = redirects;
  Object.assign(c, {id: path, path, baseSha: sha, public: !m.draft, slug: slugOfPath(path), slugTouched: true, dirty: !same});
  const held = oldId === path || await lock(path);
  swapImageSources(map);
  await store.deleteDraft(oldId).catch(() => {});
  dropBackup(oldId);
  let earlier = null;
  if (held && oldId !== path) {
    await restoreBackup(path);
    earlier = await store.getDraft(path).catch(() => null);
    if (earlier && !earlier.dirty) {
      await store.deleteDraft(path).catch(() => {});
      earlier = null;
    }
  }
  if (cur !== c) return;
  readOnly = !held;
  history.replaceState(null, '', '?' + new URLSearchParams({post: path}));
  if (earlier) {
    if (mount({...c, meta: normMeta(earlier.meta), slug: earlier.slug || c.slug, dirty: true}, schema.nodeFromJSON(earlier.doc), true)) {
      status(`Done. This post also had unpublished changes from ${when(earlier.updated)}; they are open now (Discard changes drops them).`, 'error');
    }
    return;
  }
  if (!same && held) await saveDraft();
  renderHeader();
  if (held) msg();
  else status('Done. This post is also open in another tab or window, so it is read-only here.', 'error');
}

// Text files of the site that may show a blog image: pages, posts, log
// entries, layouts and data (not the vendored libraries).
const SITE_TEXT = /^docs\/(?!assets\/).+\.(md|markdown|mkdn?|mkdown|html?|xml|ya?ml|json|csv|tsv|s?css|sass|txt)$/i;

async function deletePost() {
  if (!gh || !cur.path || !canEdit()) return;
  closePopover(true);
  const c = cur, title = oneLine(c.meta.title) || 'this post';
  if (!confirm(`Delete "${title}" from the site? The post, and the images no other page shows, are removed from the repository (the git history keeps a copy).`)) return;
  busy(true);
  status('Deleting…');
  try {
    await flush();
    for (let attempt = 1; ; attempt++) {
      try {
        await deleteOn(c, await gh.head());
        break;
      } catch (e) {
        // another commit landed meanwhile: check the images again on the new head
        if (attempt < 3 && e.status === 422 && /fast.forward/i.test(e.message)) continue;
        throw e;
      }
    }
    clearTimeout(saveTimer);
    clearTimeout(maxTimer);
    saveTimer = maxTimer = null;
    await store.deleteDraft(c.id).catch(() => {});
    dropBackup(c.id);
    busyNow = false;
    history.pushState(null, '', location.pathname);
    await showList(`Deleted "${title}". The site drops it within a minute or two.`, 'ok');
  } catch (e) {
    status(`Not deleted: ${explain(e)}`, 'error');
  } finally {
    if (busyNow) busy(false);
  }
}

// One delete commit on head: the post, and its images that no other page
// of the site, and no draft in this browser, shows.
async function deleteOn(c, head) {
  const all = await gh.files(head.tree);
  const mine = all.find(f => f.path === c.path);
  if (!mine) throw new Error('the post is not at this address on GitHub any more (renamed or deleted elsewhere); open it again from the Posts page');
  // its images go too, unless another page of the site, or a draft in this
  // browser, shows them (pages, posts, data; not generated assets or big files)
  const site = f => f.path.slice(4);  // docs/assets/... -> /assets/...
  const folder = `/assets/img/blog/${slugOfPath(c.path)}/`;
  const text = await gh.blobText(mine.sha);
  const mineShows = all.filter(f => site(f).startsWith(folder) && text.includes(site(f)));
  let gone = [];
  if (mineShows.length) {
    const pages = all.filter(f => f !== mine && SITE_TEXT.test(f.path) && !(f.size > 1e6));
    const others = await mapLimit(pages, 6, f => gh.blobText(f.sha));
    for (const d of await store.allDrafts().catch(() => [])) if (d.id !== c.id) others.push(JSON.stringify(d.doc));
    gone = mineShows.filter(f => !others.some(t => t.includes(site(f)))).map(f => f.path);
  }
  // on the head checked above: if the branch moved, GitHub refuses
  await gh.commit(`Delete blog post "${oneLine(c.meta.title)}"`, [], [c.path, ...gone], {base: head});
}

async function discard() {
  if (!canEdit()) return;
  closePopover(false);
  const c = cur, title = oneLine(c.meta.title) || 'Untitled';
  const ask = c.path ? `Discard your unpublished changes to "${title}" and load the version on GitHub?`
    : `Delete the draft "${title}" from this browser? It was never published, so it cannot be brought back.`;
  if (!confirm(ask)) return;
  if (c.path && !gh) return status('Sign in on the Posts page to load the version on GitHub.', 'error');
  busy(true);
  try {
    await flush();
    if (!c.path) {
      await store.deleteDraft(c.id).catch(() => {});
      dropBackup(c.id);
      busyNow = false;
      history.pushState(null, '', location.pathname);
      return await showList();
    }
    status('Loading the version on GitHub…');
    const sha = await gh.fileSha(c.path);
    if (!sha) throw new Error('the post is no longer on GitHub');
    const {meta, doc} = parsePost(await gh.blobText(sha));
    if (!meta.date) meta.date = dateOfPath(c.path);
    await store.deleteDraft(c.id).catch(() => {});
    dropBackup(c.id);
    busyNow = false;
    if (mount({id: c.path, path: c.path, baseSha: sha, public: !meta.draft, meta, slug: slugOfPath(c.path),
      slugTouched: true, dirty: false}, doc, true)) status('Loaded the version on GitHub.');
  } catch (e) {
    status(`Could not load the version on GitHub (${explain(e)}); your changes are kept.`, 'error');
  } finally {
    if (busyNow) busy(false);
  }
}

// Images kept for drafts that are gone: dropped after a month.
async function tidyImages() {
  try {
    const day = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('blog-editor-tidied') === day) return;
    localStorage.setItem('blog-editor-tidied', day);
    const [drafts, images] = await Promise.all([store.allDrafts(), store.allImages()]);
    const used = new Set();
    for (const d of drafts) for (const m of JSON.stringify(d.doc).matchAll(/"local:([^"]+)"/g)) used.add(m[1]);
    const old = Date.now() - 30 * 864e5;
    for (const im of images) if (!used.has(im.id) && im.added < old) store.deleteImage(im.id).catch(() => {});
  } catch (e) { /* storage off */ }
}

async function init() {
  if (window.top !== window.self) {
    root.textContent = 'The editor does not run inside a frame; open it directly.';
    return;
  }
  wire();
  await restoreBackups();
  let token = null;
  try {
    token = localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);
  } catch (e) { /* storage off */ }
  let msg = '';
  if (token) {
    gh = new GitHub(token, REPO, BRANCH);
    try {
      login = (await gh.user()).login;
    } catch (e) {
      if (e.status === 401) {
        gh = null;
        try {
          localStorage.removeItem(TOKEN);
          sessionStorage.removeItem(TOKEN);
        } catch (_) { /* storage off */ }
        msg = 'GitHub no longer accepts the saved token; sign in with a new one.';
      }
    }
  }
  window.addEventListener('popstate', route);
  // a sign-out in another tab signs this one out too (after any publish
  // running here), whichever storage held its token
  window.addEventListener('storage', e => {
    if (e.key === OWNER && !e.newValue && gh) signOutHere();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    backup();
    if (saveTimer) saveDraft();
  });
  window.addEventListener('pagehide', backup);
  window.addEventListener('beforeunload', e => {
    backup();
    if (busyNow) e.preventDefault();
  });
  tidyImages();
  await route();
  if (msg && !cur) notice(msg, 'error');
}

init();
