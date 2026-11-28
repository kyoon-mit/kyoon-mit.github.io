/* GitHub sends the browser back here with ?code=&state=; trade the code and return. */
'use strict';
(async () => {
  const params = new URLSearchParams(location.search);
  history.replaceState(null, '', location.pathname);
  const msg = document.getElementById('msg');
  if (params.get('error')) { msg.textContent = 'Sign-in was cancelled.'; return; }
  try {
    location.replace(await GHAUTH.finish(params));
  } catch (_) {
    msg.textContent = 'Sign-in did not complete. Go back to the page and try again.';
  }
})();
