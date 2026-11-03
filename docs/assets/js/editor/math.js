// KaTeX in the editor, set up as on blog pages (_includes/head.html): math
// pens \blue{...} to \pencil{...}.
import {PENS} from './schema.js';

const MACROS = Object.fromEntries(PENS.map(p => ['\\' + p, `\\htmlClass{${p}}{#1}`]));

export function renderTex(tex, el, display) {
  const katex = window.katex;
  if (!katex) {
    el.textContent = tex;
    return;
  }
  try {
    katex.render(tex, el, {
      displayMode: display, throwOnError: false, macros: {...MACROS},
      trust: c => c.command === '\\htmlClass',
      strict: c => (c === 'htmlExtension' ? 'ignore' : 'warn'),
    });
  } catch (e) {
    el.textContent = tex;
  }
}
