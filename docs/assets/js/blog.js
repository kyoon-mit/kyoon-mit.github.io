// Kind and field filters on the blog index (blog/index.html). Without
// JavaScript the filters stay hidden and every post is listed. Each button's
// count is the number of posts it would show, given the other filter.
(function () {
  var bar = document.querySelector("[data-blog-filters]");
  if (!bar) return;
  var items = Array.prototype.slice.call(document.querySelectorAll(".blog-list__item"));
  var none = document.querySelector("[data-blog-none]");
  var state = { kind: "", field: "" };

  function matches(li, kind, field) {
    var fields = " " + (li.getAttribute("data-fields") || "") + " ";
    return (!kind || li.getAttribute("data-kind") === kind) &&
           (!field || fields.indexOf(" " + field + " ") !== -1);
  }

  function count(kind, field) {
    return items.filter(function (li) { return matches(li, kind, field); }).length;
  }

  function apply() {
    var shown = 0;
    items.forEach(function (li) {
      var ok = matches(li, state.kind, state.field);
      li.hidden = !ok;
      if (ok) shown += 1;
    });
    bar.querySelectorAll(".blog-filter__n").forEach(function (n) {
      var b = n.parentNode, v = b.getAttribute("data-value");
      n.textContent = b.getAttribute("data-group") === "kind" ? count(v, state.field) : count(state.kind, v);
    });
    if (none) none.textContent = shown > 0 ? "" : "No posts match these filters.";
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-group]");
    if (!b) return;
    var group = b.getAttribute("data-group");
    state[group] = b.getAttribute("data-value");
    bar.querySelectorAll('button[data-group="' + group + '"]').forEach(function (o) {
      o.setAttribute("aria-pressed", o === b ? "true" : "false");
    });
    apply();
  });

  bar.hidden = false;
})();
