// Editing commands, typing shortcuts, keys and plugins of the post editor.
import {toggleMark, setBlockType, wrapIn, chainCommands, exitCode, newlineInCode, baseKeymap} from '../../vendor/prosemirror/commands.js';
import {wrapInList, splitListItem, liftListItem, sinkListItem} from '../../vendor/prosemirror/schema-list.js';
import {undo, redo, history} from '../../vendor/prosemirror/history.js';
import {inputRules, InputRule, wrappingInputRule, textblockTypeInputRule, undoInputRule} from '../../vendor/prosemirror/inputrules.js';
import {keymap} from '../../vendor/prosemirror/keymap.js';
import {Plugin, NodeSelection, Selection, TextSelection} from '../../vendor/prosemirror/state.js';
import {Decoration, DecorationSet} from '../../vendor/prosemirror/view.js';
import {liftTarget} from '../../vendor/prosemirror/transform.js';
import {goToNextCell, tableEditing} from '../../vendor/prosemirror/tables.js';
import {dropCursor} from '../../vendor/prosemirror/dropcursor.js';
import {gapCursor} from '../../vendor/prosemirror/gapcursor.js';
import {schema} from './schema.js';
import {normLang} from './code.js';

const N = schema.nodes, M = schema.marks;
export {undo, redo};

// --- marks ------------------------------------------------------------------

// The mark of this type on the cursor, or on the first text of the selection.
export function markAt(state, type) {
  const {empty, $from, from, to} = state.selection;
  if (empty) return type.isInSet(state.storedMarks || $from.marks()) || null;
  let found;
  state.doc.nodesBetween(from, to, n => {
    if (found !== undefined) return false;
    if (n.isInline) {
      found = type.isInSet(n.marks) || null;
      return false;
    }
    return true;
  });
  return found || null;
}

export function markActive(state, type) {
  const {empty, $from, from, to} = state.selection;
  return empty ? !!type.isInSet(state.storedMarks || $from.marks()) : state.doc.rangeHasMark(from, to, type);
}

// Put a mark with these attributes on the selection (or on what is typed
// next, like picking up a pen); null takes it off.
export const setMark = (type, attrs) => (state, dispatch) => {
  const sel = state.selection;
  if (sel.empty && !sel.$from.parent.type.allowsMarkType(type)) return false;
  if (sel instanceof NodeSelection && !sel.node.isInline) return false;
  if (dispatch) {
    const tr = state.tr;
    if (sel.empty) {
      tr.removeStoredMark(type);
      if (attrs) tr.addStoredMark(type.create(attrs));
    } else {
      for (const {$from, $to} of sel.ranges) {
        tr.removeMark($from.pos, $to.pos, type);
        if (attrs) tr.addMark($from.pos, $to.pos, type.create(attrs));
      }
    }
    dispatch(tr.scrollIntoView());
  }
  return true;
};

export const toggle = name => toggleMark(M[name]);

export const toggleLine = style => (state, dispatch) => {
  const m = markAt(state, M.line);
  return setMark(M.line, m && m.attrs.style === style ? null : {style, color: m ? m.attrs.color : null})(state, dispatch);
};

// The link around the cursor: its range and mark.
export function linkRange(state) {
  const {$from} = state.selection;
  const parent = $from.parent;
  let idx = $from.index();
  let node = parent.maybeChild(idx);
  if (!node || !M.link.isInSet(node.marks)) node = parent.maybeChild(--idx);
  const mark = node && M.link.isInSet(node.marks);
  if (!mark) return null;
  // a footnote inside a link is written outside it, so the link continues past
  // footnotes that sit between two linked parts
  const linked = i => {
    if (mark.isInSet(parent.child(i).marks)) return true;
    if (parent.child(i).type !== N.footnote) return false;
    let a = i, b = i;
    while (a > 0 && parent.child(a - 1).type === N.footnote) a--;
    while (b + 1 < parent.childCount && parent.child(b + 1).type === N.footnote) b++;
    return a > 0 && b + 1 < parent.childCount && !!mark.isInSet(parent.child(a - 1).marks) && !!mark.isInSet(parent.child(b + 1).marks);
  };
  let start = idx, end = idx + 1;
  while (start > 0 && linked(start - 1)) start--;
  while (end < parent.childCount && linked(end)) end++;
  let from = $from.start();
  for (let i = 0; i < start; i++) from += parent.child(i).nodeSize;
  let to = from;
  for (let i = start; i < end; i++) to += parent.child(i).nodeSize;
  return {from, to, mark};
}

