// Floating panels under a toolbar button or a piece of the post (link, math,
// alt text, menus). One is open at a time.

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function button(label, onClick, cls = 'ed-btn') {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('mousedown', e => e.preventDefault());
  b.addEventListener('click', onClick);
  return b;
}

let current = null;

export function closePopover(commit = true) {
  if (!current) return;
  const c = current;
  current = null;
  c.close(commit);
}

export const popoverOpen = () => current;

// anchor: an element, or a function giving a rect to sit under.
export function popover(anchor, {cls = '', label = '', onClose = () => {}} = {}) {
  closePopover();
  const pop = el('div', 'ed-pop ' + cls);
  pop.setAttribute('role', 'dialog');
  if (label) pop.setAttribute('aria-label', label);
  document.body.append(pop);
  const rect = () => (typeof anchor === 'function' ? anchor() : anchor.getBoundingClientRect());
  const place = () => {
    const r = rect();
    pop.style.left = '0px';
    const w = pop.offsetWidth;
    const left = Math.max(8, Math.min(r.left, document.documentElement.clientWidth - w - 8));
    pop.style.left = `${left + window.scrollX}px`;
    pop.style.top = `${r.bottom + window.scrollY + 6}px`;
  };
  const outside = e => {
    if (pop.contains(e.target) || (typeof anchor !== 'function' && anchor.contains(e.target))) return;
    closePopover(true);
  };
  const keys = e => {
    // an Escape that ends an input method's composition is not for us
    if (e.key === 'Escape' && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      e.stopPropagation();
      closePopover(false);
    }
  };
  document.addEventListener('mousedown', outside, true);
  document.addEventListener('keydown', keys, true);
  window.addEventListener('resize', place);
  const handle = {
    el: pop, place,
    close(commit) {
      document.removeEventListener('mousedown', outside, true);
      document.removeEventListener('keydown', keys, true);
      window.removeEventListener('resize', place);
      pop.remove();
      onClose(commit);
    },
  };
  current = handle;
  return handle;
}
