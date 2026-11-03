// Code blocks: the languages the editor offers, and highlighting at publish
// time with highlight.js, mapped onto the Rouge classes that main.css colors
// for Markdown posts.
import hljs from '../../vendor/highlight/core.js';

export const LANGUAGES = [
  ['', 'Plain text'], ['python', 'Python'], ['bash', 'Bash'], ['shell', 'Shell session'],
  ['c', 'C'], ['cpp', 'C++'], ['julia', 'Julia'], ['julia-repl', 'Julia REPL'],
  ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['json', 'JSON'], ['yaml', 'YAML'],
  ['ini', 'TOML or INI'], ['latex', 'LaTeX'], ['markdown', 'Markdown'], ['sql', 'SQL'],
  ['rust', 'Rust'], ['go', 'Go'], ['xml', 'HTML or XML'], ['css', 'CSS'], ['diff', 'Diff'],
  ['makefile', 'Makefile'], ['dockerfile', 'Dockerfile'], ['matlab', 'MATLAB'], ['r', 'R'],
  ['fortran', 'Fortran'], ['cmake', 'CMake'],
];
const KNOWN = new Set(LANGUAGES.map(([k]) => k));
const ALIASES = {
  py: 'python', python3: 'python', sh: 'bash', zsh: 'bash', console: 'shell', 'c++': 'cpp',
  js: 'javascript', ts: 'typescript', yml: 'yaml', toml: 'ini', tex: 'latex', md: 'markdown',
  html: 'xml', jl: 'julia', text: '', plaintext: '', txt: '', plain: '',
};
// languages that highlight parts of themselves with another one
const NEEDS = {shell: ['bash'], 'julia-repl': ['julia'], xml: ['css', 'javascript']};

export function normLang(lang) {
  const l = (lang || '').trim().toLowerCase();
  const a = l in ALIASES ? ALIASES[l] : l;
  return KNOWN.has(a) ? a : l.replace(/[^\w+#-]/g, '');
}

const loading = new Map();
function load(lang) {
  if (!loading.has(lang)) {
    loading.set(lang, import(`../../vendor/highlight/languages/${lang}.js`).then(m => hljs.registerLanguage(lang, m.default)));
  }
  return loading.get(lang);
}

export const escapeHTML = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// highlight.js scope -> Rouge class (main.css: "Blog: post", keys, code)
const ROUGE = {
  comment: 'c', quote: 'c', doctag: 'cs', meta: 'cp', keyword: 'k', built_in: 'nb', type: 'kt',
  literal: 'kc', number: 'm', string: 's', regexp: 'sr', symbol: 'ss', char: 'sc', subst: 'si',
  'template-variable': 'si', title: 'nf', function: 'nf', class: 'nc', attr: 'na', attribute: 'na',
  variable: 'nv', operator: 'o', punctuation: 'p', property: 'py', tag: 'nt', name: 'nt',
  'selector-tag': 'nt', 'selector-class': 'nc', 'selector-id': 'ni', section: 'gh',
  addition: 'gi', deletion: 'gd', emphasis: 'ge', strong: 'gs', bullet: 'k', link: 'na',
};

function toRouge(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  for (const span of t.content.querySelectorAll('span')) {
    const cls = [...span.classList];
    const scope = (cls.find(c => c.startsWith('hljs-')) || '').slice(5);
    let r = ROUGE[scope] || '';
    if (scope === 'title' && cls.includes('class_')) r = 'nc';
    if (r) span.className = r;
    else span.removeAttribute('class');
  }
  for (const span of t.content.querySelectorAll('span:not([class])')) span.replaceWith(...span.childNodes);
  const div = document.createElement('div');
  div.append(t.content);
  return div.innerHTML;
}

// The HTML inside <code> for a code block, with Rouge classes.
export async function highlight(code, lang) {
  const l = normLang(lang);
  if (!KNOWN.has(l) || !l) return escapeHTML(code);
  try {
    await Promise.all([l, ...(NEEDS[l] || [])].map(load));
    return toRouge(hljs.highlight(code, {language: l, ignoreIllegals: true}).value);
  } catch (e) {
    return escapeHTML(code);
  }
}
