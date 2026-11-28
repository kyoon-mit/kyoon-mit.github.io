/* Masthead menus: a click or Enter toggles them, Escape or leaving closes them; hover opening is in main.css. */
(function () {
  document.querySelectorAll("[data-menu]").forEach(function (menu) {
    var btn = menu.querySelector("[data-menu-button]");
    if (!btn) return;
    function set(open) {
      menu.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () { set(!menu.classList.contains("is-open")); });
    menu.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) btn.setAttribute("aria-expanded", "true"); });
    menu.addEventListener("mouseleave", function () { set(false); });
    menu.addEventListener("focusout", function (e) { if (!menu.contains(e.relatedTarget)) set(false); });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && (menu.classList.contains("is-open") || btn.getAttribute("aria-expanded") === "true")) { set(false); btn.focus(); }
    });
    document.addEventListener("click", function (e) { if (!menu.contains(e.target)) set(false); });
  });
})();
