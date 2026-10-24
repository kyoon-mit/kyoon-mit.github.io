// Glossary links for BNS pages.
// Links the first appearance of each glossary term in the summary line and
// page body to its entry on the definitions page, and shows the short definition after 1 s of
// hover or keyboard focus. Terms come from window.BNS_GLOSSARY (built from
// _data/glossary.yml in _includes/head.html).
(function () {
  var SKIP = /^(A|CODE|PRE|H1|H2|H3|H4|H5|H6|DT|SCRIPT|STYLE|SUP|SUB|BUTTON|LABEL)$/;

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function skipped(node, root) {
    for (var el = node.parentNode; el && el !== root; el = el.parentNode) {
      if (SKIP.test(el.nodeName)) return true;
      if (el.classList && (el.classList.contains("katex") || el.classList.contains("term-tip"))) return true;
    }
    return false;
  }

  function link(roots, terms, base) {
    var forms = [];
    terms.forEach(function (t) {
      (t.o ? [] : [t.n]).concat(t.a || []).forEach(function (form) {
        forms.push({ id: t.id, re: new RegExp("(^|[^\\w-])(" + escapeRe(form).replace(/ /g, "\\s+") + ")(?![\\w-])", t.c ? "" : "i"), len: form.length });
      });
    });
    var byId = {};
    terms.forEach(function (t) { byId[t.id] = t; });
    var done = {};
    var nodes = [];
    roots.forEach(function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      while (walker.nextNode()) nodes.push({ node: walker.currentNode, root: root });
    });
    nodes.forEach(function (item) {
      var node = item.node;
      if (skipped(node, item.root)) return;
      var text = node.nodeValue;
      var pos = 0;
      while (pos < text.length) {
        // earliest match among all terms, longest at the same start; a span
        // that belongs to an already linked term is passed over, not split
        var best = null;
        var rest = text.slice(pos);
        forms.forEach(function (f) {
          var m = f.re.exec(rest);
          if (!m) return;
          var start = pos + m.index + m[1].length;
          if (!best || start < best.start || (start === best.start && m[2].length > best.len)) {
            best = { id: f.id, start: start, len: m[2].length };
          }
        });
        if (!best) break;
        if (done[best.id]) {
          pos = best.start + best.len;
          continue;
        }
        done[best.id] = true;
        var after = node.splitText(best.start);
        node = after.splitText(best.len);
        var a = document.createElement("a");
        a.className = "term";
        a.href = base + "#" + best.id;
        a.setAttribute("data-term", best.id);
        a.textContent = after.nodeValue;
        after.parentNode.replaceChild(a, after);
        text = node.nodeValue;
        pos = 0;
      }
    });
    return byId;
  }

  function tooltips(byId) {
    var tip = document.createElement("div");
    tip.className = "term-tip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    document.body.appendChild(tip);
    var timer = null;
    function later(e) {
      var target = e.currentTarget;
      clearTimeout(timer);
      timer = setTimeout(function () { show(target); }, 1000);
    }
    function show(target) {
      var t = byId[target.getAttribute("data-term")];
      if (!t) return;
      tip.innerHTML = "";
      var b = document.createElement("strong");
      b.textContent = t.n;
      tip.appendChild(b);
      tip.appendChild(document.createTextNode(" " + t.s));
      tip.hidden = false;
      var r = target.getBoundingClientRect();
      var w = tip.offsetWidth;
      var left = Math.min(Math.max(8, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - w - 8);
      tip.style.left = left + "px";
      tip.style.top = (r.bottom + window.scrollY + 6) + "px";
    }
    function hide() { clearTimeout(timer); tip.hidden = true; }
    document.querySelectorAll("a.term").forEach(function (a) {
      a.addEventListener("mouseenter", later);
      a.addEventListener("focus", later);
      a.addEventListener("mouseleave", hide);
      a.addEventListener("blur", hide);
    });
  }

  function run() {
    var terms = window.BNS_GLOSSARY;
    var root = document.querySelector(".doc__body .prose");
    if (!terms || !root) return;
    var roots = [document.querySelector(".doc__body .page__lede"), root].filter(Boolean);
    var byId = link(roots, terms, window.BNS_GLOSSARY_URL);
    tooltips(byId);
  }

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
