/* Search, theme, navigation and local-declaration toggles for the library
   documentation. The search index is window.LIBDOC_SEARCH (search-index.js). */
(function () {
  "use strict";
  var root = document.documentElement;

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable */ }
  }
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------- theme */
  var THEMES = ["system", "light", "dark"];
  var LABELS = { system: "System", light: "Light", dark: "Dark" };
  var ICONS = {
    system: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3"/></g></svg>',
    dark: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" fill="currentColor"/></svg>'
  };
  function currentTheme() {
    var t = load("libdoc-theme");
    return THEMES.indexOf(t) >= 0 ? t : "system";
  }
  function applyTheme(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t);
    else if (load("libdoc-theme")) root.removeAttribute("data-theme");
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.innerHTML = ICONS[t] + "<span>" + LABELS[t] + "</span>";
      btn.setAttribute("aria-label", "Color theme: " + LABELS[t] + ". Change theme");
    }
  }
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    applyTheme(currentTheme());
    themeBtn.addEventListener("click", function () {
      var t = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
      if (t === "system") { store("libdoc-theme", null); root.removeAttribute("data-theme"); }
      else store("libdoc-theme", t);
      applyTheme(t);
    });
  }

  /* ----------------------------------------------------------- navigation */
  var navBtn = document.getElementById("nav-toggle");
  if (navBtn) {
    navBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      var nav = document.getElementById("sidenav");
      if (nav && !nav.contains(e.target) && !navBtn.contains(e.target)) {
        document.body.classList.remove("nav-open");
        navBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
  var cur = document.querySelector(".sidenav .current");
  if (cur && cur.scrollIntoView) {
    var nav = document.getElementById("sidenav");
    if (nav) {
      var r = cur.getBoundingClientRect(), nr = nav.getBoundingClientRect();
      if (r.top > nr.bottom - 40 || r.top < nr.top) nav.scrollTop += r.top - nr.top - nr.height / 3;
    }
  }

  /* ------------------------------------------------ local declarations */
  var localBox = document.getElementById("show-local");
  function setLocal(on) {
    document.body.classList.toggle("show-local", on);
    if (localBox) localBox.checked = on;
  }
  if (localBox) {
    setLocal(load("libdoc-show-local") === "1");
    localBox.addEventListener("change", function () {
      setLocal(localBox.checked);
      store("libdoc-show-local", localBox.checked ? "1" : null);
    });
  }
  function revealTarget() {
    var id = decodeURIComponent((location.hash || "").slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains("is-local") && !document.body.classList.contains("show-local")) {
      setLocal(true);
      el.scrollIntoView();
    }
    var det = el.closest ? el.closest("details") : null;
    if (det && !det.open) { det.open = true; el.scrollIntoView(); }
  }
  window.addEventListener("hashchange", revealTarget);
  revealTarget();

  /* ------------------------------------------------------------- filters */
  var filter = document.getElementById("glossary-filter");
  if (filter) {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      rows.forEach(function (row) {
        row.hidden = q !== "" && row.getAttribute("data-filter").indexOf(q) < 0;
      });
      document.querySelectorAll("[data-filter-group]").forEach(function (g) {
        var any = g.querySelector("[data-filter]:not([hidden])");
        g.hidden = !any;
      });
    });
  }

  /* -------------------------------------------------------------- search */
  var input = document.getElementById("search-input");
  var box = document.getElementById("search-results");
  var data = window.LIBDOC_SEARCH;
  if (!input || !box || !data) return;

  var KIND = data.kinds;
  var entries = [];
  data.modules.forEach(function (m, i) {
    entries.push({ name: m[0], lname: m[0].toLowerCase(), kind: "module", href: m[2], sub: m[1], short: m[3].toLowerCase(), rank: 0 });
  });
  data.decls.forEach(function (d) {
    var m = data.modules[d[2]];
    entries.push({ name: d[0], lname: d[0].toLowerCase(), kind: KIND[d[1]], href: m[2] + "#" + d[3], sub: m[0], short: d[0].toLowerCase(), rank: d[4] || 0 });
  });
  data.glossary.forEach(function (g) {
    var m = data.modules[g[2]];
    entries.push({ name: g[0], lname: g[0].toLowerCase(), kind: "glossary", href: g[3] ? m[2] + "#" + g[3] : m[2], sub: g[1], short: g[0].toLowerCase(), rank: 0 });
  });
  data.pages.forEach(function (p) {
    entries.push({ name: p[0], lname: p[0].toLowerCase(), kind: "page", href: p[1], sub: p[2], short: p[0].toLowerCase(), rank: 0 });
  });
  (data.results || []).forEach(function (r) {
    entries.push({ name: r[0], lname: r[0].toLowerCase(), kind: "result", href: r[1], sub: r[2], short: r[0].toLowerCase(), rank: 0 });
  });
  entries.forEach(function (e) { e.lsub = (e.sub || "").toLowerCase(); });
  var PROSE_KINDS = { module: 1, page: 1, result: 1, glossary: 1 };

  function score1(e, q, words) {
    var s = e.short, n = e.lname;
    if (s === q || n === q) return 0;
    if (s.indexOf(q) === 0) return 1;
    var i = s.indexOf(q);
    if (i > 0 && /[_.\s]/.test(s.charAt(i - 1))) return 2;
    if (i > 0) return 3;
    if (n.indexOf(q) >= 0) return 4;
    if (words.length > 1) {
      var all = true;
      for (var k = 0; k < words.length; k++) if (n.indexOf(words[k]) < 0) { all = false; break; }
      if (all) return 5;
    }
    // subsequence
    var j = 0;
    for (var c = 0; c < s.length && j < q.length; c++) if (s.charAt(c) === q.charAt(j)) j++;
    if (j === q.length && q.length >= 3) return 6;
    return -1;
  }
  // a query is tried as typed and with hyphens and blanks read as
  // underscores (Hanson-Wright finds hanson_wright); module titles, results
  // and glossary readings also match when they contain every word
  function score(e, q, words) {
    var best = score1(e, q, words);
    var qu = q.replace(/[\s-]+/g, "_");
    if (qu !== q) {
      var b2 = score1(e, qu, [qu]);
      if (b2 >= 0 && (best < 0 || b2 < best)) best = b2;
    }
    if ((best < 0 || best >= 6) && PROSE_KINDS[e.kind]) {
      var hay = e.lname + " " + e.lsub, all = true;
      for (var k = 0; k < words.length; k++) if (hay.indexOf(words[k]) < 0) { all = false; break; }
      if (all) return 7;
    }
    return best;
  }

  var KIND_ORDER = { result: 0, module: 0, page: 0, theorem: 1, lemma: 1, corollary: 1, fact: 1, definition: 1, fixpoint: 1, glossary: 2 };
  var active = -1, shown = [];

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function highlight(name, q) {
    var i = name.toLowerCase().indexOf(q);
    if (i < 0 || !q) return esc(name);
    return esc(name.slice(0, i)) + "<mark>" + esc(name.slice(i, i + q.length)) + "</mark>" + esc(name.slice(i + q.length));
  }
  function kindTag(k) {
    var cls = { theorem: "k-thm", lemma: "k-thm", corollary: "k-thm", fact: "k-thm", definition: "k-def", fixpoint: "k-def", result: "k-res" }[k] || "";
    return '<span class="tag sr-kind ' + cls + '">' + esc(k) + "</span>";
  }

  function run() {
    var q = input.value.trim().toLowerCase();
    if (!q) { box.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
    var words = q.split(/[\s-]+/).filter(Boolean);
    var res = [];
    for (var i = 0; i < entries.length; i++) {
      var sc = score(entries[i], q, words);
      if (sc >= 0) res.push([sc, KIND_ORDER[entries[i].kind] || 1, -entries[i].rank, entries[i].name.length, entries[i]]);
    }
    var best = res.reduce(function (m, r) { return Math.min(m, r[0]); }, 9);
    if (best < 6) res = res.filter(function (r) { return r[0] !== 6; });
    res.sort(function (a, b) {
      return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3] || (a[4].name < b[4].name ? -1 : 1);
    });
    var total = res.length;
    shown = res.slice(0, 80).map(function (r) { return r[4]; });
    if (!shown.length) {
      box.innerHTML = '<div class="sr-empty">No declaration, file, result or glossary entry matches “' + esc(input.value.trim()) + '”.</div>';
    } else {
      box.innerHTML = shown.map(function (e, k) {
        return '<a class="sr-item" role="option" id="sr-' + k + '" href="' + esc(e.href) + '">' + kindTag(e.kind) +
          '<span class="sr-name">' + highlight(e.name, q) + '</span><span class="sr-sub">' + esc(e.sub) + "</span></a>";
      }).join("") + (total > shown.length ? '<div class="sr-more">' + (total - shown.length) + " more matches. Refine the search to see them.</div>" : "");
    }
    active = -1;
    box.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function setActive(k) {
    var items = box.querySelectorAll(".sr-item");
    if (!items.length) return;
    if (active >= 0 && items[active]) items[active].classList.remove("active");
    active = (k + items.length) % items.length;
    items[active].classList.add("active");
    items[active].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", "sr-" + active);
  }
  input.addEventListener("input", run);
  input.addEventListener("focus", function () { if (input.value.trim()) run(); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") {
      var items = box.querySelectorAll(".sr-item");
      var k = active >= 0 ? active : 0;
      if (items[k]) { e.preventDefault(); window.location.href = items[k].getAttribute("href"); box.hidden = true; }
    } else if (e.key === "Escape") { box.hidden = true; input.blur(); }
  });
  document.addEventListener("click", function (e) {
    if (!box.contains(e.target) && e.target !== input) box.hidden = true;
  });
  box.addEventListener("click", function () { box.hidden = true; });
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (!typing && (e.key === "/" || e.key === "s") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
})();
