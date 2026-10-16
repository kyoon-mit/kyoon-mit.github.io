// Show or hide the objection, rebuttal and verdict blocks of a page.
// Buttons in a .debate-toggles row carry data-kind and aria-pressed; hiding a
// kind puts the class hide-<kind> on the enclosing article. The choice is
// remembered in localStorage when storage is available.
(function () {
  var KEY = "bns-debate-hidden";

  function load() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (e) {
      return {};
    }
  }

  function save(hidden) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(hidden));
    } catch (e) {
      // storage blocked: the choice lasts for this visit only
    }
  }

  function init() {
    var bar = document.querySelector(".debate-toggles");
    if (!bar) return;
    var root = bar.closest("article") || document.body;
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-kind]"));
    var hidden = load();

    function apply() {
      buttons.forEach(function (b) {
        var kind = b.getAttribute("data-kind");
        var off = hidden[kind] === true;
        b.setAttribute("aria-pressed", off ? "false" : "true");
        root.classList.toggle("hide-" + kind, off);
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var kind = b.getAttribute("data-kind");
        hidden[kind] = hidden[kind] !== true;
        save(hidden);
        apply();
      });
    });

    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
