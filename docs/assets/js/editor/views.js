// How math, code blocks, figures and footnotes look and behave while editing.
import {EditorState} from '../../vendor/prosemirror/state.js';
import {EditorView} from '../../vendor/prosemirror/view.js';
import {StepMap} from '../../vendor/prosemirror/transform.js';
import {keymap} from '../../vendor/prosemirror/keymap.js';
import {undo, redo} from '../../vendor/prosemirror/history.js';
import {toggleMark} from '../../vendor/prosemirror/commands.js';
import {TextSelection} from '../../vendor/prosemirror/state.js';
import {schema} from './schema.js';
import {renderTex} from './math.js';
import {LANGUAGES, normLang} from './code.js';
import {el, button} from './ui.js';

// Math: rendered with KaTeX; a click opens the TeX (app.js, editMath).
export class MathView {
  constructor(node) {
    this.node = node;
    this.display = node.type.name === 'math_display';
    this.dom = el(this.display ? 'div' : 'span', 'ed-math' + (this.display ? ' ed-math--display' : ''));
    this.dom.title = 'Math: click to edit the TeX';
    this.render();
  }
  render() {
    const tex = this.node.attrs.tex;
    this.dom.textContent = '';
    this.dom.classList.toggle('is-empty', !tex.trim());
    if (!tex.trim()) this.dom.textContent = this.display ? 'Display math' : 'math';
    else renderTex(tex, this.dom, this.display);
  }
  update(node) {
    if (node.type !== this.node.type) return false;
    const changed = node.attrs.tex !== this.node.attrs.tex;
    this.node = node;
    if (changed) this.render();
    return true;
  }
  selectNode() { this.dom.classList.add('ProseMirror-selectednode'); }
  deselectNode() { this.dom.classList.remove('ProseMirror-selectednode'); }
  ignoreMutation() { return true; }
}

// Code: a language menu over the block.
export class CodeBlockView {
  constructor(node, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = el('div', 'ed-code');
    this.bar = el('div', 'ed-code__bar');
    this.bar.contentEditable = 'false';
    this.select = el('select', 'ed-code__lang');
    this.select.setAttribute('aria-label', 'Language of this code');
    for (const [k, label] of LANGUAGES) this.select.append(new Option(label, k));
    this.select.addEventListener('change', () => {
      const pos = this.getPos();
      if (pos == null || !this.view.editable) return this.showLanguage();
      this.view.dispatch(this.view.state.tr.setNodeMarkup(pos, null, {...this.node.attrs, language: this.select.value}));
      this.view.focus();
    });
    this.bar.append(this.select);
    const pre = el('pre');
    this.contentDOM = el('code');
    pre.append(this.contentDOM);
    this.dom.append(this.bar, pre);
    this.showLanguage();
  }
  showLanguage() {
    const l = normLang(this.node.attrs.language);
    if (![...this.select.options].some(o => o.value === l)) this.select.append(new Option(l, l));
    this.select.value = l;
  }
  update(node) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.showLanguage();
    return true;
  }
  stopEvent(e) { return this.bar.contains(e.target); }
  ignoreMutation(m) { return m.type !== 'selection' && !this.contentDOM.contains(m.target); }
}

// Figure: the image, its caption (editable text), and tools.
export class FigureView {
  constructor(node, view, getPos, app) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.app = app;
    this.dom = el('figure', 'plot ed-figure');
    this.frame = el('div', 'plot__img ed-figure__img');
    this.frame.contentEditable = 'false';
    this.img = el('img');
    this.img.draggable = false;
    // a just-published image is on the site only after the next build
    this.img.addEventListener('error', () => {
      this.dom.classList.add('is-missing');
      this.dom.dataset.missing = app.justUploaded(this.node.attrs.src) ? 'soon' : 'gone';
    });
    this.img.addEventListener('load', () => this.dom.classList.remove('is-missing'));
    this.frame.append(this.img);
    this.contentDOM = el('figcaption', 'plot__caption');
    this.tools = el('div', 'ed-figure__tools');
    this.tools.contentEditable = 'false';
    this.altBtn = button('Alt text', () => app.editAlt(this.view, this.getPos()), 'ed-link');
    const remove = button('Remove image', () => {
      const pos = this.getPos();
      if (pos == null || !this.view.editable) return;
      this.view.dispatch(this.view.state.tr.delete(pos, pos + this.node.nodeSize));
      this.view.focus();
    }, 'ed-link');
    this.where = el('span', 'ed-figure__where');
    this.tools.append(this.altBtn, remove, this.where);
    this.dom.append(this.frame, this.contentDOM, this.tools);
    this.render(true);
  }
  render(loadSrc) {
    const {src, alt} = this.node.attrs;
    if (loadSrc) this.app.imageURL(src).then(url => { if (this.node.attrs.src === src) this.img.src = url; });
    this.img.alt = alt;
    this.altBtn.textContent = alt ? 'Alt text ✓' : 'Alt text (none yet)';
    this.where.textContent = /^https?:/i.test(src) ? `Shown from ${src.split('/')[2]}, not kept on the site` : '';
    this.dom.classList.toggle('is-empty', this.node.content.size === 0);
  }
  update(node) {
    if (node.type !== this.node.type) return false;
    const srcChanged = node.attrs.src !== this.node.attrs.src;
    this.node = node;
    this.render(srcChanged);
    return true;
  }
  stopEvent(e) { return this.tools.contains(e.target); }
  ignoreMutation(m) { return m.type !== 'selection' && !this.contentDOM.contains(m.target); }
}