// --- blocks -------------------------------------------------------------------

export function blockType(state) {
  const p = state.selection.$from.parent;
  if (p.type === N.heading) return 'h' + p.attrs.level;
  if (p.type === N.code_block) return 'code';
  if (p.type === N.paragraph) return 'p';
  return '';
}

// Why the selected text cannot become a code block, or '' when it can. A
// code block holds plain text, so math, footnotes, line breaks and links
// would be lost.
export function codeRefusal(state) {
  const {from, to, $from} = state.selection;
  let why = '';
  state.doc.nodesBetween(from, to, n => {
    if (why) return false;
    if (n.type === N.figure) why = 'An image caption cannot become a code block.';
    else if (n.isTextblock && n.type !== N.code_block) {
      n.forEach(c => {
        if (!why && !c.isText) why = 'A code block holds plain text only: take out the math, footnotes and line breaks first.';
        if (!why && M.link.isInSet(c.marks)) why = 'A code block holds plain text only: take out the links first.';
      });
    }
    return true;
  });
  if (!why && $from.depth > 1 && $from.node(-1).type === N.list_item && $from.index(-1) === 0) why = 'The first line of a list item cannot be a code block.';
  if (!why && $from.depth > 1 && $from.node(-1).type.spec.tableRole) why = 'A table cell cannot hold a code block.';
  return why;
}

// Change paragraphs, headings and code; never a figure (its caption is text
// too), and not to code when that would lose something (codeRefusal).
export const setBlock = (type, attrs) => (state, dispatch) => {
  const {from, to} = state.selection;
  let figure = false;
  state.doc.nodesBetween(from, to, n => {
    if (n.type === N.figure) figure = true;
    return !figure;
  });
  if (figure || (type === N.code_block && codeRefusal(state))) return false;
  return setBlockType(type, attrs)(state, dispatch);
};

const isList = n => n.type === N.bullet_list || n.type === N.ordered_list;

export function listAt(state) {
  const {$from} = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d);
    if (isList(n)) return {node: n, pos: $from.before(d)};
  }
  return null;
}

export const toggleList = type => (state, dispatch) => {
  const l = listAt(state);
  if (l && l.node.type === type && taskActive(state)) {
    // checklist items back to plain items
    if (dispatch) {
      const tr = state.tr;
      for (const {node, pos} of itemsInSelection(state)) tr.setNodeMarkup(pos, null, {...node.attrs, checked: null});
      dispatch(tr);
    }
    return true;
  }
  if (l && l.node.type === type) return liftListItem(N.list_item)(state, dispatch);
  if (l) {
    if (dispatch) {
      const tr = state.tr.setNodeMarkup(l.pos, type, type === N.ordered_list ? {order: 1, style: null} : {style: null});
      l.node.forEach((item, offset) => {
        if (item.attrs.checked != null) tr.setNodeMarkup(l.pos + 1 + offset, null, {...item.attrs, checked: null});
      });
      dispatch(tr);
    }
    return true;
  }
  return wrapInList(type)(state, dispatch);
};

// list items whose first paragraph the selection touches
function itemsInSelection(state) {
  const {from, to} = state.selection;
  const items = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type !== N.list_item) return true;
    const start = pos + 1, end = start + node.firstChild.nodeSize;
    if (from <= end && to >= start) items.push({node, pos});
    return true;
  });
  return items;
}

export const toggleTask = (state, dispatch) => {
  if (!listAt(state)) {
    let tr = null;
    if (!wrapInList(N.bullet_list)(state, t => { tr = t; })) return false;
    if (dispatch) {
      for (const {node, pos} of itemsInSelection(state.apply(tr))) tr.setNodeMarkup(pos, null, {...node.attrs, checked: false});
      dispatch(tr);
    }
    return true;
  }
  const items = itemsInSelection(state);
  if (!items.length) return false;
  if (dispatch) {
    const on = items.some(i => i.node.attrs.checked == null);
    const tr = state.tr;
    for (const {node, pos} of items) tr.setNodeMarkup(pos, null, {...node.attrs, checked: on ? (node.attrs.checked ?? false) : null});
    dispatch(tr);
  }
  return true;
};

export const taskActive = state => {
  const items = itemsInSelection(state);
  return items.length > 0 && items.every(i => i.node.attrs.checked != null);
};

export const indent = sinkListItem(N.list_item);
export const outdent = liftListItem(N.list_item);

