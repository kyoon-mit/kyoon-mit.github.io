// The document model of a blog post written in the editor (/blog/edit/).
// Parse rules read the HTML that format.js writes, and the kramdown HTML of
// the Markdown posts, so pasted posts keep their pens, boxes and lists.
import {Schema} from '../../vendor/prosemirror/model.js';
import {tableNodes} from '../../vendor/prosemirror/tables.js';

export const PENS = ['blue', 'red', 'green', 'purple', 'teal', 'magenta', 'pencil'];
export const HIGHLIGHTERS = ['blue', 'green', 'purple', 'red'];
export const LINES = ['ul', 'wavy', 'boxed', 'circled'];
export const BOXES = ['idea', 'definition', 'theorem', 'proof', 'example', 'question', 'caveat', 'summary'];
export const LIST_STYLES = ['decimal', 'alpha', 'upper-alpha', 'roman', 'upper-roman', 'disc', 'circle', 'square', 'dash', 'none'];

const penOf = el => PENS.find(c => el.classList.contains(c)) || null;
const styleOf = el => LIST_STYLES.find(c => el.classList.contains(c)) || null;
// a line drawn in its own pen: style="--pen: var(--pen-red)"
const linePen = el => {
  const m = /--pen:\s*var\(--pen-([a-z]+)\)/.exec(el.getAttribute('style') || '');
  return m && PENS.includes(m[1]) ? m[1] : null;
};
// TeX of a math element: ours keeps it in data-tex; KaTeX output (copied from
// a published page) keeps it in an annotation
const texOf = el => {
  const a = el.querySelector('annotation[encoding="application/x-tex"]');
  return el.getAttribute('data-tex') ?? (a ? a.textContent : el.textContent);
};
const langOf = el => {
  const c = el && [...el.classList].find(c => c.startsWith('language-'));
  return c ? c.slice(9) : '';
};

// Characters Jekyll's YAML reader refuses (control characters, unpaired
// surrogates, noncharacters), and that show as nothing on a page anyway.
// The post file never holds them (format.js).
const JUNK = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\ufdd0-\ufdef\ufffe\uffff]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;
export const clean = s => String(s).replace(JUNK, '');

// Links may point to the web, to mail, or within the site; nothing that runs
// code. The scheme is read from the link as the post file will hold it, with
// tabs and newlines dropped too, as browsers drop them.
export function safeHref(href) {
  const h = clean(href || '').replace(/[\t\n\r]/g, '').trim();
  if (!h) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(h);
  if (!scheme) return h;
  return /^(https?|mailto)$/i.test(scheme[1]) ? h : null;
}

// Image addresses: the web or the site, an image kept in this browser
// (local:), or image data in the post until it is published.
export function safeSrc(src) {
  const s = clean(src || '').replace(/[\t\n\r]/g, '').trim();
  if (/^local:[\w-]+$/.test(s)) return s;
  const d = /^data:image\/(png|jpeg|gif|webp|avif);base64,([\w+/=]+)$/i.exec(s);
  if (d) return `data:image/${d[1].toLowerCase()};base64,${d[2]}`;
  const h = safeHref(s);
  return h && !/^mailto:/i.test(h) ? h : null;
}

// TeX of a MathML element pasted from another site (Wikipedia, for one)
const mathmlTex = el => {
  const a = el.querySelector('annotation[encoding="application/x-tex"]');
  const t = (a ? a.textContent : el.getAttribute('alttext') || '').trim();
  return t.replace(/^\{\\displaystyle\s*([\s\S]*)\}$/, '$1').trim();
};

// Attribute checks: ProseMirror builds nodes from the attributes a pasted
// document carries (data-pm-slice) without parse rules, so each attribute
// says what it may hold, and anything else is refused.
const oneOf = list => v => {
  if (v !== null && !list.includes(v)) throw new RangeError('unknown value');
};
const isBool = v => {
  if (typeof v !== 'boolean') throw new RangeError('not true or false');
};
const isWhole = lo => v => {
  if (!Number.isInteger(v) || v < lo || v > 1e6) throw new RangeError('not a whole number');
};
const exactly = list => v => {
  if (!list.includes(v)) throw new RangeError('unknown value');
};
const isText = v => {
  if (typeof v !== 'string') throw new RangeError('not text');
};

function boxAttrs({kind, label, pen}) {
  const cls = kind ? [kind, pen, pen && 'ink'] : [];
  return {class: cls.filter(Boolean).join(' ') || null, 'data-label': kind && label ? label : null};
}

