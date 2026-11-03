// Post files as the editor writes them: YAML front matter, then the body as
// HTML in the shape kramdown gives Markdown posts (pens as span classes,
// boxes as blockquotes, Rouge code blocks, kramdown footnotes and contents
// list), so main.css styles both alike. Math is \( \) and \[ \] in a
// .math-tex element, which the KaTeX on blog pages renders.
import {DOMParser as PMDOMParser} from '../../vendor/prosemirror/model.js';
import {load as loadYAML, dump as dumpYAML} from '../../vendor/js-yaml.js';
import {schema, safeHref, safeSrc, clean, PENS, HIGHLIGHTERS, LINES, BOXES, LIST_STYLES} from './schema.js';
import {highlight, escapeHTML} from './code.js';

// a post's file name, as Jekyll 3.10 reads it (DATE_FILENAME_MATCHER)
export const POST_NAME = /^(\d{2,4})-(\d{1,2})-(\d{1,2})-(.+)\.([^.]+)$/;
export const RESERVED = new Set(['/blog/', '/blog/style/', '/blog/edit/']);

export function emptyMeta(kind = null) {
  return {
    title: '', kind, fields: [], description: '', date: null,
    paper: {title: '', authors: '', venue: '', link: '', links: []},
    toc: false, draft: false, redirects: [], extra: {},
  };
}

// --- slugs and addresses (as in tools/blogtools.py) ---------------------------

function slugify(text, keep) {
  let out = '', dash = false;
  for (const ch of text) {
    if (/[\p{L}\p{M}\p{Nd}]/u.test(ch) || keep.includes(ch)) {
      out += ch;
      dash = false;
    } else if (!dash) {
      out += '-';
      dash = true;
    }
  }
  return out.replace(/^-+|-+$/g, '');
}
// a new post's slug: letters, marks and digits joined by hyphens, lower case
export const newSlug = text => slugify(String(text).toLowerCase(), '');
// Jekyll's slugify in "pretty" mode, cased
export const jekyllSlug = text => slugify(String(text), "._~!$&'()+,;=@");

// The address Jekyll gives a post file, or null for a permalink this does not know.
export function addressOf(name, fm) {
  const m = POST_NAME.exec(name);
  if (!m) return null;
  const [, y, mo, d, nameSlug] = m;
  const slug = String(fm.slug || nameSlug);
  const two = n => String(+n).padStart(2, '0');
  const values = {
    title: jekyllSlug(slug), slug: newSlug(slug), year: y, month: two(mo), day: two(d), i_month: String(+mo),
    i_day: String(+d), short_year: y.slice(-2), output_ext: '.html', categories: '',
  };
  let link = String(fm.permalink || '/blog/:title/');
  for (const k of Object.keys(values).sort((a, b) => b.length - a.length)) link = link.split(':' + k).join(values[k]);
  if (/:[a-z_]+/.test(link)) return null;
  return ('/' + link.replace(/^\/+/, '')).replace(/\/+/g, '/');
}

