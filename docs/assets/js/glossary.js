// Glossary links for BNS pages.
// Links the first appearance of each glossary term in the page body to its
// entry on the definitions page, and shows the short definition after 1 s of
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

  function link(root, terms, base) {
    var forms = [];
    terms.forEach(function (t) {
      [t.n].concat(t.a || []).forEach(function (form) {
        forms.push({ id: t.id, re: new RegExp("(^|[^\\w-])(" + escapeRe(form) + ")(?![\\w-])", t.c ? "" : "i"), len: form.length });
      });
    });
    var byId = {};
    terms.forEach(function (t) { byId[t.id] = t; });
    var done = {};
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (skipped(node, root)) return;
      var text = node.nodeValue;
      while (text) {
        var best = null;
        forms.forEach(function (f) {
          if (done[f.id]) return;
          var m = f.re.exec(text);
          if (!m) return;
          var start = m.index + m[1].length;
          if (!best || start < best.start || (start === best.start && f.len > best.len)) {
            best = { id: f.id, start: start, len: m[2].length };
          }
        });
        if (!best) break;
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
    var byId = link(root, terms, window.BNS_GLOSSARY_URL);
    tooltips(byId);
  }

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
