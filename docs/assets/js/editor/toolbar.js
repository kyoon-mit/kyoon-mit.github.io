// The formatting toolbar above the post.
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
};

export function buildToolbar(root, app) {
  const items = [];
  const view = () => app.activeView();
  const run = cmd => {
    const v = view();
    if (!app.canEdit()) return false;
    const done = cmd(v.state, v.dispatch, v);
    v.focus();
    return done;
  };
  const group = label => {
    const g = el('div', 'ed-tb__group');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', label);
    root.append(g);
    return g;
  };
  const tag = (g, text) => g.append(el('span', 'ed-tb__label', text));
  const tb = (g, {label, html, title, cls = '', cmd, onClick, active, enabled}) => {
    const b = el('button', 'ed-tb ' + cls);
    b.type = 'button';
    if (html) b.innerHTML = html;
    else b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('mousedown', e => e.preventDefault());
    b.addEventListener('click', () => (onClick ? onClick(b) : run(cmd)));
    g.append(b);
    items.push({el: b, active, enabled: enabled || (cmd && (s => cmd(s)))});
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

  let g = group('Undo');
  tb(g, {html: ICON.undo, title: `Undo (${MOD}Z)`, cmd: C.undo});
  tb(g, {html: ICON.redo, title: `Redo (${MOD}Y)`, cmd: C.redo});

  g = group('Paragraph style');
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
  tb(g, {html: '<s>S</s>', title: 'Struck through', cmd: C.toggle('strike'), active: s => C.markActive(s, M.strike)});
  tb(g, {html: '<span class="ed-tb__code">&lt;/&gt;</span>', title: `Code in the line (${MOD}\`)`, cmd: C.toggle('code'), active: s => C.markActive(s, M.code)});
  tb(g, {label: 'Key', title: 'Keyboard key, like Ctrl', cmd: C.toggle('kbd'), active: s => C.markActive(s, M.kbd)});
  tb(g, {html: ICON.link, title: `Link (${MOD}K)`, onClick: () => app.editLink(view()),
    active: s => C.markActive(s, M.link), enabled: s => !s.selection.$from.parent.type.spec.code});

  g = group('Pen');
  tag(g, 'Pen');
  tb(g, {html: '<span class="ed-sw ed-sw--ink"></span>', title: 'Ink (no pen)', cmd: C.setMark(M.pen, null), active: s => !C.markAt(s, M.pen)});
  for (const p of PENS) {
    tb(g, {html: swatch(p), title: `${PEN_NAMES[p]} pen`, cmd: C.setMark(M.pen, {color: p}),
      active: s => C.markAt(s, M.pen)?.attrs.color === p});
  }

  g = group('Highlighter');
  tag(g, 'Highlight');
  for (const h of HIGHLIGHTERS) {
    const on = C.setMark(M.hl, {color: h}), off = C.setMark(M.hl, null);
    tb(g, {html: swatch(h, 'ed-hl'), title: `${PEN_NAMES[h]} highlighter (click again to remove)`,
      cmd: (s, d, v) => (C.markAt(s, M.hl)?.attrs.color === h ? off : on)(s, d, v),
      active: s => C.markAt(s, M.hl)?.attrs.color === h});
  }

  g = group('Lines');
  tb(g, {html: '<span class="ed-tb__ul">U</span>▾', title: `Underline, wavy line, box or circle (${MOD}U underlines)`,
    onClick: b => lineMenu(b), active: s => !!C.markAt(s, M.line), enabled: C.setMark(M.line, {style: 'ul'})});

  g = group('Lists');
  tb(g, {html: ICON.bullets, title: 'Bulleted list', cmd: C.toggleList(N.bullet_list),
    active: s => C.listAt(s)?.node.type === N.bullet_list && !C.taskActive(s)});
  tb(g, {html: ICON.numbers, title: 'Numbered list', cmd: C.toggleList(N.ordered_list),
    active: s => C.listAt(s)?.node.type === N.ordered_list && !C.taskActive(s)});
  tb(g, {html: ICON.check, title: 'Checklist', cmd: C.toggleTask, active: C.taskActive});
  tb(g, {html: ICON.outdent, title: 'Move the item out a level (Shift+Tab)', cmd: C.outdent});
  tb(g, {html: ICON.indent, title: 'Move the item in a level (Tab)', cmd: C.indent});
  select(g, 'Markers of this list', [['', 'Markers: by level'], ...LIST_STYLES.map(st => [st, STYLE_NAMES[st]])],
    v => run(C.setListStyle(v)), s => C.listAt(s)?.node.attrs.style || '', s => !!C.listAt(s));

  g = group('Boxes');
  tb(g, {label: 'Box▾', title: 'Box: key idea, definition, theorem and more', onClick: b => boxMenu(b),
    active: s => !!C.boxAt(s), enabled: s => !!C.boxAt(s) || C.setBox('idea')(s)});
  tb(g, {label: 'Margin note', title: 'Margin note: the paragraph sits in the right margin on wide screens',
    cmd: C.toggleMargin, active: C.marginActive});

  g = group('Insert');
  tb(g, {label: '∑ Math', title: 'Math in the line (Ctrl+M)', onClick: () => app.insertMath(view(), false), enabled: inlineOK(N.math_inline)});
  tb(g, {label: '∑ Display', title: 'Math on its own line (Ctrl+Shift+M)', onClick: () => app.insertMath(view(), true),
    enabled: s => !!C.insertBlock(s, N.math_display.create())});
  tb(g, {label: 'Footnote', title: 'Footnote', onClick: () => app.insertFootnote(view()), enabled: inlineOK(N.footnote)});
  tb(g, {label: 'Table▾', title: 'Table', onClick: b => tableMenu(b), active: s => isInTable(s),
    enabled: s => isInTable(s) || C.insertTable(s)});
  tb(g, {label: 'Image', title: 'Image (you can also paste or drop one)', onClick: () => app.pickImages(),
    enabled: s => !!C.insertBlock(s, N.figure.create())});

  g = group('Help');
  tb(g, {label: '?', title: 'Keys and typing shortcuts', onClick: b => help(b)});

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
    b.title = title;
    b.setAttribute('aria-label', title);
    return b;
  };

  function lineMenu(anchor) {
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
  }

  function boxMenu(anchor) {
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
  }

  function tableMenu(anchor) {
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
  }

  function help(anchor) {
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
      </dl>
      <span class="ed-pop__label">Pens</span>
      <p>Select words and click a pen. With nothing selected, the pen colors what you type next.
      In math, \\red{x} and the other pen names color part of a formula.</p>`;
    pop.place();
  }

  return {
    update(state) {
      for (const it of items) {
        if (it.enabled) it.el.disabled = !it.enabled(state);
        if (it.active) {
          const a = !!it.active(state);
          it.el.classList.toggle('is-active', a);
          it.el.setAttribute('aria-pressed', String(a));
        }
        if (it.value) it.el.value = it.value(state);
      }
    },
  };
}