function taskState(el) {
  if (el.hasAttribute('data-checked')) return el.getAttribute('data-checked') === 'true';
  if (!el.classList.contains('task-list-item')) return null;
  const box = el.querySelector(':scope > input[type=checkbox], :scope > p:first-child > input[type=checkbox]');
  return box ? box.checked || box.hasAttribute('checked') : false;
}

const nodes = {
  doc: {content: 'block+'},
  paragraph: {
    content: 'inline*', group: 'block', attrs: {margin: {default: false, validate: isBool}},
    parseDOM: [{tag: 'p', getAttrs: el => ({margin: el.classList.contains('margin')})}],
    toDOM: n => ['p', n.attrs.margin ? {class: 'margin'} : {}, 0],
  },
  heading: {
    content: 'inline*', group: 'block', defining: true, attrs: {level: {default: 2, validate: exactly([2, 3, 4, 5])}},
    parseDOM: [1, 2, 3, 4, 5, 6].map(l => ({tag: 'h' + l, attrs: {level: Math.min(5, Math.max(2, l))}})),
    toDOM: n => ['h' + n.attrs.level, 0],
  },
  box: {
    content: 'block+', group: 'block', defining: true,
    attrs: {kind: {default: null, validate: oneOf(BOXES)}, label: {default: '', validate: isText}, pen: {default: null, validate: oneOf(PENS)}},
    parseDOM: [{tag: 'blockquote', getAttrs: el => ({
      kind: BOXES.find(k => el.classList.contains(k)) || null,
      label: el.getAttribute('data-label') || '',
      pen: penOf(el),
    })}],
    toDOM: n => ['blockquote', boxAttrs(n.attrs), 0],
  },
  bullet_list: {
    content: 'list_item+', group: 'block', attrs: {style: {default: null, validate: oneOf(LIST_STYLES)}},
    parseDOM: [{tag: 'ul', getAttrs: el => ({style: styleOf(el)})}],
    toDOM: n => ['ul', {class: n.attrs.style}, 0],
  },
  ordered_list: {
    content: 'list_item+', group: 'block',
    attrs: {order: {default: 1, validate: isWhole(0)}, style: {default: null, validate: oneOf(LIST_STYLES)}},
    parseDOM: [{tag: 'ol', getAttrs: el => ({
      order: Math.max(0, parseInt(el.getAttribute('start'), 10)) || (el.getAttribute('start') === '0' ? 0 : 1),
      style: styleOf(el),
    })}],
    toDOM: n => ['ol', {start: n.attrs.order === 1 ? null : n.attrs.order, class: n.attrs.style}, 0],
  },
  list_item: {
    content: 'paragraph block*', defining: true,
    // checked: null for a plain item, true or false for a checklist item;
    // pen: set by the editor when all of the item's text is in one pen
    attrs: {checked: {default: null, validate: oneOf([true, false])}, pen: {default: null, validate: oneOf(PENS)}},
    parseDOM: [{tag: 'li', getAttrs: el => ({checked: taskState(el), pen: penOf(el)})}],
    toDOM: n => ['li', {
      class: [n.attrs.checked != null && 'task-list-item', n.attrs.pen].filter(Boolean).join(' ') || null,
      'data-checked': n.attrs.checked == null ? null : String(n.attrs.checked),
    }, 0],
  },
  code_block: {
    content: 'text*', marks: '', group: 'block', code: true, defining: true,
    attrs: {language: {default: '', validate: isText}},
    parseDOM: [{tag: 'pre', preserveWhitespace: 'full', getAttrs: el => ({
      language: el.getAttribute('data-language') || langOf(el.querySelector('code')) || langOf(el.closest('[class*="language-"]')),
    })}],
    toDOM: n => ['pre', {'data-language': n.attrs.language || null}, ['code', 0]],
  },
  math_display: {
    group: 'block', atom: true, attrs: {tex: {default: '', validate: isText}},
    parseDOM: [
      {tag: 'div.math-tex', getAttrs: el => ({tex: texOf(el)})},
      {tag: 'span.katex-display', priority: 70, getAttrs: el => ({tex: texOf(el)})},
      {tag: 'math[display="block"]', priority: 65, getAttrs: el => (mathmlTex(el) ? {tex: mathmlTex(el)} : false)},
    ],
    toDOM: n => ['div', {class: 'math-tex', 'data-tex': n.attrs.tex}, n.attrs.tex],
  },
  figure: {
    content: 'inline*', group: 'block', defining: true,
    attrs: {src: {default: '', validate: v => { if (v !== '' && !safeSrc(v)) throw new RangeError('not an image address'); }}, alt: {default: '', validate: isText}},
    parseDOM: [
      {tag: 'figure', contentElement: el => el.querySelector('figcaption') || el.ownerDocument.createElement('figcaption'),
        getAttrs: el => {
          const img = el.querySelector('img'), src = img && safeSrc(img.getAttribute('src'));
          return src ? {src, alt: img.getAttribute('alt') || ''} : false;
        }},
      {tag: 'img[src]', getAttrs: el => {
        const src = safeSrc(el.getAttribute('src'));
        return src ? {src, alt: el.getAttribute('alt') || ''} : false;
      }},
    ],
    toDOM: n => ['figure', {class: 'plot'}, ['img', {src: n.attrs.src, alt: n.attrs.alt}], ['figcaption', {class: 'plot__caption'}, 0]],
  },
  ...tableNodes({tableGroup: 'block', cellContent: 'paragraph+', cellAttributes: {}}),
  text: {group: 'inline'},
  math_inline: {
    group: 'inline', inline: true, atom: true, attrs: {tex: {default: '', validate: isText}},
    parseDOM: [
      {tag: 'span.math-tex', priority: 60, getAttrs: el => ({tex: texOf(el)})},
      {tag: 'span.katex', priority: 60, getAttrs: el => ({tex: texOf(el)})},
      {tag: 'math', priority: 60, getAttrs: el => (mathmlTex(el) ? {tex: mathmlTex(el)} : false)},
    ],
    toDOM: n => ['span', {class: 'math-tex', 'data-tex': n.attrs.tex}, n.attrs.tex],
  },
  footnote: {
    group: 'inline', inline: true, atom: true, content: '(text | math_inline)*',
    parseDOM: [{tag: 'span[data-fn]', priority: 60}],
    toDOM: () => ['span', {'data-fn': ''}, 0],
  },
  hard_break: {
    inline: true, group: 'inline', selectable: false,
    parseDOM: [{tag: 'br'}],
    toDOM: () => ['br'],
  },
};

