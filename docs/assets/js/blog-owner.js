// Blog pages: show the links to the editor (/blog/edit/) when this browser
// has signed in to it. Only a flag is read here, never the token.
(function () {
  var on = false;
  try { on = localStorage.getItem("blog-editor") === "1"; } catch (e) { return; }
  if (!on) return;
  document.querySelectorAll("[data-owner]").forEach(function (el) { el.hidden = false; });
})();