export const setListStyle = style => (state, dispatch) => {
  const l = listAt(state);
  if (!l) return false;
  if (dispatch) dispatch(state.tr.setNodeMarkup(l.pos, null, {...l.node.attrs, style: style || null}));
  return true;
};

export function boxAt(state) {
  const {$from} = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d);
    if (n.type === N.box) return {node: n, pos: $from.before(d)};
  }
  return null;
}

// kind null is a plain quotation
export const setBox = kind => (state, dispatch) => {
  const b = boxAt(state);
  if (b) {
    if (dispatch) {
      const a = b.node.attrs;
      dispatch(state.tr.setNodeMarkup(b.pos, null, {...a, kind, label: kind ? a.label : '', pen: kind ? a.pen : null}));
    }
    return true;
  }
  return wrapIn(N.box, {kind})(state, dispatch);
};

export const setBoxAttr = (key, value) => (state, dispatch) => {
  const b = boxAt(state);
  if (!b || !b.node.attrs.kind) return false;
  if (dispatch) dispatch(state.tr.setNodeMarkup(b.pos, null, {...b.node.attrs, [key]: value}));
  return true;
};

export const removeBox = (state, dispatch) => {
  const b = boxAt(state);
  if (!b) return false;
  const $s = state.doc.resolve(b.pos + 1), $e = state.doc.resolve(b.pos + b.node.nodeSize - 1);
  const range = $s.blockRange($e), target = range && liftTarget(range);
  if (target == null) return false;
  if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};

function paragraphsInSelection(state) {
  const {from, to} = state.selection;
  const out = [];
  state.doc.nodesBetween(from, to, (n, pos) => {
    if (n.type === N.paragraph) out.push({n, pos});
  });
  return out;
}

export const toggleMargin = (state, dispatch) => {
  const ps = paragraphsInSelection(state);
  if (!ps.length) return false;
  if (dispatch) {
    const on = !ps.every(p => p.n.attrs.margin);
    const tr = state.tr;
    for (const {n, pos} of ps) tr.setNodeMarkup(pos, null, {...n.attrs, margin: on});
    dispatch(tr);
  }
  return true;
};

export const marginActive = state => {
  const ps = paragraphsInSelection(state);
  return ps.length > 0 && ps.every(p => p.n.attrs.margin);
};

// Where a new block goes: in place of an empty paragraph, else after the
// block the cursor is in (moving out of containers that cannot hold it).
export function insertBlock(state, node) {
  const sel = state.selection, {$from} = sel;
  if (sel instanceof NodeSelection) {
    const $pos = state.doc.resolve(sel.to);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), node.type)) return {tr: state.tr.insert(sel.to, node), pos: sel.to};
  }
  if ($from.parent.type === N.paragraph && $from.parent.content.size === 0 && $from.depth > 0) {
    const d = $from.depth, i = $from.index(d - 1);
    if ($from.node(d - 1).canReplaceWith(i, i + 1, node.type)) {
      const start = $from.before(d);
      return {tr: state.tr.replaceWith(start, start + $from.parent.nodeSize, node), pos: start};
    }
  }
  for (let d = $from.depth; d > 0; d--) {
    const parent = $from.node(d - 1), i = $from.indexAfter(d - 1);
    if (parent.canReplaceWith(i, i, node.type)) {
      const pos = $from.after(d);
      return {tr: state.tr.insert(pos, node), pos};
    }
  }
  return null;
}

// Put the cursor in the text after the block that ends at `end`, adding an
// empty paragraph there when nothing can take a cursor.
export function cursorAfter(tr, end) {
  const $end = tr.doc.resolve(end), next = $end.nodeAfter;
  if (next && next.isTextblock) return tr.setSelection(TextSelection.create(tr.doc, end + 1));
  if (!next && $end.parent.canReplaceWith($end.index(), $end.index(), N.paragraph)) {
    tr.insert(end, N.paragraph.create());
    return tr.setSelection(TextSelection.create(tr.doc, end + 1));
  }
  return tr.setSelection(Selection.near($end, 1));
}