// "2026-11-02 14:03:00 -0500", the form Jekyll reads, in this browser's zone
export function stamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset(), a = Math.abs(off);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ` +
    `${off >= 0 ? '+' : '-'}${p(Math.floor(a / 60))}${p(a % 60)}`;
}

// --- front matter -------------------------------------------------------------

const FRONT = /^---[ \t]*\r?\n([\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;
const KNOWN = new Set(['title', 'kind', 'fields', 'description', 'summary', 'date', 'paper', 'toc', 'published', 'redirect_from']);

export function splitFile(text) {
  const m = FRONT.exec(text);
  if (!m) return {fm: {}, raw: '', body: text};
  const fm = loadYAML(m[1] || '') || {};
  return {fm: typeof fm === 'object' && !Array.isArray(fm) ? fm : {}, raw: m[1] || '', body: text.slice(m[0].length)};
}

const str = v => (v == null ? '' : String(v));
const list = v => (Array.isArray(v) ? v.map(String) : v ? String(v).split(/[\s,]+/).filter(Boolean) : []);

// A post's date as the editor writes it, from the forms Jekyll reads:
// "2026-11-02 14:03:00 -0500" when it has a time, "2026-11-02" when not,
// "2026-11-02 14:03:00" when it has a time but no zone (Jekyll reads that in
// the site's zone). Null when there is none, or none this can read (the
// caller then takes the file name's date, as Jekyll does).
function normDate(v) {
  const t = String(v || '').replace(/\s+#.*$/, '').replace(/^(['"])(.*)\1$/, '$2').trim();
  const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|UTC|GMT|[+-]\d{2}:?\d{2})?(?:\s+[A-Z]{2,5})?$/i.exec(t);
  if (!m) return null;
  const p2 = n => String(+n).padStart(2, '0');
  const day = `${m[1]}-${p2(m[2])}-${p2(m[3])}`;
  if (m[4] == null) return day;
  const time = `${p2(m[4])}:${m[5]}:${p2(m[6] || 0)}`;
  if (!m[7]) return `${day} ${time}`;
  const zone = /^(Z|UTC|GMT)$/i.test(m[7]) ? '+0000' : m[7].replace(':', '');
  return `${day} ${time} ${zone}`;
}

// YAML 1.1, which Jekyll reads, also has yes/no/on/off for true and false
const yes = v => v === true || /^(y|yes|true|on)$/i.test(String(v));
const no = v => v === false || /^(n|no|false|off)$/i.test(String(v));

export function metaFrom(fm, raw) {
  const date = /^date:[ \t]*(.+?)[ \t]*$/m.exec(raw);
  const paper = fm.paper && typeof fm.paper === 'object' ? fm.paper : {};
  return {
    title: str(fm.title),
    kind: fm.kind ? String(fm.kind) : null,
    fields: list(fm.fields),
    description: str(fm.description ?? fm.summary).split(/(\$\$[^$]*\$\$)/).map((part, i) =>
      (i % 2 ? part.replace(/\\lt /g, '<').replace(/\\Vert /g, '\\|').replace(/\\vert /g, '|') : part)).join(''),
    date: date ? normDate(date[1]) : null,
    paper: {
      title: str(paper.title), authors: str(paper.authors), venue: str(paper.venue), link: str(paper.link),
      links: Array.isArray(paper.links) ? paper.links.map(l => ({label: str(l && l.label), url: str(l && l.url)})) : [],
    },
    toc: yes(fm.toc),
    draft: no(fm.published),
    redirects: list(fm.redirect_from),
    extra: Object.fromEntries(Object.entries(fm).filter(([k]) => !KNOWN.has(k))),
  };
}

export {clean};
const quote = s => JSON.stringify(clean(s));
// text with something to show: not only spaces and zero-width characters
export const visible = s => !!clean(s).replace(/[\s\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u206a-\u206f\u2800\u3164\ufe00-\ufe0f\ufeff\uffa0\u{e0000}-\u{e007f}]/gu, '');
const word = s => (/^[\w-]+$/.test(s) ? s : quote(s));
const oneLine = s => clean(s).replace(/\s+/g, ' ').trim();
// A link as the post holds it, safe to put in href="" as it is. A bare
// domain ("arxiv.org/abs/1") gets https://, a DOI its doi.org address, an
// arXiv number its abstract page, an e-mail address mailto:. With absolute
// (the paper's links), only an http(s) address with a host will do;
// otherwise links within the site are fine too. Empty when it is not a link.
// file endings that are not also web domains (.md, .py, .sh, .rs ... are)
const FILE_NAME = /\.(pdf|eps|png|jpe?g|gif|svg|webp|avif|ico|tiff?|bmp|html?|xml|txt|rst|tex|bib|cls|sty|ipynb|jl|cpp|hpp|cu|java|js|jsx|ts|tsx|php|sql|css|ya?ml|toml|ini|cfg|conf|log|csv|tsv|json|lock|dat|mat|npy|npz|pkl|pt|pth|ckpt|h5|hdf5|root|gz|tgz|bz2|xz|tar|zip|docx?|pptx?|xlsx?|key|odt|mp[34]|mov|wav)$/i;
export function webURL(s, absolute = false) {
  let t = oneLine(s).replace(/^<(.*)>$/, '$1');
  const doi = /^(?:doi:\s*|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/\S+)$/i.exec(t);
  if (doi) t = 'https://doi.org/' + doi[1].replace(/#/g, '%23').replace(/\?/g, '%3F');
  else if (/^(arxiv:\s*)?(\d{4}\.\d{4,5}|[a-z-]+(\.[a-z]{2})?\/\d{7})(v\d+)?$/i.test(t)) t = 'https://arxiv.org/abs/' + t.replace(/^arxiv:\s*/i, '');
  else if (/^[^@\s/:]+@[^@\s/:]+\.[a-z]{2,}$/i.test(t)) t = 'mailto:' + t;
  else if (/^([a-z0-9-]+\.)+[a-z]{2,}([/?#]\S*)?$/i.test(t) && !FILE_NAME.test(t.split(/[/?#]/)[0])) t = 'https://' + t;
  const u = safeHref(t);
  if (!u) return '';
  const web = /^https?:/i.test(u);
  // a web address needs a host: letters or digits before any port, path, query or fragment
  if ((web && !/^https?:\/\/([^\s/?#@]*@)?(\[[0-9a-f:.]+\]|[\p{L}\p{N}_.-]*[\p{L}\p{N}])(:\d*)?([/?#]|$)/iu.test(u)) || (absolute && !web)) return '';
  return u.replace(/ /g, '%20').replace(/"/g, '%22').replace(/</g, '%3C').replace(/>/g, '%3E');
}
export const cleanURL = s => webURL(s, true);

// The layouts read the description as Markdown (as for posts written by
// hand), so a link or a {: } attribute list in it would act on the site.
export function descriptionProblem(text) {
  const t = descMath(oneLine(text));
  if (/\]\(|\{:/.test(t)) return 'The description cannot hold Markdown links or {: } lists; plain text, **bold**, *italic* and $$math$$ work.';
  // the feed holds it in CDATA after strip_html, which drops every <...>
  if (/<[^>]*>/.test(t)) return 'The description cannot hold text between < and > (the feed drops it); in math, < is fine.';
  if (/\]\]>/.test(t.replace(/<.*?>/g, ''))) return 'The description cannot hold "]]>" (the feed breaks on it).';
  return '';
}

// In the description's $$math$$, < and | are written \lt and \vert (\| as
// \Vert): the layouts escape those two characters before kramdown reads it.
const descMath = t => t.split(/(\$\$[^$]*\$\$)/).map((part, i) =>
  (i % 2 ? part.replace(/\\\|/g, '\\Vert ').replace(/(?<!\\)</g, '\\lt ').replace(/(?<!\\)\|/g, '\\vert ') : part)).join('');

export function frontMatter(m) {
  const out = [`title: ${quote(oneLine(m.title))}`];
  if (m.kind) out.push(`kind: ${word(m.kind)}`);
  out.push(`fields: [${m.fields.map(word).join(', ')}]`);
  if (oneLine(m.description)) out.push(`description: ${quote(descMath(oneLine(m.description)))}`);
  if (m.date) out.push(`date: ${m.date}`);
  const p = m.paper;
  const links = p.links.map(l => ({label: oneLine(l.label), url: cleanURL(l.url)})).filter(l => visible(l.label) && l.url);
  const fields = [['title', oneLine(p.title)], ['authors', oneLine(p.authors)], ['venue', oneLine(p.venue)], ['link', cleanURL(p.link)]];
  if (m.kind === 'paper' && (fields.some(([, v]) => v) || links.length)) {
    out.push('paper:');
    for (const [k, v] of fields) if (v) out.push(`  ${k}: ${quote(v)}`);
    if (links.length) {
      out.push('  links:');
      for (const l of links) out.push(`    - label: ${quote(l.label)}`, `      url: ${quote(l.url)}`);
    }
  }
  if (m.toc) out.push('toc: true');
  if (m.draft) out.push('published: false');
  if (m.redirects.length) out.push(`redirect_from: [${m.redirects.map(quote).join(', ')}]`);
  let text = out.join('\n') + '\n';
  if (Object.keys(m.extra).length) text += dumpYAML(m.extra);
  return text;
}

// --- body: document -> HTML -----------------------------------------------------

const escAttr = s => clean(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = s => escapeHTML(clean(s)).replace(/\u00a0/g, '&nbsp;');
// Blog pages run KaTeX over the whole page, which would read $$, \( or \[ in
// plain text as the start of math; an empty span keeps such text as text.
const guard = s => s.replace(/\$(?=\$)/g, '$<span></span>').replace(/\\(?=[([])/g, '\\<span></span>');

// Only known values reach a class or a number in the file, whatever a
// pasted document claimed (ProseMirror trusts the attributes in pasted HTML).
const one = (v, list) => (list.includes(v) ? v : null);
const whole = (v, d, lo = 0) => (Number.isInteger(+v) && +v >= lo ? +v : d);

function openMark(m) {
  const a = m.attrs;
  switch (m.type.name) {
    case 'link': return `<a href="${escAttr(safeHref(a.href))}">`;
    case 'pen': return one(a.color, PENS) ? `<span class="${a.color}">` : '<span>';
    case 'hl': return one(a.color, HIGHLIGHTERS) && a.color !== 'blue' ? `<mark class="hl-${a.color}">` : '<mark>';
    case 'line': {
      const pen = one(a.color, PENS);
      return `<span class="${one(a.style, LINES) || 'ul'}"${pen ? ` style="--pen: var(--pen-${pen})"` : ''}>`;
    }
    case 'strong': return '<strong>';
    case 'em': return '<em>';
    case 'strike': return '<del>';
    case 'code': return '<code>';
    case 'kbd': return '<kbd>';
  }
  return '';
}
const CLOSE = {link: '</a>', pen: '</span>', hl: '</mark>', line: '</span>', strong: '</strong>',
  em: '</em>', strike: '</del>', code: '</code>', kbd: '</kbd>'};

const plain = node => {
  let s = '';
  node.forEach(c => {
    if (c.isText) s += c.text;
    else if (c.type.name === 'hard_break') s += ' ';
  });
  return s;
};

function leaf(node, ctx, mode) {
  switch (node.type.name) {
    case 'text': {
      const t = escText(mode.text ?? node.text);
      return node.marks.some(m => m.type.name === 'code') ? t : guard(t);
    }
    case 'hard_break': return '<br />';
    case 'math_inline': {
      const tex = node.attrs.tex;
      return tex.trim() ? `<span class="math-tex" data-tex="${escAttr(tex)}">\\(${escText(tex)}\\)</span>` : '';
    }
    case 'footnote': {
      if (mode.toc || mode.note) return '';
      const n = ctx.notes.push(inline(node, ctx, {note: true}));
      return `<sup id="fnref:${n}"><a href="#fn:${n}" class="footnote" rel="footnote" role="doc-noteref">${n}</a></sup>`;
    }
  }
  return '';
}

// Marks a piece of inline content is written with: a footnote number is a
// link of its own, KaTeX skips math inside code, and a link must go somewhere
// safe.
function marksOf(child, mode) {
  const name = child.type.name;
  return child.marks.filter(m => {
    if (m.type.name === 'link') return !mode.toc && name !== 'footnote' && !!safeHref(m.attrs.href);
    if (m.type.name === 'code') return name !== 'math_inline';
    return true;
  });
}

// Inline content, with marks opened and closed in schema order so they nest.
// Text is written as the page will read it back: a run of spaces is one
// space, and none is kept at the start, after a space or a line break, or at
// the end. So a post read back writes the same file.
function inline(parent, ctx, mode = {}) {
  // what each child writes (empty math writes nothing and is skipped)
  const items = [];
  let space = true;
  parent.forEach(child => {
    if (child.isText) {
      let text = clean(child.text).replace(/[ \t\r\n\f]+/g, ' ');
      if (space && text.startsWith(' ')) text = text.slice(1);
      if (!text) return;
      space = text.endsWith(' ');
      items.push({child, text});
    } else if (child.type.name !== 'math_inline' || child.attrs.tex.trim()) {
      space = child.type.name === 'hard_break';
      items.push({child});
    }
  });
  while (items.length && items[items.length - 1].text != null && items[items.length - 1].text.endsWith(' ')) {
    const end = items[items.length - 1];
    end.text = end.text.slice(0, -1);
    if (end.text) break;
    items.pop();
  }
  let out = '';
  const open = [];
  for (const {child, text} of items) {
    const marks = marksOf(child, mode);
    let keep = 0;
    while (keep < open.length && keep < marks.length && open[keep].eq(marks[keep])) keep++;
    while (open.length > keep) out += CLOSE[open.pop().type.name];
    for (let i = keep; i < marks.length; i++) {
      out += openMark(marks[i]);
      open.push(marks[i]);
    }
    out += leaf(child, ctx, child.isText ? {...mode, text} : mode);
  }
  while (open.length) out += CLOSE[open.pop().type.name];
  return out;
}

function headingId(ctx, text) {
  let base = clean(text).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
  let id = base, n = 1;
  while (ctx.ids.has(id)) id = `${base}-${n++}`;
  ctx.ids.add(id);
  return id;
}

const isList = n => n.type.name === 'bullet_list' || n.type.name === 'ordered_list';

// An item's first line, then what follows it (blocks that write nothing
// left out). One line, alone or before nested lists, is a tight item with
// its text straight in the <li>; otherwise each block is written whole, the
// first line too even when empty, since an item must start with one.
function listItem(li, ctx) {
  const a = li.attrs, kids = li.content.content;
  const cls = [a.checked != null && 'task-list-item', one(a.pen, PENS)].filter(Boolean).join(' ');
  const box = a.checked == null ? '' :
    `<input type="checkbox" class="task-list-item-checkbox" disabled="disabled"${a.checked ? ' checked="checked"' : ''} />`;
  const first = inline(kids[0], ctx);
  const rest = kids.slice(1).map(k => ({k, html: block(k, ctx)})).filter(r => r.html);
  let body;
  if (first && !kids[0].attrs.margin && rest.every(r => isList(r.k))) body = box + first + rest.map(r => '\n' + r.html).join('');
  else if (!rest.length && !kids[0].attrs.margin) body = box + first;
  else body = [`<p${kids[0].attrs.margin ? ' class="margin"' : ''}>${box}${first}</p>`, ...rest.map(r => r.html)].join('\n');
  return `<li${cls ? ` class="${cls}"` : ''}>${body}</li>`;
}

function cell(c, ctx) {
  const tag = c.type.name === 'table_header' ? 'th' : 'td';
  const cs = whole(c.attrs.colspan, 1, 1), rs = whole(c.attrs.rowspan, 1, 1);
  const span = (cs > 1 ? ` colspan="${cs}"` : '') + (rs > 1 ? ` rowspan="${rs}"` : '');
  const parts = c.content.content.map(k => ({k, html: block(k, ctx)})).filter(r => r.html);
  // one plain paragraph: its text straight in the cell
  const inner = parts.length === 1 && parts[0].k.type.name === 'paragraph' && !parts[0].k.attrs.margin
    ? parts[0].html.replace(/^<p>|<\/p>$/g, '') : parts.map(r => r.html).join('\n');
  return `<${tag}${span}>${inner}</${tag}>`;
}

function block(node, ctx) {
  const a = node.attrs;
  switch (node.type.name) {
    case 'paragraph': {
      const inner = inline(node, ctx);
      return inner ? `<p${a.margin ? ' class="margin"' : ''}>${inner}</p>` : '';
    }
    case 'heading': {
      const inner = inline(node, ctx);
      if (!inner) return '';
      const level = [2, 3, 4, 5].includes(+a.level) ? +a.level : 2;
      const id = headingId(ctx, plain(node));
      ctx.headings.push({level, id, html: inline(node, ctx, {toc: true})});
      return `<h${level} id="${escAttr(id)}">${inner}</h${level}>`;
    }
    case 'box': {
      const inner = node.content.content.map(k => block(k, ctx)).filter(Boolean).join('\n');
      if (!inner) return '';
      const kind = one(a.kind, BOXES), pen = kind && one(a.pen, PENS);
      const cls = kind ? [kind, pen, pen && 'ink'].filter(Boolean).join(' ') : '';
      const label = kind && clean(a.label || '').trim() ? ` data-label="${escAttr(clean(a.label).trim())}"` : '';
      return `<blockquote${cls ? ` class="${cls}"` : ''}${label}>\n${inner}\n</blockquote>`;
    }
    case 'bullet_list':
    case 'ordered_list': {
      const tag = node.type.name === 'bullet_list' ? 'ul' : 'ol';
      const task = node.content.content.some(li => li.attrs.checked != null);
      const cls = [one(a.style, LIST_STYLES), task && 'task-list'].filter(Boolean).join(' ');
      const order = whole(a.order, 1);
      const start = tag === 'ol' && order !== 1 ? ` start="${order}"` : '';
      const items = node.content.content.map(li => listItem(li, ctx)).join('\n');
      return `<${tag}${cls ? ` class="${cls}"` : ''}${start}>\n${items}\n</${tag}>`;
    }
    case 'code_block': {
      if (!clean(node.textContent)) return '';
      const lang = String(a.language || 'plaintext').replace(/[^\w+#-]/g, '') || 'plaintext';
      const html = ctx.code.get(node) ?? escText(node.textContent);
      // a newline at the end, as kramdown writes it (the reader takes one off)
      return `<div class="language-${lang} highlighter-rouge"><div class="highlight"><pre class="highlight"><code>${html}\n</code></pre></div></div>`;
    }
    case 'math_display':
      return a.tex.trim() ? `<div class="math-tex" data-tex="${escAttr(a.tex)}">\\[${escText(a.tex)}\\]</div>` : '';
    case 'figure': {
      const safe = safeSrc(ctx.imageSrc(a.src));
      if (!safe) return '';
      if (/^(local|data):/.test(safe)) throw new Error('an image was not uploaded with the post');
      const src = escAttr(safe);
      const cap = inline(node, ctx);
      return `<figure class="plot">\n<a class="plot__img" href="${src}"><img src="${src}" alt="${escAttr(a.alt)}" loading="lazy"></a>` +
        (cap ? `\n<figcaption class="plot__caption">${cap}</figcaption>` : '') + '\n</figure>';
    }
    case 'table': {
      const rows = node.content.content;
      let h = 0;
      while (h < rows.length && rows[h].content.content.every(c => c.type.name === 'table_header')) h++;
      const row = r => `<tr>${r.content.content.map(c => cell(c, ctx)).join('')}</tr>`;
      const head = h ? `<thead>\n${rows.slice(0, h).map(row).join('\n')}\n</thead>\n` : '';
      const body = rows.length > h ? `<tbody>\n${rows.slice(h).map(row).join('\n')}\n</tbody>\n` : '';
      return `<table>\n${head}${body}</table>`;
    }
  }
  return '';
}

// kramdown's contents list: nested lists of links to the headings
function contents(headings) {
  const root = {children: []};
  const stack = [{level: 0, item: root}];
  for (const h of headings) {
    while (stack.length > 1 && stack[stack.length - 1].level >= h.level) stack.pop();
    const item = {h, children: []};
    stack[stack.length - 1].item.children.push(item);
    stack.push({level: h.level, item});
  }
  const render = (items, top) => `<ul${top ? ' id="markdown-toc"' : ''}>\n` + items.map(it =>
    `<li><a href="#${escAttr(it.h.id)}" id="markdown-toc-${escAttr(it.h.id)}">${it.h.html}</a>` +
    (it.children.length ? '\n' + render(it.children, false) + '\n' : '') + '</li>').join('\n') + '\n</ul>';
  return render(root.children, true);
}

export function serializeBody(doc, {toc = false, imageSrc = s => s, code = new Map()} = {}) {
  const ctx = {ids: new Set(['main', 'markdown-toc']), headings: [], notes: [], imageSrc, code};
  const parts = [];
  doc.forEach(node => {
    const html = block(node, ctx);
    if (html) parts.push(html);
  });
  if (toc && ctx.headings.length) parts.unshift(contents(ctx.headings));
  if (ctx.notes.length) {
    parts.push('<div class="footnotes" role="doc-endnotes">\n<ol>\n' + ctx.notes.map((html, i) =>
      `<li id="fn:${i + 1}">\n<p>${html}&nbsp;<a href="#fnref:${i + 1}" class="reversefootnote" role="doc-backlink">&#8617;</a></p>\n</li>`).join('\n') +
      '\n</ol>\n</div>');
  }
  // Jekyll reads {{ and {% anywhere in a post as template code
  return parts.join('\n\n').replace(/\{/g, '&#123;');
}

