/* Thesis page boot: show the notes if a remembered key works, else start the gate. */
'use strict';
(async () => {
  let shown = false;
  try { shown = await VAULT.boot(); } catch (_) { shown = false; }
  if (!shown) {
    document.getElementById('gate').hidden = false;
    WORLD.start();
  }
})();