// Footnote: a number in the text; selecting it opens a small editor for its
// text (ProseMirror's footnote example). Edits there are steps of the post.
export class FootnoteView {
  constructor(node, view, getPos, app) {
    this.node = node;
    this.outerView = view;
    this.getPos = getPos;
    this.app = app;
    this.dom = el('sup', 'ed-fn');
    this.dom.title = 'Footnote: click to edit';
    this.innerView = null;
  }
  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
    if (!this.innerView) this.open();
  }
  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
    if (this.innerView) this.close();
  }
  open() {
    const pop = this.dom.appendChild(el('span', 'ed-fn__pop'));
    pop.append(el('span', 'ed-pop__label', 'Footnote'));
    const holder = pop.appendChild(el('span', 'ed-fn__holder'));
    pop.append(el('span', 'ed-pop__hint', 'Esc or Enter to go back to the post'));
    const leave = () => {
      const pos = this.getPos();
      const tr = this.outerView.state.tr;
      this.outerView.dispatch(tr.setSelection(TextSelection.create(tr.doc, pos + this.node.nodeSize)));
      this.outerView.focus();
      return true;
    };
    const outer = cmd => () => cmd(this.outerView.state, this.outerView.dispatch);
    this.innerView = new EditorView(holder, {
      state: EditorState.create({
        doc: this.node,
        plugins: [keymap({
          'Mod-z': outer(undo), 'Mod-y': outer(redo), 'Shift-Mod-z': outer(redo),
          'Mod-b': toggleMark(schema.marks.strong), 'Mod-i': toggleMark(schema.marks.em),
          'Mod-`': toggleMark(schema.marks.code), Escape: leave, Enter: leave,
          'Mod-m': (st, d, v) => { this.app.insertMath(v, false); return true; },
          'Ctrl-m': (st, d, v) => { this.app.insertMath(v, false); return true; },
          'Mod-k': (st, d, v) => { this.app.editLink(v); return true; },
        })],
      }),
      nodeViews: {math_inline: node => new MathView(node)},
      attributes: {class: 'ed-fn__body', 'aria-label': 'Footnote text'},
      editable: () => this.app.canEdit(),
      transformPastedHTML: html => this.app.pastedHTML(html),
      dispatchTransaction: tr => this.dispatchInner(tr),
      handleClickOn: (view, pos, node, nodePos, event, direct) => {
        if (direct && node.type === schema.nodes.math_inline) {
          this.app.editMath(view, nodePos);
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        mousedown: () => {
          // the whole footnote is node-selected while the post has focus
          if (this.outerView.hasFocus()) this.innerView.focus();
          return false;
        },
        focus: () => {
          this.app.setInner(this.innerView);
          return false;
        },
      },
    });
    this.app.inners.add(this.innerView);
  }
  close() {
    this.app.setInner(null);
    this.app.inners.delete(this.innerView);
    this.innerView.destroy();
    this.innerView = null;
    this.dom.textContent = '';
  }
  dispatchInner(tr) {
    const {state, transactions} = this.innerView.state.applyTransaction(tr);
    this.innerView.updateState(state);
    if (!tr.getMeta('fromOutside')) {
      const outerTr = this.outerView.state.tr, offset = StepMap.offset(this.getPos() + 1);
      for (const t of transactions) for (const step of t.steps) outerTr.step(step.map(offset));
      if (outerTr.docChanged) this.outerView.dispatch(outerTr);
    }
    this.app.refreshToolbar();
  }
  update(node) {
    if (!node.sameMarkup(this.node)) return false;
    this.node = node;
    if (this.innerView) {
      const state = this.innerView.state;
      const start = node.content.findDiffStart(state.doc.content);
      if (start != null) {
        let {a: endA, b: endB} = node.content.findDiffEnd(state.doc.content);
        const overlap = start - Math.min(endA, endB);
        if (overlap > 0) {
          endA += overlap;
          endB += overlap;
        }
        this.innerView.dispatch(state.tr.replace(start, endB, node.slice(start, endA)).setMeta('fromOutside', true));
      }
    }
    return true;
  }
  destroy() { if (this.innerView) this.close(); }
  stopEvent(event) { return !!(this.innerView && this.innerView.dom.contains(event.target)); }
  ignoreMutation() { return true; }
}