export async function postFile(meta, doc, imageSrc) {
  const code = new Map();
  const blocks = [];
  doc.descendants(n => {
    if (n.type.name === 'code_block') blocks.push(n);
  });
  await Promise.all(blocks.map(async n => code.set(n, await highlight(clean(n.textContent), n.attrs.language))));
  return `---\n${frontMatter(meta)}---\n${serializeBody(doc, {toc: meta.toc, imageSrc, code})}\n`;
}

// --- body: HTML -> document -----------------------------------------------------

export function parseBody(html) {
  const dom = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html');
  const body = dom.body;
  body.querySelectorAll('#markdown-toc').forEach(e => e.remove());
  const notes = new Map();
  for (const li of body.querySelectorAll('.footnotes li[id^="fn:"]')) {
    li.querySelectorAll('a.reversefootnote').forEach(a => a.remove());
    const p = li.querySelector('p') || li;
    notes.set(li.id.slice(3), p.innerHTML.replace(/[ \t\r\n]*(?:&nbsp;|\u00a0)?[ \t\r\n]*$/, ''));
  }
  body.querySelectorAll('.footnotes').forEach(e => e.remove());
  for (const sup of body.querySelectorAll('sup[id^="fnref:"]')) {
    const span = dom.createElement('span');
    span.setAttribute('data-fn', '');
    span.innerHTML = notes.get(sup.id.slice(6)) || '';
    sup.replaceWith(span);
  }
  for (const div of body.querySelectorAll('div.highlighter-rouge')) {
    const pre = dom.createElement('pre');
    const lang = [...div.classList].find(c => c.startsWith('language-'));
    pre.setAttribute('data-language', lang && lang !== 'language-plaintext' ? lang.slice(9) : '');
    pre.textContent = div.textContent.replace(/\n$/, '');
    div.replaceWith(pre);
  }
  for (const el of body.querySelectorAll('.math-tex:not([data-tex])')) {
    el.setAttribute('data-tex', el.textContent.replace(/^\s*\\[([]/, '').replace(/\\[)\]]\s*$/, ''));
  }
  return PMDOMParser.fromSchema(schema).parse(body);
}

export function parsePost(text) {
  const {fm, raw, body} = splitFile(text);
  return {meta: metaFrom(fm, raw), doc: parseBody(body)};
}
