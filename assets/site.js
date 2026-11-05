/* Salat First website: language, theme, live preview, gallery, share. No dependencies. */
(function () {
  "use strict";

  // Paste the Chrome Web Store listing URL here once it's published, e.g.
  // "https://chromewebstore.google.com/detail/salat-first/<extension-id>".
  // Every "Add to Chrome" and "Leave a review" link on the site follows it.
  var STORE_URL = "https://chromewebstore.google.com/search/Salat%20First";
  var SITE_URL = "https://zakaria-bali.github.io/salat-first/";

  var root = document.documentElement;
  var I18N = window.SF_I18N || { js: {} };
  var LANGS = ["en", "fr", "ar"];
  var lang = LANGS.indexOf(root.lang) >= 0 ? root.lang : "en";
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  function T() { return (I18N.js && (I18N.js[lang] || I18N.js.en)) || {}; }
  function fill(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; }); }

  /* ------------------------------------------------------------------ language */
  var originals = new WeakMap();
  function remember(el) {
    var rec = originals.get(el);
    if (!rec) {
      rec = { attrs: {} };
      if (el.hasAttribute("data-i18n")) rec.html = el.innerHTML;
      var spec = el.getAttribute("data-i18n-attr");
      if (spec) spec.split(";").forEach(function (pair) {
        var name = pair.split(":")[0].trim();
        rec.attrs[name] = el.getAttribute(name);
      });
      originals.set(el, rec);
    }
    return rec;
  }
  function lookup(dict, key, l) {
    if (!dict) return undefined;
    if (!(key in dict)) { if (window.console) console.warn("[i18n] missing " + l + " string: " + key); return undefined; }
    return dict[key];
  }
  function translate(l) {
    var dict = l === "en" ? null : (I18N[l] || {});
    all("[data-i18n]").forEach(function (el) {
      var rec = remember(el), v = lookup(dict, el.getAttribute("data-i18n"), l);
      el.innerHTML = v === undefined ? rec.html : v;
    });
    all("[data-i18n-attr]").forEach(function (el) {
      var rec = remember(el);
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":"), name = p[0].trim(), v = lookup(dict, p[1].trim(), l);
        el.setAttribute(name, v === undefined ? rec.attrs[name] : v);
      });
    });
    all("[data-js]").forEach(function (el) { var v = T()[el.getAttribute("data-js")]; if (v) el.textContent = v; });
    // Long-form pages (privacy policy) keep one block per language.
    var blocks = all("[data-lang-block]");
    if (blocks.length) {
      var has = blocks.some(function (b) { return b.getAttribute("data-lang-block") === l; });
      blocks.forEach(function (b) { b.hidden = b.getAttribute("data-lang-block") !== (has ? l : "en"); });
    }
  }
  function setLang(l, save) {
    lang = l;
    root.lang = l;
    root.dir = l === "ar" ? "rtl" : "ltr";
    translate(l);
    all("[data-set-lang]").forEach(function (a) { a.setAttribute("aria-current", String(a.getAttribute("data-set-lang") === l)); });
    if (save) {
      store.set("sf-lang", l);
      try {
        var u = new URL(location.href);
        if (l === "en") u.searchParams.delete("lang"); else u.searchParams.set("lang", l);
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch (e) { /* file:// or old browser */ }
    }
    themeLabel();
    document.dispatchEvent(new CustomEvent("sf:lang"));
    root.classList.remove("i18n-wait");
  }
  all("[data-set-lang]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var l = a.getAttribute("data-set-lang");
      if (l !== lang) setLang(l, true);
    });
  });

  /* ------------------------------------------------------------------ theme */
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  function theme() { return root.getAttribute("data-theme") || (mq.matches ? "dark" : "light"); }
  function themeLabel() {
    var b = $("themeBtn");
    if (b) b.setAttribute("aria-label", theme() === "dark" ? T().themeLight : T().themeDark);
  }
  if ($("themeBtn")) $("themeBtn").addEventListener("click", function () {
    var next = theme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("sf-theme", next);
    themeLabel();
  });
  if (mq.addEventListener) mq.addEventListener("change", themeLabel);

  /* ------------------------------------------------------------------ nav, links */
  var nav = $("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  all("[data-store]").forEach(function (a) { a.href = STORE_URL; });
  all("[data-store-review]").forEach(function (a) { a.href = STORE_URL.indexOf("/detail/") > 0 ? STORE_URL.replace(/\/$/, "") + "/reviews" : STORE_URL; });

  /* ------------------------------------------------------------------ toast */
  var toastTimer;
  function toast(msg) {
    var el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ------------------------------------------------------------------ share */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? ok() : fail(); } catch (e) { fail(e); }
      document.body.removeChild(ta);
    });
  }
  if ($("shareBtn")) $("shareBtn").addEventListener("click", function () {
    var url = SITE_URL + (lang === "en" ? "" : "?lang=" + lang);
    var data = { title: document.title, text: T().shareText, url: url };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    copyText(url).then(function () { toast(T().copied); }, function () { window.prompt("", url); });
  });

  /* ------------------------------------------------------------------ gallery */
  var tabs = all('[role="tab"]');
  function selectTab(i, focus) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = $(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(i); });
    t.addEventListener("keydown", function (e) {
      var step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step && root.dir === "rtl") step = -step;
      if (e.key === "Home") { e.preventDefault(); selectTab(0, true); }
      else if (e.key === "End") { e.preventDefault(); selectTab(tabs.length - 1, true); }
      else if (step) { e.preventDefault(); selectTab((i + step + tabs.length) % tabs.length, true); }
    });
  });
  var lb = $("lightbox");
  if (lb && lb.showModal) {
    all("button.zoom").forEach(function (b) {
      b.addEventListener("click", function () {
        var img = b.querySelector("img");
        $("lightboxImg").src = b.getAttribute("data-full");
        $("lightboxImg").alt = img ? img.alt : "";
        lb.showModal();
      });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* ------------------------------------------------------------------ live preview */
  var P = window.SFPrayer;
  var sky = $("sky");
  if (P && sky) livePreview();

  function livePreview() {
    var CITIES = [
      { id: "makkah", lat: 21.3891, lng: 39.8579, tz: "Asia/Riyadh", method: "umm" },
      { id: "madinah", lat: 24.4672, lng: 39.6111, tz: "Asia/Riyadh", method: "umm" },
      { id: "rabat", lat: 34.0209, lng: -6.8416, tz: "Africa/Casablanca", method: "morocco" },
      { id: "casablanca", lat: 33.5731, lng: -7.5898, tz: "Africa/Casablanca", method: "morocco" },
      { id: "algiers", lat: 36.7538, lng: 3.0588, tz: "Africa/Algiers", method: "mwl" },
      { id: "tunis", lat: 36.8065, lng: 10.1815, tz: "Africa/Tunis", method: "mwl" },
      { id: "cairo", lat: 30.0444, lng: 31.2357, tz: "Africa/Cairo", method: "egypt" },
      { id: "istanbul", lat: 41.0082, lng: 28.9784, tz: "Europe/Istanbul", method: "turkey" },
      { id: "dubai", lat: 25.2048, lng: 55.2708, tz: "Asia/Dubai", method: "dubai" },
      { id: "karachi", lat: 24.8607, lng: 67.0011, tz: "Asia/Karachi", method: "karachi", hanafi: true },
      { id: "jakarta", lat: -6.2088, lng: 106.8456, tz: "Asia/Jakarta", method: "sea" },
      { id: "kualalumpur", lat: 3.139, lng: 101.6869, tz: "Asia/Kuala_Lumpur", method: "sea" },
      { id: "paris", lat: 48.8566, lng: 2.3522, tz: "Europe/Paris", method: "mwl" },
      { id: "brussels", lat: 50.8503, lng: 4.3517, tz: "Europe/Brussels", method: "mwl" },
      { id: "london", lat: 51.5074, lng: -0.1278, tz: "Europe/London", method: "mwl" },
      { id: "montreal", lat: 45.5019, lng: -73.5674, tz: "America/Toronto", method: "isna" },
      { id: "newyork", lat: 40.7128, lng: -74.006, tz: "America/New_York", method: "isna" }
    ];
    var AR = { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء", jumuah: "الجمعة" };
    var ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
    var FIVE = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

    var userTz = "UTC";
    try { userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { /* keep UTC */ }

    function byId(id) { for (var i = 0; i < CITIES.length; i++) if (CITIES[i].id === id) return CITIES[i]; return null; }
    function methodForTz(tz) {
      if (/^Africa\/(Casablanca|El_Aaiun)$/.test(tz)) return { method: "morocco" };
      if (tz === "Asia/Riyadh") return { method: "umm" };
      if (tz === "Africa/Cairo") return { method: "egypt" };
      if (tz === "Europe/Istanbul") return { method: "turkey" };
      if (tz === "Asia/Dubai") return { method: "dubai" };
      if (tz === "Asia/Karachi") return { method: "karachi", hanafi: true };
      if (/^Asia\/(Jakarta|Makassar|Jayapura|Pontianak|Kuala_Lumpur|Kuching|Singapore|Brunei)$/.test(tz)) return { method: "sea" };
      if (/^America\//.test(tz)) return { method: "isna" };
      return { method: "mwl" };
    }
    // Default: the saved city, else the city in the visitor's own time zone, else Makkah.
    var guess = {
      "Asia/Riyadh": "makkah", "Africa/Casablanca": "rabat", "Africa/Algiers": "algiers", "Africa/Tunis": "tunis",
      "Africa/Cairo": "cairo", "Europe/Istanbul": "istanbul", "Asia/Dubai": "dubai", "Asia/Karachi": "karachi",
      "Asia/Jakarta": "jakarta", "Asia/Kuala_Lumpur": "kualalumpur", "Europe/Paris": "paris", "Europe/Brussels": "brussels",
      "Europe/London": "london", "America/Toronto": "montreal", "America/Montreal": "montreal", "America/New_York": "newyork"
    };
    var place = byId(store.get("sf-city")) || byId(guess[userTz]) || CITIES[0];
    var here = null;          // the visitor's own position; kept in memory only, never saved
    var status = null;        // { key, vars } so it can be re-translated
    var state = null;

    var select = $("city");
    function buildOptions() {
      var t = T(), frag = document.createDocumentFragment();
      if (here) { var o = document.createElement("option"); o.value = "here"; o.textContent = t.here; frag.appendChild(o); }
      CITIES.forEach(function (c) { var o = document.createElement("option"); o.value = c.id; o.textContent = t.cities[c.id]; frag.appendChild(o); });
      select.innerHTML = "";
      select.appendChild(frag);
      select.value = place.id;
    }
    select.addEventListener("change", function () {
      place = select.value === "here" ? here : byId(select.value);
      if (place.id !== "here") store.set("sf-city", place.id);
      setStatus(null);
      render();
    });

    function setStatus(key, vars) {
      status = key ? { key: key, vars: vars || {} } : null;
      $("liveStatus").textContent = status ? fill(T()[status.key], status.vars) : "";
    }

    $("locate").addEventListener("click", function () {
      if (!navigator.geolocation) { setStatus("locFail"); return; }
      setStatus("locating");
      navigator.geolocation.getCurrentPosition(function (pos) {
        var m = methodForTz(userTz);
        here = { id: "here", lat: pos.coords.latitude, lng: pos.coords.longitude, tz: userTz, method: m.method, hanafi: !!m.hanafi };
        place = here;
        buildOptions();
        setStatus("locOk", { c: here.lat.toFixed(2) + "°, " + here.lng.toFixed(2) + "°" });
        render();
      }, function (err) {
        setStatus(err && err.code === 1 ? "locDenied" : "locFail");
      }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
    });

    // Intl formatters are costly to build; cache them per language + zone.
    var fmtCache = {};
    function formatter(kind, opts) {
      var t = T(), k = kind + "|" + t.locale + "|" + place.tz;
      if (!fmtCache[k]) {
        var o = { timeZone: place.tz, numberingSystem: "latn" };
        for (var x in opts) o[x] = opts[x];
        try { fmtCache[k] = new Intl.DateTimeFormat(t.locale, o); }
        catch (e) { delete o.calendar; fmtCache[k] = new Intl.DateTimeFormat(t.locale, o); }
      }
      return fmtCache[k];
    }
    function hhmm(ms) { return isNaN(ms) ? "—" : formatter("t", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(ms)); }
    function weekday(ms) {
      return new Intl.DateTimeFormat("en-US", { timeZone: place.tz, weekday: "short" }).format(new Date(ms));
    }
    function untilText(ms) {
      var t = T(), min = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(min / 60), m = min % 60;
      return h ? fill(t.inHM, { h: h, m: m < 10 ? "0" + m : m }) : fill(t.inM, { m: m });
    }
    function clock(ms) {
      var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
      s = s % 60;
      return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }
    function phaseAt(n, d) {
      if (isNaN(d.sunrise) || isNaN(d.maghrib)) {
        var hour = +new Intl.DateTimeFormat("en-US", { timeZone: place.tz, hour: "numeric", hourCycle: "h23" }).format(new Date(n));
        return hour >= 6 && hour < 18 ? "day" : "night";
      }
      if (n < d.fajr) return "night";
      if (n < d.sunrise) return "dawn";
      if (n < d.dhuhr) return "morning";
      if (n < d.asr) return "day";
      if (n < d.maghrib) return "afternoon";
      if (n < d.isha) return "dusk";
      return "night";
    }
    // Lit part of the moon for a phase (0 new, .5 full), as an SVG path of radius r.
    function moonPath(phase, r) {
      var c = Math.cos(2 * Math.PI * phase), rx = (Math.abs(c) * r).toFixed(2), waxing = phase < 0.5;
      var limb = waxing ? 1 : 0, term = waxing ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0);
      return "M0," + -r + " A" + r + "," + r + " 0 0 " + limb + " 0," + r + " A" + rx + "," + r + " 0 0 " + term + " 0," + -r + " Z";
    }

    function compute(now) {
      var r = P.forPlace(place, now), d = r.today, next = null;
      for (var i = 0; i < FIVE.length; i++) {
        var k = FIVE[i];
        if (!isNaN(d[k]) && d[k] > now) { next = { key: k, at: d[k] }; break; }
      }
      if (!next) next = { key: "fajr", at: r.tomorrow.fajr };
      if (next.key === "dhuhr" && weekday(next.at) === "Fri") next.label = "jumuah";
      return { day: d, next: next, at: +now, place: place };
    }

    function render() {
      var now = Date.now(), t = T();
      state = compute(now);
      var d = state.day, next = state.next, label = next.label || next.key;

      // sky card
      var phase = phaseAt(now, d);
      sky.setAttribute("data-phase", phase);
      $("skyAr").textContent = AR[label];
      $("skyName").textContent = t.prayers[label];
      $("skyTime").textContent = hhmm(next.at);
      var sun = $("skySun"), moon = $("skyMoon");
      var light = phase === "morning" || phase === "day" || phase === "afternoon";
      sun.style.opacity = light ? "1" : "0";
      if (light) {
        var p = Math.min(1, Math.max(0, (now - d.sunrise) / (d.maghrib - d.sunrise)));
        sun.style.setProperty("--sx", (24 + 64 * p).toFixed(1) + "%");
        sun.style.setProperty("--sy", (72 - 46 * Math.sin(Math.PI * p)).toFixed(1) + "%");
      }
      var mp = P.moonPhase(new Date(now)), lit = (1 - Math.cos(2 * Math.PI * mp)) / 2;
      moon.hidden = light || lit < 0.03;
      $("moonLit").setAttribute("d", moonPath(mp, 16));

      // today list
      var ol = $("times"), frag = document.createDocumentFragment();
      ORDER.forEach(function (k) {
        var li = document.createElement("li"), name = k === "dhuhr" && next.label === "jumuah" ? "jumuah" : k;
        if (k === "sunrise") li.className = "is-sunrise";
        else if (k === next.key && d[k] === next.at) li.className = "is-next";
        else if (d[k] <= now) li.className = "is-past";
        var ar = document.createElement("span"); ar.className = "ar"; ar.lang = "ar"; ar.textContent = AR[name];
        var nm = document.createElement("span"); nm.className = "nm";
        var n = document.createElement("span"); n.className = "n"; n.textContent = t.prayers[name]; nm.appendChild(n);
        if (li.className === "is-next") { var inEl = document.createElement("span"); inEl.className = "in"; inEl.id = "nextIn"; nm.appendChild(inEl); }
        var tm = document.createElement("time"); tm.textContent = hhmm(d[k]);
        li.appendChild(ar); li.appendChild(nm); li.appendChild(tm);
        frag.appendChild(li);
      });
      ol.innerHTML = "";
      ol.appendChild(frag);

      // dates, qibla, local time, method
      var nowD = new Date(now);
      $("todayDate").textContent = formatter("date", { weekday: "long", day: "numeric", month: "long" }).format(nowD);
      try { $("hijri").textContent = formatter("hijri", { calendar: "islamic-umalqura", day: "numeric", month: "long", year: "numeric" }).format(nowD); }
      catch (e) { $("hijriChip").hidden = true; }
      var q = P.qibla(place.lat, place.lng);
      $("qibla").textContent = fill(t.qibla, { d: Math.round(q) });
      $("qiblaNeedle").style.transform = "rotate(" + q.toFixed(1) + "deg)";
      $("method").textContent = fill(t.method, { m: t.methods[place.method] }) + (place.hanafi ? " · " + t.hanafi : "");
      tick();
    }

    function tick() {
      var now = Date.now();
      if (!state || state.place !== place || now >= state.next.at || now - state.at > 30000) { render(); return; }
      var left = state.next.at - now;
      $("skyCount").textContent = isNaN(left) ? "--:--:--" : clock(left);
      var inEl = $("nextIn");
      if (inEl) inEl.textContent = untilText(left);
      $("localTime").textContent = fill(T().local, { t: hhmm(now) });
    }

    document.addEventListener("sf:lang", function () {
      fmtCache = {};
      buildOptions();
      if (status) setStatus(status.key, status.vars);
      render();
    });

    buildOptions();
    render();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------ start */
  try {
    var q = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(q) >= 0) store.set("sf-lang", q);
  } catch (e) { /* ignore */ }
  setLang(lang, false);
})();
