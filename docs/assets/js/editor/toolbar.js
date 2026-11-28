// The formatting toolbar above the post. Groups that do not fit go behind
// a More button. One Tab stop; Left, Right, Home and End move between the
// controls.
import {addRowBefore, addRowAfter, addColumnBefore, addColumnAfter, deleteRow, deleteColumn, deleteTable,
  toggleHeaderRow, isInTable} from '../../vendor/prosemirror/tables.js';
import {schema, PENS, HIGHLIGHTERS, LINES, BOXES, LIST_STYLES} from './schema.js';
import * as C from './commands.js';
import {el, button, popover, closePopover} from './ui.js';

const N = schema.nodes, M = schema.marks;
const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

export const PEN_NAMES = {blue: 'Blue', red: 'Red', green: 'Green', purple: 'Purple', teal: 'Teal', magenta: 'Magenta', pencil: 'Pencil'};
export const BOX_NAMES = {idea: 'Key idea', definition: 'Definition', theorem: 'Theorem', proof: 'Proof',
  example: 'Example', question: 'Question', caveat: 'Caveat', summary: 'Summary'};
const LINE_NAMES = {ul: 'Underline', wavy: 'Wavy line', boxed: 'Box', circled: 'Circle'};
const STYLE_NAMES = {decimal: '1, 2, 3', alpha: 'a, b, c', 'upper-alpha': 'A, B, C', roman: 'i, ii, iii',
  'upper-roman': 'I, II, III', disc: 'Filled dots', circle: 'Hollow dots', square: 'Squares', dash: 'Dashes', none: 'No markers'};

