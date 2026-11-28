// Floating panels under a toolbar button or a piece of the post (link, math,
// alt text, menus). One is open at a time. Also the tooltip shown for any
// element with data-tip.

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
      const back = handle.back;
      closePopover(false);
      if (back && back.isConnected) back.focus();
    } else if (e.key === 'Tab' && pop.contains(document.activeElement)) {
      // Tab stays inside the panel while the focus is in it
      const f = [...pop.querySelectorAll('button, input, select, textarea, a[href]')]
        .filter(x => !x.disabled && x.getClientRects().length);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? f[f.length - 1] : f[i - 1]) : (i < 0 || i === f.length - 1 ? f[0] : f[i + 1]);
      e.preventDefault();
      next.focus();
    }
  };
  document.addEventListener('mousedown', outside, true);
  document.addEventListener('keydown', keys, true);
  window.addEventListener('resize', place);
  document.addEventListener('scroll', place, true);
  // back: where Escape returns the focus (set when the panel was opened from
  // the keyboard)
  const handle = {
    el: pop, place, anchor: typeof anchor === 'function' ? null : anchor, back: null,
    close(commit) {
      document.removeEventListener('mousedown', outside, true);
      document.removeEventListener('keydown', keys, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
      pop.remove();
      onClose(commit);
    },
  };
  current = handle;
  return handle;
}

// One shared tooltip for elements with data-tip: after a short hover with a
// mouse, or at once on keyboard focus.
let tip = null, tipTimer = 0, tipFor = null;
function placeTip(t) {
  const r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, document.documentElement.clientWidth - w - 8));
  const top = r.bottom + 6 + h > window.innerHeight ? r.top - 6 - h : r.bottom + 6;
  tip.style.left = `${left + window.scrollX}px`;
  tip.style.top = `${top + window.scrollY}px`;
}
export function initTips() {
  tip = el('div', 'ed-tip');
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);
  const hide = () => { clearTimeout(tipTimer); tipFor = null; tip.hidden = true; };
  const show = t => { tipFor = t; tip.textContent = t.dataset.tip; tip.hidden = false; placeTip(t); };
  document.addEventListener('pointerover', e => {
    const t = e.target instanceof Element ? e.target.closest('[data-tip]') : null;
    if (t === tipFor) return;
    hide();
    if (t && e.pointerType === 'mouse') tipTimer = setTimeout(() => show(t), 400);
  });
  document.addEventListener('focusin', e => {
    const t = e.target instanceof Element ? e.target.closest('[data-tip]') : null;
    hide();
    if (t && t.matches(':focus-visible')) show(t);
  });
  for (const ev of ['pointerdown', 'focusout', 'scroll']) document.addEventListener(ev, hide, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); }, true);
}