// Insert an atom (math, footnote) and select it; returns its position.
export function insertAtom(view, node) {
  const {state} = view;
  if (node.isInline) {
    const {$from} = state.selection;
    if ($from.parent.type.spec.code || !$from.parent.canReplaceWith($from.index(), $from.index(), node.type)) return null;
    const text = state.selection.empty ? null : state.doc.textBetween(state.selection.from, state.selection.to, ' ');
    const atom = text != null && node.type === N.math_inline ? node.type.create({tex: text}) : node;
    const tr = state.tr.replaceSelectionWith(atom, false);
    const pos = tr.selection.from - atom.nodeSize;
    tr.setSelection(NodeSelection.create(tr.doc, pos));
    view.dispatch(tr.scrollIntoView());
    return pos;
  }
  const r = insertBlock(state, node);
  if (!r) return null;
  r.tr.setSelection(NodeSelection.create(r.tr.doc, r.pos));
  view.dispatch(r.tr.scrollIntoView());
  return r.pos;
}

export function newTable(rows = 3, cols = 3) {
  const cell = type => type.createAndFill();
  const row = type => N.table_row.create(null, Array.from({length: cols}, () => cell(type)));
  return N.table.create(null, [row(N.table_header), ...Array.from({length: rows - 1}, () => row(N.table_cell))]);
}

export const insertTable = (state, dispatch) => {
  const table = newTable(), r = insertBlock(state, table);
  if (!r) return false;
  if (dispatch) {
    const end = r.pos + table.nodeSize, $end = r.tr.doc.resolve(end);
    if (!$end.nodeAfter && $end.parent.canReplaceWith($end.index(), $end.index(), N.paragraph)) r.tr.insert(end, N.paragraph.create());
    dispatch(r.tr.setSelection(Selection.near(r.tr.doc.resolve(r.pos + 1))).scrollIntoView());
  }
  return true;
};

// --- typing shortcuts ---------------------------------------------------------

function markRule(re, type) {
  return new InputRule(re, (state, match, start, end) => {
    const [full, inner] = match;
    const textStart = start + full.indexOf(inner), textEnd = textStart + inner.length;
    const tr = state.tr;
    if (textEnd < end) tr.delete(textEnd, end);
    tr.delete(start, textStart);
    tr.addMark(start, start + inner.length, type.create());
    tr.removeStoredMark(type);
    return tr;
  });
}

const taskRule = new InputRule(/^\[([ xX]?)\]\s$/, (state, match, start, end) => {
  const $s = state.doc.resolve(start), d = $s.depth - 1;
  if (d < 1) return null;
  const li = $s.node(d);
  if (li.type !== N.list_item || $s.index(d) !== 0) return null;
  return state.tr.delete(start, end).setNodeMarkup($s.before(d), null, {...li.attrs, checked: match[1].toLowerCase() === 'x'});
});

const mathRule = new InputRule(/(?<!\$)\$\$([^$]+)\$\$$/, (state, match, start, end) =>
  state.tr.replaceWith(start, end, N.math_inline.create({tex: match[1]})));

// a heading or code rule must not turn a figure (whose caption is text) into
// text, nor make code of text that holds math, footnotes or links
function blockRule(re, type, attrs) {
  const rule = textblockTypeInputRule(re, type, attrs);
  return new InputRule(re, (state, match, start, end) => {
    const parent = state.doc.resolve(start).parent;
    if (parent.type === N.figure) return null;
    if (type === N.code_block) {
      let keep = false;
      parent.forEach(c => { if (!c.isText || M.link.isInSet(c.marks)) keep = true; });
      if (keep) return null;
    }
    return rule.handler(state, match, start, end);
  });
}