const svg = body => `<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  undo: svg('<path d="M5.5 3.5 2.5 6.5l3 3M3 6.5h6.5a3.5 3.5 0 0 1 0 7H7"/>'),
  redo: svg('<path d="m10.5 3.5 3 3-3 3M13 6.5H6.5a3.5 3.5 0 0 0 0 7H9"/>'),
  link: svg('<path d="m6.5 9.5 3-3M7.2 4.3l.9-.9a2.8 2.8 0 0 1 4 4l-.9.9M8.8 11.7l-.9.9a2.8 2.8 0 0 1-4-4l.9-.9"/>'),
  bullets: svg('<path d="M6.5 4h7M6.5 8h7M6.5 12h7"/><circle cx="3" cy="4" r=".9" fill="currentColor"/><circle cx="3" cy="8" r=".9" fill="currentColor"/><circle cx="3" cy="12" r=".9" fill="currentColor"/>'),
  numbers: svg('<path d="M6.5 4h7M6.5 8h7M6.5 12h7M2.4 2.8l.9-.5v3.2M2.2 7.2c.2-.5 1.6-.7 1.6.2 0 .7-1.6 1.3-1.6 2h1.7M2.2 11.2c.3-.4 1.6-.5 1.6.3 0 .5-.6.6-.9.6.4 0 1 .2 1 .7 0 .9-1.4.8-1.7.4"/>'),
  check: svg('<path d="M7 4.5h6.5M7 11h6.5"/><rect x="1.8" y="2.5" width="3.6" height="3.6" rx=".6"/><path d="m2.6 4.4.8.8 1.3-1.6"/><rect x="1.8" y="9.2" width="3.6" height="3.6" rx=".6"/>'),
  outdent: svg('<path d="M7 4h6.5M7 8h6.5M7 12h6.5M4.5 6 2.5 8l2 2"/>'),
  indent: svg('<path d="M7 4h6.5M7 8h6.5M7 12h6.5M2.5 6l2 2-2 2"/>'),
  key: svg('<rect x="1.5" y="4" width="13" height="8" rx="1.2"/><path d="M4.2 6.6h.01M6.7 6.6h.01M9.3 6.6h.01M11.8 6.6h.01M5 9.6h6"/>'),
  pen: svg('<path d="M4.5 11.5 8 2.5l3.5 9M5.7 8.5h4.6"/>'),
  marker: svg('<path d="m9.5 2.5 4 4L8 12H4V8l5.5-5.5ZM2.5 13.5 4 12"/>'),
  box: svg('<rect x="2" y="2.5" width="12" height="11" rx="1"/><path d="M4.5 6h7M4.5 9h5"/>'),
  margin: svg('<path d="M2 3.5h7M2 6.5h7M2 9.5h7M2 12.5h7"/><rect x="11" y="3" width="3" height="5" rx=".5"/>'),
  math: svg('<path d="M12 3H4.5l4 5-4 5H12"/>'),
  display: svg('<path d="M1.5 2.5h13M1.5 13.5h13M10.5 5h-5l2.7 3-2.7 3h5"/>'),
  footnote: svg('<path d="M2 13 5.5 5 9 13M3.2 10.5h4.6M11.5 4l1.5-1v4.5"/>'),
  table: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M1.5 6.5h13M1.5 10h13M6 2.5v11M10.5 2.5v11"/>'),
  image: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><circle cx="5.5" cy="6" r="1.2"/><path d="m1.5 12 4-3.5 3 2.5 2-1.5 4 3"/>'),
  help: svg('<circle cx="8" cy="8" r="6.5"/><path d="M6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.6h.01"/>'),
  more: svg('<path d="M3.5 8h.01M8 8h.01M12.5 8h.01" stroke-width="2.4"/>'),
};
const CARET = '<span class="ed-tb__caret" aria-hidden="true">▾</span>';

export function buildToolbar(root, app) {
  const items = [];
  const ranked = [];  // groups that can go behind More: {el, rank}, higher hides first
  const rowEl = el('div', 'ed-tb__row');
  root.append(rowEl);
  const view = () => app.activeView();
  const run = cmd => {
    const v = view();
    if (!app.canEdit()) return false;
    const done = cmd(v.state, v.dispatch, v);
    v.focus();
    return done;
  };
  const group = (label, rank = 0) => {
    const g = el('div', 'ed-tb__group');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', label);
    rowEl.append(g);
    if (rank > 0) ranked.push({el: g, rank});
    return g;
  };
  // menu: the button opens a menu; paint(el, state): extra drawing on update
  const tb = (g, {label, html, title, cls = '', cmd, onClick, active, enabled, menu = false, paint}) => {
    const b = el('button', 'ed-tb ' + cls);
    b.type = 'button';
    if (html) b.innerHTML = html;
    else b.textContent = label;
    b.dataset.tip = title;
    b.setAttribute('aria-label', title);
    if (menu) {
      b.dataset.menu = '';
      b.setAttribute('aria-haspopup', 'dialog');
    }
    b.addEventListener('mousedown', e => e.preventDefault());
    b.addEventListener('click', e => (onClick ? onClick(b, e) : run(cmd)));
    g.append(b);
    items.push({el: b, active, enabled: enabled || (cmd && (s => cmd(s))), paint, menu});
    return b;
  };
  const select = (g, title, options, onChange, value, enabled) => {
    const s = el('select', 'ed-select');
    s.title = title;
    s.setAttribute('aria-label', title);
    for (const [v, l, hidden] of options) {
      const o = new Option(l, v);
      if (hidden) o.hidden = o.disabled = true;
      s.append(o);
    }
    s.addEventListener('change', () => onChange(s.value));
    g.append(s);
    items.push({el: s, value, enabled});
    return s;
  };
  const swatch = (p, cls = 'ed-sw') => (p ? `<span class="${cls}" style="--sw: var(--pen-${p})"></span>` : `<span class="${cls} ${cls}--none"></span>`);
  const inlineOK = type => s => {
    const {$from} = s.selection;
    return !$from.parent.type.spec.code && $from.parent.canReplaceWith($from.index(), $from.index(), type);
  };

  // the color under the pen or highlighter button, and in its name: the
  // mark's pen, if any
  const paintMark = (type, title, none) => (b, s) => {
    const m = C.markAt(s, type), c = m && m.attrs.color;
    if (c) b.style.setProperty('--sw', `var(--pen-${c})`);
    else b.style.removeProperty('--sw');
    const label = `${title}: ${c ? PEN_NAMES[c] || c : none}`;
    b.setAttribute('aria-label', label);
    b.dataset.tip = label;
  };

  let g = group('History', 1.2);
  tb(g, {html: ICON.undo, title: `Undo (${MOD}Z)`, cmd: C.undo});
  tb(g, {html: ICON.redo, title: `Redo (${MOD}Y)`, cmd: C.redo});

  g = group('Paragraph style', 1);
  select(g, 'Paragraph style', [['', 'Style', true], ['p', 'Text'], ['h2', 'Heading 2'], ['h3', 'Heading 3'],
    ['h4', 'Heading 4'], ['h5', 'Heading 5'], ['code', 'Code block']],
  v => {
    const why = v === 'code' && C.codeRefusal(view().state);
    if (why) app.notify(why);
    else if (v === 'code') run(C.setBlock(N.code_block));
    else if (v !== 'code') run(v === 'p' ? C.setBlock(N.paragraph) : C.setBlock(N.heading, {level: +v[1]}));
    app.refreshToolbar();
  },
  C.blockType, s => !!C.blockType(s));

  g = group('Text');
  tb(g, {html: '<b>B</b>', title: `Bold (${MOD}B)`, cmd: C.toggle('strong'), active: s => C.markActive(s, M.strong)});
  tb(g, {html: '<i>I</i>', title: `Italic (${MOD}I)`, cmd: C.toggle('em'), active: s => C.markActive(s, M.em)});
  tb(g, {html: ICON.link, title: `Link (${MOD}K)`, onClick: () => app.editLink(view()),
    active: s => C.markActive(s, M.link), enabled: s => !s.selection.$from.parent.type.spec.code});

  g = group('More text', 4);
  tb(g, {html: '<s>S</s>', title: 'Struck through', cmd: C.toggle('strike'), active: s => C.markActive(s, M.strike)});
  tb(g, {html: '<span class="ed-tb__code">&lt;/&gt;</span>', title: `Code in the line (${MOD}\`)`, cmd: C.toggle('code'), active: s => C.markActive(s, M.code)});
  tb(g, {html: ICON.key, title: 'Keyboard key, like Ctrl', cmd: C.toggle('kbd'), active: s => C.markActive(s, M.kbd)});
  tb(g, {html: '<span class="ed-tb__ul">U</span>' + CARET, title: `Underline, wavy line, box or circle (${MOD}U underlines)`, menu: true,
    onClick: (b, e) => lineMenu(b, e), active: s => !!C.markAt(s, M.line), enabled: C.setMark(M.line, {style: 'ul'})});

  g = group('Color', 2);
  tb(g, {html: ICON.pen + '<span class="ed-tb__bar"></span>' + CARET, cls: 'ed-tb--color', title: 'Pen color', menu: true,
    onClick: (b, e) => penMenu(b, e), active: s => !!C.markAt(s, M.pen), enabled: C.setMark(M.pen, {color: 'blue'}), paint: paintMark(M.pen, 'Pen color', 'ink')});
  tb(g, {html: ICON.marker + '<span class="ed-tb__bar"></span>' + CARET, cls: 'ed-tb--color', title: 'Highlighter', menu: true,
    onClick: (b, e) => hlMenu(b, e), active: s => !!C.markAt(s, M.hl), enabled: C.setMark(M.hl, {color: HIGHLIGHTERS[0]}), paint: paintMark(M.hl, 'Highlighter', 'none')});

  g = group('Lists', 2.5);
  tb(g, {html: ICON.bullets, title: 'Bulleted list', cmd: C.toggleList(N.bullet_list),
    active: s => C.listAt(s)?.node.type === N.bullet_list && !C.taskActive(s)});
  tb(g, {html: ICON.numbers, title: 'Numbered list', cmd: C.toggleList(N.ordered_list),
    active: s => C.listAt(s)?.node.type === N.ordered_list && !C.taskActive(s)});
  tb(g, {html: ICON.check, title: 'Checklist', cmd: C.toggleTask, active: C.taskActive});

  g = group('List levels', 6);
  tb(g, {html: ICON.outdent, title: 'Move the item out a level (Shift+Tab)', cmd: C.outdent});
  tb(g, {html: ICON.indent, title: 'Move the item in a level (Tab)', cmd: C.indent});
  tb(g, {html: '<span class="ed-tb__glyph">a.</span>' + CARET, title: 'List markers', menu: true, onClick: (b, e) => markersMenu(b, e),
    enabled: s => !!C.listAt(s), active: s => !!(C.listAt(s) && C.listAt(s).node.attrs.style)});

  g = group('Blocks', 5);
  tb(g, {html: ICON.box + CARET, title: 'Box: key idea, definition, theorem and more', menu: true, onClick: (b, e) => boxMenu(b, e),
    active: s => !!C.boxAt(s), enabled: s => !!C.boxAt(s) || C.setBox('idea')(s)});
  tb(g, {html: ICON.margin, title: 'Margin note: the paragraph sits in the right margin on wide screens',
    cmd: C.toggleMargin, active: C.marginActive});

  g = group('Insert', 1.5);
  tb(g, {html: ICON.math, title: 'Math in the line (Ctrl+M)', onClick: () => app.insertMath(view(), false), enabled: inlineOK(N.math_inline)});
  tb(g, {html: ICON.display, title: 'Math on its own line (Ctrl+Shift+M)', onClick: () => app.insertMath(view(), true),
    enabled: s => !!C.insertBlock(s, N.math_display.create())});
  tb(g, {html: ICON.footnote, title: 'Footnote', onClick: () => app.insertFootnote(view()), enabled: inlineOK(N.footnote)});
  tb(g, {html: ICON.table + CARET, title: 'Table', menu: true, onClick: (b, e) => tableMenu(b, e), active: s => isInTable(s),
    enabled: s => isInTable(s) || C.insertTable(s)});
  tb(g, {html: ICON.image, title: 'Image (you can also paste or drop one)', onClick: () => app.pickImages(),
    enabled: s => !!C.insertBlock(s, N.figure.create())});

  g = group('Help', 7);
  tb(g, {html: ICON.help, title: 'Keys and typing shortcuts', menu: true, onClick: (b, e) => help(b, e)});

  // More: the groups that do not fit go to a second container after the row,
  // shown while More is pressed
  const groups = [...rowEl.children];
  const extraEl = el('div', 'ed-tb__extra');
  extraEl.id = 'ed-tb-extra';
  root.append(extraEl);
  const moreG = el('div', 'ed-tb__group');
  moreG.setAttribute('role', 'group');
  moreG.setAttribute('aria-label', 'More');
  moreG.hidden = true;
  rowEl.append(moreG);
  const more = el('button', 'ed-tb');
  more.type = 'button';
  more.innerHTML = ICON.more;
  more.setAttribute('aria-label', 'More tools');
  more.setAttribute('aria-controls', extraEl.id);
  more.dataset.tip = 'More tools';
  more.addEventListener('mousedown', e => e.preventDefault());
  more.addEventListener('click', e => {
    const open = !root.classList.contains('is-more');
    setMore(open);
    // from the keyboard, the focus goes to the first tool shown
    if (open && e.detail === 0) {
      const f = extraEl.querySelector('button:not(:disabled), select:not(:disabled)');
      if (f) {
        rove(f);
        f.focus();
      }
    }
  });
  moreG.append(more);
  function setMore(open) {
    root.classList.toggle('is-more', open);
    more.classList.toggle('is-active', open);
    more.setAttribute('aria-expanded', String(open));
    rove();
  }
  let lastAvail = -1;
  function fit(force = false) {
    if (!root.clientWidth) return;
    const cs = getComputedStyle(root);
    const avail = root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // opening More changes only the height: nothing to refit
    if (!force && avail === lastAvail) return;
    lastAvail = avail;
    const had = root.contains(document.activeElement) ? document.activeElement : null;
    for (const x of groups) {
      x.classList.remove('is-out');
      rowEl.insertBefore(x, moreG);
    }
    moreG.hidden = true;
    if (rowEl.offsetWidth > avail) {
      moreG.hidden = false;
      for (const x of [...ranked].sort((a, b) => b.rank - a.rank)) {
        x.el.classList.add('is-out');
        if (rowEl.offsetWidth <= avail) break;
      }
      for (const x of groups) if (x.classList.contains('is-out')) extraEl.append(x);
    }
    if (moreG.hidden) setMore(false);
    else rove();
    if (had && had !== document.activeElement && had.getClientRects().length) had.focus();
  }

  // one Tab stop: the control last used, or the first that can be used
  const controls = () => [...root.querySelectorAll('button, select')];
  const reachable = () => controls().filter(x => !x.disabled && x.getClientRects().length);
  let stop = null;
  function rove(to) {
    const ok = reachable();
    if (to && ok.includes(to)) stop = to;
    if (!stop || !ok.includes(stop)) stop = ok[0] || null;
    for (const x of controls()) x.tabIndex = x === stop ? 0 : -1;
  }
  root.addEventListener('focusin', e => {
    if (e.target !== stop) rove(e.target);
  });
  root.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    const sel = e.target.tagName === 'SELECT';
    if (!['ArrowLeft', 'ArrowRight', ...(sel ? [] : ['Home', 'End'])].includes(e.key)) return;
    const ok = reachable(), i = ok.indexOf(e.target);
    if (i < 0) return;
    const next = e.key === 'Home' ? ok[0] : e.key === 'End' ? ok[ok.length - 1]
      : ok[(i + (e.key === 'ArrowRight' ? 1 : -1) + ok.length) % ok.length];
    e.preventDefault();
    rove(next);
    next.focus();
  });

  setMore(false);
  new ResizeObserver(() => fit()).observe(root);
  if (document.fonts) document.fonts.ready.then(() => fit(true));

  // --- menus ---
  const menu = (anchor, label) => popover(anchor, {cls: 'ed-menu', label, onClose: () => view().focus()});
  const row = (pop, title) => {
    if (title) pop.el.append(el('span', 'ed-pop__label', title));
    return pop.el.appendChild(el('div', 'ed-menu__row'));
  };
  const small = (text, on, active) => button(text, on, 'ed-btn ed-btn--small' + (active ? ' is-active' : ''));
  const penButton = (p, title, on, active) => {
    const b = button('', on, 'ed-tb' + (active ? ' is-active' : ''));
    b.innerHTML = p ? swatch(p) : '<span class="ed-sw ed-sw--text"></span>';
    b.dataset.tip = title;
    b.setAttribute('aria-label', title);
    return b;
  };
  // a menu opened from the keyboard (a click with no pointer) takes the
  // focus, and Escape gives it back to the button
  const focusFirst = (pop, e) => {
    if (e && e.detail === 0) {
      pop.back = pop.anchor;
      const f = pop.el.querySelector('button, input');
      if (f) f.focus();
    }
  };
  const swBtn = (swHTML, name, on, active) => {
    const b = button('', on, 'ed-btn ed-btn--small ed-swbtn' + (active ? ' is-active' : ''));
    b.innerHTML = swHTML;
    b.append(document.createTextNode(name));
    return b;
  };

  function penMenu(anchor, e) {
    const now = C.markAt(view().state, M.pen), cur = now ? now.attrs.color : null;
    const pop = menu(anchor, 'Pen color');
    const r = row(pop, 'Pen');
    r.classList.add('ed-menu__grid');
    r.append(swBtn('<span class="ed-sw ed-sw--ink"></span>', 'Ink (no pen)', () => { run(C.setMark(M.pen, null)); closePopover(); }, !cur));
    for (const p of PENS) r.append(swBtn(swatch(p), PEN_NAMES[p], () => { run(C.setMark(M.pen, {color: p})); closePopover(); }, cur === p));
    pop.el.append(el('span', 'ed-pop__hint', 'With nothing selected, the pen colors what you type next.'));
    pop.place();
    focusFirst(pop, e);
  }

  function hlMenu(anchor, e) {
    const now = C.markAt(view().state, M.hl), cur = now ? now.attrs.color : null;
    const pop = menu(anchor, 'Highlighter');
    const r = row(pop, 'Highlighter');
    r.classList.add('ed-menu__grid');
    r.append(swBtn('<span class="ed-hl" style="--sw: var(--rule-2)"></span>', 'No highlight', () => { run(C.setMark(M.hl, null)); closePopover(); }, !cur));
    for (const h of HIGHLIGHTERS) r.append(swBtn(swatch(h, 'ed-hl'), PEN_NAMES[h], () => { run(C.setMark(M.hl, {color: h})); closePopover(); }, cur === h));
    pop.place();
    focusFirst(pop, e);
  }

  function markersMenu(anchor, e) {
    const l = C.listAt(view().state), cur = l ? l.node.attrs.style || '' : '';
    const pop = menu(anchor, 'List markers');
    const r = row(pop, 'Markers of this list');
    r.append(small('By level', () => { run(C.setListStyle('')); closePopover(); }, !cur));
    for (const st of LIST_STYLES) r.append(small(STYLE_NAMES[st], () => { run(C.setListStyle(st)); closePopover(); }, cur === st));
    pop.place();
    focusFirst(pop, e);
  }

  function lineMenu(anchor, e) {
    const cur = C.markAt(view().state, M.line);
    let color = cur ? cur.attrs.color : null;
    const pop = menu(anchor, 'Lines');
    const styles = row(pop, 'Draw');
    for (const st of LINES) {
      styles.append(small(LINE_NAMES[st], () => { run(C.setMark(M.line, {style: st, color})); closePopover(); }, cur?.attrs.style === st));
    }
    const colors = row(pop, 'In');
    const pick = (c, b) => {
      color = c;
      for (const x of colors.children) x.classList.toggle('is-active', x === b);
      if (cur) run(C.setMark(M.line, {style: cur.attrs.style, color}));
    };
    const add = (c, title) => {
      const b = penButton(c, title, () => pick(c, b), color === c);
      colors.append(b);
    };
    add(null, "The text's own color");
    for (const p of PENS) add(p, `${PEN_NAMES[p]} pen`);
    if (cur) pop.el.append(button('Remove the line', () => { run(C.setMark(M.line, null)); closePopover(); }, 'ed-link'));
    pop.place();
    focusFirst(pop, e);
  }

  function boxMenu(anchor, e) {
    const b = C.boxAt(view().state);
    const kind = b && b.node.attrs.kind;
    let input = null;
    const pop = popover(anchor, {
      cls: 'ed-menu', label: 'Box',
      onClose: commit => {
        if (commit && input && input.value.trim() !== b.node.attrs.label) run(C.setBoxAttr('label', input.value.trim()));
        else view().focus();
      },
    });
    const kinds = row(pop, b ? 'This box is' : 'Put the selection in a box');
    for (const k of BOXES) kinds.append(small(BOX_NAMES[k], () => { run(C.setBox(k)); closePopover(false); }, kind === k));
    kinds.append(small('Quotation', () => { run(C.setBox(null)); closePopover(false); }, b && !kind));
    if (kind) {
      pop.el.append(el('span', 'ed-pop__label', 'Label'));
      input = el('input', 'ed-input');
      input.type = 'text';
      input.value = b.node.attrs.label;
      input.placeholder = `${BOX_NAMES[kind]} (empty keeps this)`;
      input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); closePopover(true); } });
      pop.el.append(input);
      const pens = row(pop, 'Pen for the frame');
      pens.append(penButton(null, 'The usual color', () => { run(C.setBoxAttr('pen', null)); closePopover(true); }, !b.node.attrs.pen));
      for (const p of PENS) pens.append(penButton(p, `${PEN_NAMES[p]} pen`, () => { run(C.setBoxAttr('pen', p)); closePopover(true); }, b.node.attrs.pen === p));
    }
    if (b) pop.el.append(button('Take the text out of the box', () => { run(C.removeBox); closePopover(false); }, 'ed-link'));
    pop.place();
    focusFirst(pop, e);
  }

  function tableMenu(anchor, e) {
    const pop = menu(anchor, 'Table');
    const r = row(pop, isInTable(view().state) ? 'This table' : '');
    const act = (text, cmd) => r.append(small(text, () => { run(cmd); closePopover(); }));
    if (!isInTable(view().state)) act('Insert a table', C.insertTable);
    else {
      for (const [text, cmd] of [['Row above', addRowBefore], ['Row below', addRowAfter], ['Column left', addColumnBefore],
        ['Column right', addColumnAfter], ['Delete row', deleteRow], ['Delete column', deleteColumn],
        ['Header row on or off', toggleHeaderRow], ['Delete table', deleteTable]]) act(text, cmd);
    }
    pop.place();
    focusFirst(pop, e);
  }

  function help(anchor, e) {
    const pop = menu(anchor, 'Shortcuts');
    pop.el.classList.add('ed-help');
    pop.el.innerHTML = `
      <span class="ed-pop__label">Keys</span>
      <dl>
        <dt>${MOD}B, ${MOD}I, ${MOD}U</dt><dd>bold, italic, underline</dd>
        <dt>${MOD}\`, ${MOD}K</dt><dd>code, link</dd>
        <dt>Ctrl+M, Ctrl+Shift+M</dt><dd>math in the line, math on its own line</dd>
        <dt>Tab, Shift+Tab</dt><dd>list item in or out a level; next or previous table cell</dd>
        <dt>Shift+Enter</dt><dd>line break in a paragraph, or leave a code block</dd>
        <dt>${MOD}Alt+2 to 5, ${MOD}Alt+0</dt><dd>heading 2 to 5, text</dd>
        <dt>${MOD}Z, ${MOD}Y</dt><dd>undo, redo</dd>
      </dl>
      <span class="ed-pop__label">Typing</span>
      <dl>
        <dt>## to #####, then space</dt><dd>heading</dd>
        <dt>- or 1. then space</dt><dd>bulleted or numbered list</dd>
        <dt>[ ] or [x] at the start of an item</dt><dd>checklist</dd>
        <dt>&gt; then space</dt><dd>quotation; the Box menu makes it a box</dd>
        <dt>\`\`\`python then space</dt><dd>code block</dd>
        <dt>**bold**, *italic*, \`code\`, ~~struck~~</dt><dd>as written</dd>
        <dt>$$x^2$$</dt><dd>math</dd>
        <dt>**bold**, *italic*, $$x$$ in the description</dt><dd>as written</dd>
      </dl>
      <span class="ed-pop__label">Pens</span>
      <p>Select words, open Pen color and pick a color. With nothing selected, the pen colors what you type next.
      In math, \\red{x} and the other pen names color part of a formula.</p>`;
    pop.place();
    focusFirst(pop, e);
  }

  return {
    update(state) {
      for (const it of items) {
        if (it.enabled) it.el.disabled = !it.enabled(state);
        if (it.active) {
          const a = !!it.active(state);
          it.el.classList.toggle('is-active', a);
          // a button that opens a menu is not a toggle
          if (!it.menu) it.el.setAttribute('aria-pressed', String(a));
        }
        if (it.value) it.el.value = it.value(state);
        if (it.paint) it.paint(it.el, state);
      }
      if (!stop || stop.disabled) rove();
    },
    fit,
  };
}