// Marks nest in this order, outermost first: a line sits inside the pen so
// that a line with no pen of its own is drawn in the text's pen.
const marks = {
  link: {
    attrs: {href: {validate: v => { if (!safeHref(v)) throw new RangeError('not a safe link'); }}}, inclusive: false,
    parseDOM: [{tag: 'a[href]', getAttrs: el => {
      const href = safeHref(el.getAttribute('href'));
      return href ? {href} : false;
    }}],
    toDOM: m => ['a', {href: m.attrs.href}, 0],
  },
  pen: {
    attrs: {color: {validate: oneOf(PENS)}},
    parseDOM: [{tag: 'span', consuming: false, getAttrs: el => {
      const c = penOf(el);
      return c && !el.classList.contains('ink') ? {color: c} : false;
    }}],
    toDOM: m => ['span', {class: m.attrs.color}, 0],
  },
  hl: {
    attrs: {color: {default: 'blue', validate: oneOf(HIGHLIGHTERS)}},
    parseDOM: [{tag: 'mark', getAttrs: el => ({color: HIGHLIGHTERS.find(c => el.classList.contains('hl-' + c)) || 'blue'})}],
    toDOM: m => ['mark', m.attrs.color === 'blue' ? {} : {class: 'hl-' + m.attrs.color}, 0],
  },
  line: {
    attrs: {style: {validate: oneOf(LINES)}, color: {default: null, validate: oneOf(PENS)}},
    parseDOM: [{tag: 'span', consuming: false, getAttrs: el => {
      const s = LINES.find(l => el.classList.contains(l));
      return s ? {style: s, color: linePen(el) || penOf(el)} : false;
    }}],
    toDOM: m => ['span', {class: m.attrs.style, style: m.attrs.color ? `--pen: var(--pen-${m.attrs.color})` : null}, 0],
  },
  strong: {
    parseDOM: [
      {tag: 'strong'},
      {tag: 'b', getAttrs: el => el.style.fontWeight !== 'normal' && null},
      {style: 'font-weight', getAttrs: v => /^(bold(er)?|[6-9]\d{2,})$/.test(v) && null},
    ],
    toDOM: () => ['strong', 0],
  },
  em: {
    parseDOM: [{tag: 'em'}, {tag: 'i'}, {style: 'font-style=italic'}],
    toDOM: () => ['em', 0],
  },
  strike: {
    parseDOM: [{tag: 'del'}, {tag: 's'}, {tag: 'strike'}],
    toDOM: () => ['del', 0],
  },
  code: {
    parseDOM: [{tag: 'code'}],
    toDOM: () => ['code', 0],
  },
  kbd: {
    parseDOM: [{tag: 'kbd'}],
    toDOM: () => ['kbd', 0],
  },
};

export const schema = new Schema({nodes, marks});