const rules = [
  blockRule(/^(#{2,5})\s$/, N.heading, m => ({level: m[1].length})),
  wrappingInputRule(/^\s*>\s$/, N.box),
  wrappingInputRule(/^\s*([-+*])\s$/, N.bullet_list),
  wrappingInputRule(/^(\d+)\.\s$/, N.ordered_list, m => ({order: +m[1]}), (m, node) => node.childCount + node.attrs.order === +m[1]),
  taskRule,
  blockRule(/^```([\w+#-]*)\s$/, N.code_block, m => ({language: normLang(m[1])})),
  markRule(/(?<![*\w])\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, M.strong),
  markRule(/(?<![*\w])\*([^*\s](?:[^*]*[^*\s])?)\*$/, M.em),
  markRule(/(?<!`)`([^`\s][^`]*)`$/, M.code),
  markRule(/(?<!~)~~([^~\s](?:[^~]*[^~\s])?)~~$/, M.strike),
  mathRule,
];

// The position between the cursor's block and the block before (or after)
// it, as ProseMirror's join commands find it; and the type of the textblock
// at that edge of a node.
function cutBefore($pos) {
  for (let d = $pos.depth - 1; d >= 0; d--) {
    if ($pos.index(d) > 0) return $pos.doc.resolve($pos.before(d + 1));
    if ($pos.node(d).type.spec.isolating) break;
  }
  return null;
}
function cutAfter($pos) {
  for (let d = $pos.depth - 1; d >= 0; d--) {
    if ($pos.index(d) + 1 < $pos.node(d).childCount) return $pos.doc.resolve($pos.after(d + 1));
    if ($pos.node(d).type.spec.isolating) break;
  }
  return null;
}
function edgeTextblock(node, dir) {
  for (let n = node; n; n = dir < 0 ? n.lastChild : n.firstChild) {
    if (n.isTextblock) return n.type;
    if (n.isAtom) return null;
  }
  return null;
}

// --- keys -----------------------------------------------------------------------

export function buildKeymap(app) {
  const br = (state, dispatch) => {
    if (dispatch) dispatch(state.tr.replaceSelectionWith(N.hard_break.create()).scrollIntoView());
    return true;
  };
  const codeTab = (state, dispatch) => {
    if (!state.selection.$from.parent.type.spec.code) return false;
    if (dispatch) dispatch(state.tr.insertText('    '));
    return true;
  };
  const editAtom = (state, dispatch, view) => {
    const sel = state.selection;
    if (!(sel instanceof NodeSelection) || !['math_inline', 'math_display'].includes(sel.node.type.name)) return false;
    if (dispatch) app.editMath(view, sel.from);
    return true;
  };
  // A figure's caption is text, so joining or splitting it would merge or
  // copy the image: these keys select the figure instead, or leave it.
  const figureStart = (state, dispatch) => {
    const {$cursor} = state.selection;
    if (!$cursor || $cursor.parent.type !== N.figure || $cursor.parentOffset > 0) return false;
    if (dispatch) dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cursor.before())));
    return true;
  };
  // Backspace at the start of a block, or Delete at the end of one, would
  // join it with the next text in that direction, at any depth; when that
  // text is a figure's caption, an empty block goes instead and the cursor
  // moves into the caption, and otherwise the figure is selected.
  const besideFigure = dir => (state, dispatch) => {
    const {$cursor} = state.selection;
    if (!$cursor || $cursor.depth < 1) return false;
    if (dir < 0 ? $cursor.parentOffset > 0 : $cursor.parentOffset < $cursor.parent.content.size) return false;
    if ($cursor.parent.type === N.figure) return dir > 0;
    const $cut = dir < 0 ? cutBefore($cursor) : cutAfter($cursor);
    const beside = $cut && (dir < 0 ? $cut.nodeBefore : $cut.nodeAfter);
    if (!beside || edgeTextblock(beside, dir) !== N.figure) return false;
    if (dispatch) {
      const near = Selection.findFrom($cut, dir, true);
      // an empty line goes, with whatever holds only it (a list item, a box);
      // a line with text selects the figure instead
      let top = $cursor.depth;
      while (top - 1 > $cut.depth && $cursor.node(top - 1).childCount === 1) top--;
      if ($cursor.parent.content.size) dispatch(state.tr.setSelection(NodeSelection.create(state.doc, near.$from.before())));
      else {
        const tr = state.tr.delete($cursor.before(top), $cursor.after(top));
        dispatch(tr.setSelection(Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, dir)), dir, true)).scrollIntoView());
      }
    }
    return true;
  };
  const figureEnter = (state, dispatch) => {
    const {$from} = state.selection;
    if ($from.parent.type !== N.figure) return false;
    const pos = $from.after(), $p = state.doc.resolve(pos);
    if (!$p.parent.canReplaceWith($p.index(), $p.index(), N.paragraph)) return true;
    if (dispatch) {
      const tr = state.tr.insert(pos, N.paragraph.create());
      dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos + 1))).scrollIntoView());
    }
    return true;
  };
  // a new checklist item starts unticked
  const splitItem = (state, dispatch) => splitListItem(N.list_item)(state, dispatch && (tr => {
    const $p = tr.selection.$from;
    for (let d = $p.depth; d > 0; d--) {
      const n = $p.node(d);
      if (n.type !== N.list_item) continue;
      if (n.attrs.checked) tr.setNodeMarkup($p.before(d), null, {...n.attrs, checked: false});
      break;
    }
    dispatch(tr);
  }));
  const keys = {
    'Mod-z': undo, 'Shift-Mod-z': redo, 'Mod-y': redo,
    Backspace: chainCommands(undoInputRule, figureStart, besideFigure(-1)),
    Delete: besideFigure(1),
    // the other delete keys (and the Mac ones) join blocks too
    'Mod-Backspace': chainCommands(figureStart, besideFigure(-1)),
    'Shift-Backspace': chainCommands(figureStart, besideFigure(-1)),
    'Alt-Backspace': chainCommands(figureStart, besideFigure(-1)),
    'Ctrl-h': chainCommands(figureStart, besideFigure(-1)),
    'Mod-Delete': besideFigure(1),
    'Alt-Delete': besideFigure(1),
    'Ctrl-d': besideFigure(1),
    'Ctrl-Alt-Backspace': besideFigure(1),
    'Alt-d': besideFigure(1),
    'Mod-b': toggle('strong'), 'Mod-i': toggle('em'), 'Mod-`': toggle('code'), 'Mod-Shift-x': toggle('strike'),
    'Mod-u': toggleLine('ul'),
    'Mod-k': (state, dispatch, view) => { app.editLink(view); return true; },
    // Ctrl as well as Cmd on a Mac, where Cmd+M minimizes the window
    'Mod-m': (state, dispatch, view) => { app.insertMath(view, false); return true; },
    'Mod-Shift-m': (state, dispatch, view) => { app.insertMath(view, true); return true; },
    'Ctrl-m': (state, dispatch, view) => { app.insertMath(view, false); return true; },
    'Ctrl-Shift-m': (state, dispatch, view) => { app.insertMath(view, true); return true; },
    'Shift-Enter': chainCommands(exitCode, br),
    'Mod-Enter': exitCode,
    Enter: chainCommands(editAtom, figureEnter, newlineInCode, splitItem),
    Tab: chainCommands(goToNextCell(1), indent, codeTab, state => !!listAt(state)),
    'Shift-Tab': chainCommands(goToNextCell(-1), outdent, state => !!listAt(state)),
    'Mod-Alt-0': setBlock(N.paragraph),
  };
  for (const l of [2, 3, 4, 5]) keys[`Mod-Alt-${l}`] = setBlock(N.heading, {level: l});
  return keys;
}

