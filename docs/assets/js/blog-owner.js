// Blog pages: show the links to the editor (/blog/edit/) when this browser
// has signed in to it, with a pasted token or the site's GitHub sign-in.
// Only whether those keys exist is read here, never a token.
(function () {
  var on = false;
  try { on = localStorage.getItem("blog-editor") === "1" || localStorage.getItem("gh-site-token") !== null; } catch (e) { return; }
  if (!on) return;
  document.querySelectorAll("[data-owner]").forEach(function (el) { el.hidden = false; });
})();