// --- plugins --------------------------------------------------------------------

// A list item's bullet takes the pen when all of the item's text is in it.
function itemPen(node) {
  let pen;
  node.descendants(n => {
    if (n.type === N.footnote || pen === null) return false;
    if (n.isText) {
      const m = M.pen.isInSet(n.marks), c = m ? m.attrs.color : null;
      pen = pen === undefined ? c : pen === c ? pen : null;
    }
    return true;
  });
  return pen || null;
}

const listPens = new Plugin({
  appendTransaction(trs, old, state) {
    if (!trs.some(t => t.docChanged)) return null;
    let tr = null;
    state.doc.descendants((node, pos) => {
      if (node.type !== N.list_item) return true;
      const pen = itemPen(node);
      if (pen !== node.attrs.pen) (tr = tr || state.tr).setNodeMarkup(pos, null, {...node.attrs, pen});
      return true;
    });
    return tr;
  },
});

const placeholder = new Plugin({
  props: {
    decorations(state) {
      const d = state.doc, f = d.firstChild;
      if (d.childCount !== 1 || f.type !== N.paragraph || f.content.size) return null;
      return DecorationSet.create(d, [Decoration.node(0, f.nodeSize, {
        class: 'is-empty', 'data-placeholder': 'Write here. Select words and pick a pen to color them.',
      })]);
    },
  },
});

// A click on a checklist box (drawn left of the item) ticks it.
const taskClicks = new Plugin({
  props: {
    handleDOMEvents: {
      mousedown(view, e) {
        const li = e.target instanceof Element ? e.target.closest('li.task-list-item') : null;
        if (!view.editable || !li || e.target !== li || e.clientX >= li.getBoundingClientRect().left) return false;
        const $p = view.state.doc.resolve(view.posAtDOM(li, 0));
        for (let d = $p.depth; d > 0; d--) {
          const n = $p.node(d);
          if (n.type === N.list_item) {
            view.dispatch(view.state.tr.setNodeMarkup($p.before(d), null, {...n.attrs, checked: !n.attrs.checked}));
            e.preventDefault();
            return true;
          }
        }
        return false;
      },
    },
  },
});

export function plugins(app) {
  return [
    tableEditing(),
    inputRules({rules}),
    keymap(buildKeymap(app)),
    keymap(baseKeymap),
    history(),
    dropCursor({color: 'var(--accent)', width: 2}),
    gapCursor(),
    listPens,
    placeholder,
    taskClicks,
  ];
}
